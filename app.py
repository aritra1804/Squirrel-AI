
import os
import hashlib
import subprocess
import tempfile
import shutil
from pathlib import Path

import streamlit as st

import ollama
import chromadb
from sentence_transformers import SentenceTransformer

# ------------------------------------------------------------------------------------
# SETTINGS: adjust these if needed
# ------------------------------------------------------------------------------------
OLLAMA_MODEL_NAME = "llama3.2"            # Ollama model identifier
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2" # Sentence-Transformers model for embeddings
CHUNK_SIZE = 500         # characters per chunk
CHUNK_OVERLAP = 50       # overlap between chunks
TOP_K = 4                # how many chunks to retrieve for QA
CACHE_DIR = Path("cached_repos")  # where cloned repos are stored (no on‐disk index)
# ------------------------------------------------------------------------------------

st.set_page_config(page_title="GitHub Repo Explainer", layout="wide")
st.title("📦 GitHub Repo Explainer (Ollama 3.2 + Streamlit)")

# Ensure CACHE_DIR exists
CACHE_DIR.mkdir(exist_ok=True)


def hash_url(url: str) -> str:
    """Return a short hash for a given URL to use as folder name."""
    return hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]


@st.cache_resource
def clone_and_prepare(repo_url: str):
    """
    1. Clone (or reuse) the GitHub repo locally.
    2. Parse code files into overlapping text chunks.
    3. Compute embeddings and build an in‐memory Chroma index.
    4. Return the repo path, Chroma collection, and README text (first ~10K chars).

    Because this uses @st.cache_resource, returning a Chroma collection (unserializable)
    is safe. A new resource is created per unique repo_url.
    """
    repo_hash = hash_url(repo_url)
    repo_dir = CACHE_DIR / repo_hash

    # 1. CLONE if needed
    if not repo_dir.exists():
        tmp_clone = tempfile.mkdtemp()
        try:
            subprocess.run(
                ["git", "clone", "--depth=1", repo_url, tmp_clone],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            shutil.move(tmp_clone, repo_dir)
        except subprocess.CalledProcessError:
            shutil.rmtree(tmp_clone, ignore_errors=True)
            raise RuntimeError("Failed to clone repository. Check the URL or your network.")
    repo_path = repo_dir

    # 2. SET UP IN‐MEMORY CHROMA CLIENT (no on‐disk persistence)
    client = chromadb.Client()
    try:
        collection = client.get_collection("repo_chunks")
        # If this collection already has data, assume it’s from a prior call in this session
        if collection.count() > 0:
            return repo_path, collection, _load_readme(repo_path)
    except Exception:
        collection = client.create_collection("repo_chunks")

    # 3. PARSE CODE FILES INTO CHUNKS
    code_chunks = []
    metadatas = []

    # Supported extensions (add more if needed)
    exts = [".py", ".js", ".ts", ".java", ".go", ".cpp", ".c", ".rb"]
    for ext in exts:
        for file_path in repo_path.rglob(f"*{ext}"):
            try:
                text = file_path.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue
            # Split into fixed-size overlapping character chunks
            start = 0
            text_len = len(text)
            while start < text_len:
                end = min(start + CHUNK_SIZE, text_len)
                chunk = text[start:end]
                code_chunks.append(chunk)
                metadatas.append({
                    "path": str(file_path.relative_to(repo_path)),
                    "start_char": start,
                    "end_char": end
                })
                # Advance with overlap
                start += CHUNK_SIZE - CHUNK_OVERLAP

    # If no code files found, keep the collection empty
    if not code_chunks:
        return repo_path, collection, _load_readme(repo_path)

    # 4. EMBEDDINGS (Sentence-Transformers)
    embedder = SentenceTransformer(EMBEDDING_MODEL_NAME)
    embeddings = embedder.encode(code_chunks, show_progress_bar=True)

    # 5. STORE IN CHROMA (in‐memory for this session)
    ids = [str(i) for i in range(len(code_chunks))]
    collection.add(
        ids=ids,
        documents=code_chunks,
        embeddings=embeddings.tolist(),
        metadatas=metadatas,
    )

    return repo_path, collection, _load_readme(repo_path)


def _load_readme(repo_path: Path) -> str:
    """
    Try to find a README file (MD/TXT) in the repo root and return its first ~10K chars.
    If none, return an empty string.
    """
    for name in ("README.md", "README.MD", "README.txt", "readme.md"):
        readme_path = repo_path / name
        if readme_path.exists():
            try:
                return readme_path.read_text(encoding="utf-8", errors="ignore")[:10000]
            except Exception:
                return ""
    return ""


@st.cache_data(show_spinner=False)
def generate_summary(readme_text: str, repo_path: Path) -> str:
    """
    Generate a high-level summary of the repository using Ollama 3.2.
    We feed the model the README (if any) plus a listing of top-level files/folders.
    """
    # Build a listing of top-level directories & files
    top_items = sorted(
        [p.name for p in repo_path.iterdir() if not p.name.startswith(".")]
    )
    listing = "\n".join(top_items[:20])  # only show the first 20 entries

    prompt = f"""
You are a codebase summarization assistant. Provide a concise summary of this repository:
- The purpose of the project
- Main languages or frameworks used
- Key directories or files (from the listing)
- Important details from the README (if present)

README CONTENT (first 10k chars):
\"\"\"{readme_text}\"\"\"

TOP-LEVEL CONTENTS:
{listing}

Output a brief paragraph summarizing the repository.
"""

    try:
        response = ollama.chat(
            model=OLLAMA_MODEL_NAME,
            messages=[{"role": "user", "content": prompt}]
        )
        # Use the new structure: response["message"]["content"]
        return response["message"]["content"].strip()
    except Exception as e:
        return f"(Error generating summary: {e})"


def answer_question(question: str, collection: chromadb.api.models.Collection.Collection) -> str:
    """
    Given a user question, retrieve the TOP_K most relevant code chunks via embedding similarity,
    then prompt Ollama to answer using only those chunks as context.  
    Also, if the question is simply “what is the repo about?”, return the stored summary.
    """
    # If the user asks “what is the repo about?”, return the summary directly
    lower_q = question.strip().lower()
    if "repo about" in lower_q or lower_q.startswith("what is the repo"):
        return st.session_state.repo_summary

    # Otherwise, perform RAG over code chunks
    embedder = SentenceTransformer(EMBEDDING_MODEL_NAME)
    q_embedding = embedder.encode([question])[0]

    # Retrieve top-k relevant chunks
    results = collection.query(
        query_embeddings=[q_embedding.tolist()],
        n_results=TOP_K,
    )
    retrieved_chunks = results["documents"][0]   # list of text chunks
    retrieved_metas = results["metadatas"][0]     # list of metadata dicts

    # Build a context string that labels each chunk with its file path
    context_parts = []
    for chunk, meta in zip(retrieved_chunks, retrieved_metas):
        path = meta.get("path", "unknown")
        context_parts.append(f"### File: {path}\n{chunk}")
    context = "\n\n".join(context_parts)

    prompt = f"""
You are an expert code assistant. Use ONLY the following code context to answer the user’s question. 
If the answer does not appear in the provided context, say “I don't see information about that in the provided code.”

CONTEXT:
{context}

QUESTION:
\"\"\"{question}\"\"\"

Provide a concise, accurate answer. Reference file paths if it helps.
"""

    try:
        response = ollama.chat(
            model=OLLAMA_MODEL_NAME,
            messages=[{"role": "user", "content": prompt}]
        )
        # Use response["message"]["content"]
        return response["message"]["content"].strip()
    except Exception as e:
        return f"(Error generating answer: {e})"


# -------------------------
# STREAMLIT UI
# -------------------------
if "repo_loaded" not in st.session_state:
    st.session_state.repo_loaded = False
    st.session_state.repo_summary = ""
    st.session_state.collection = None
    st.session_state.repo_path = None
    st.session_state.readme = ""

with st.sidebar:
    st.header("📥 Load a GitHub Repo")
    input_url = st.text_input(
        "Enter GitHub repo URL:",
        placeholder="https://github.com/owner/repo"
    )
    if st.button("▶️ Load and Analyze"):
        if not input_url.strip():
            st.sidebar.error("Please enter a valid GitHub URL.")
        else:
            try:
                with st.spinner("Cloning, parsing, and indexing…"):
                    repo_path, collection, readme_text = clone_and_prepare(input_url.strip())
                    summary = generate_summary(readme_text, repo_path)

                st.session_state.repo_loaded = True
                st.session_state.repo_summary = summary
                st.session_state.collection = collection
                st.session_state.repo_path = repo_path
                st.session_state.readme = readme_text
                st.success("Repository loaded and indexed successfully!")

            except RuntimeError as re:
                st.session_state.repo_loaded = False
                st.error(str(re))
            except Exception as e:
                st.session_state.repo_loaded = False
                st.error(f"Unexpected error: {e}")

# Main content area
if st.session_state.repo_loaded:
    st.subheader("📝 Repository Summary")
    st.markdown(st.session_state.repo_summary)

    st.subheader("💬 Ask Questions About This Repo")
    user_question = st.text_input("Your question:", key="q_input")
    if user_question:
        with st.spinner("Generating answer…"):
            answer = answer_question(user_question, st.session_state.collection)

        st.markdown(f"**You:** {user_question}")
        st.markdown(f"**Assistant:** {answer}")

        # We no longer try to clear st.session_state.q_input here

    with st.expander("📂 Show file structure"):
        for p in sorted(st.session_state.repo_path.rglob("*")):
            rel = p.relative_to(st.session_state.repo_path)
            indent = " " * (len(rel.parts) - 1)
            st.text(f"{indent}{rel.name}")
else:
    st.info("Enter a GitHub URL in the sidebar and click ▶️ Load and Analyze to begin.")
