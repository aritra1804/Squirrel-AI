import os
import hashlib
import subprocess
import tempfile
import shutil
from pathlib import Path
from typing import Optional, Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl, field_validator
import ollama
import chromadb
from sentence_transformers import SentenceTransformer

# Settings
OLLAMA_MODEL_NAME = "llama3.2"
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
TOP_K = 4
CACHE_DIR = Path("cached_repos")

app = FastAPI(title="GitHub Repo Explainer API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Vite's default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure CACHE_DIR exists
CACHE_DIR.mkdir(exist_ok=True)

class RepoRequest(BaseModel):
    url: str

    @field_validator('url')
    @classmethod
    def validate_url(cls, v):
        if not v.startswith(('http://', 'https://')):
            raise ValueError('URL must start with http:// or https://')
        if not v.startswith('https://github.com/'):
            raise ValueError('URL must be a GitHub repository URL')
        return v

class QuestionRequest(BaseModel):
    question: str
    repo_url: str

    @field_validator('repo_url')
    @classmethod
    def validate_url(cls, v):
        if not v.startswith(('http://', 'https://')):
            raise ValueError('URL must start with http:// or https://')
        if not v.startswith('https://github.com/'):
            raise ValueError('URL must be a GitHub repository URL')
        return v

def hash_url(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]

def clone_and_prepare(repo_url: str):
    repo_hash = hash_url(repo_url)
    repo_dir = CACHE_DIR / repo_hash

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
            raise HTTPException(status_code=400, detail="Failed to clone repository")

    client = chromadb.Client()
    try:
        collection = client.get_collection("repo_chunks")
        if collection.count() > 0:
            return repo_dir, collection, _load_readme(repo_dir)
    except Exception:
        collection = client.create_collection("repo_chunks")

    code_chunks = []
    metadatas = []

    exts = [".py", ".js", ".ts", ".java", ".go", ".cpp", ".c", ".rb"]
    for ext in exts:
        for file_path in repo_dir.rglob(f"*{ext}"):
            try:
                text = file_path.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue
            start = 0
            text_len = len(text)
            while start < text_len:
                end = min(start + CHUNK_SIZE, text_len)
                chunk = text[start:end]
                code_chunks.append(chunk)
                metadatas.append({
                    "path": str(file_path.relative_to(repo_dir)),
                    "start_char": start,
                    "end_char": end
                })
                start += CHUNK_SIZE - CHUNK_OVERLAP

    if not code_chunks:
        return repo_dir, collection, _load_readme(repo_dir)

    embedder = SentenceTransformer(EMBEDDING_MODEL_NAME)
    embeddings = embedder.encode(code_chunks, show_progress_bar=True)

    ids = [str(i) for i in range(len(code_chunks))]
    collection.add(
        ids=ids,
        documents=code_chunks,
        embeddings=embeddings.tolist(),
        metadatas=metadatas,
    )

    return repo_dir, collection, _load_readme(repo_dir)

def _load_readme(repo_path: Path) -> str:
    for name in ("README.md", "README.MD", "README.txt", "readme.md"):
        readme_path = repo_path / name
        if readme_path.exists():
            try:
                return readme_path.read_text(encoding="utf-8", errors="ignore")[:10000]
            except Exception:
                return ""
    return ""

def generate_summary(readme_text: str, repo_path: Path) -> str:
    top_items = sorted(
        [p.name for p in repo_path.iterdir() if not p.name.startswith(".")]
    )
    listing = "\n".join(top_items[:20])

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
        return response["message"]["content"].strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")

def answer_question(question: str, collection: chromadb.api.models.Collection.Collection, repo_summary: str) -> str:
    lower_q = question.strip().lower()
    if "repo about" in lower_q or lower_q.startswith("what is the repo"):
        return repo_summary

    embedder = SentenceTransformer(EMBEDDING_MODEL_NAME)
    q_embedding = embedder.encode([question])[0]

    results = collection.query(
        query_embeddings=[q_embedding.tolist()],
        n_results=TOP_K,
    )
    retrieved_chunks = results["documents"][0]
    retrieved_metas = results["metadatas"][0]

    context_parts = []
    for chunk, meta in zip(retrieved_chunks, retrieved_metas):
        path = meta.get("path", "unknown")
        context_parts.append(f"### File: {path}\n{chunk}")
    context = "\n\n".join(context_parts)

    prompt = f"""
You are an expert code assistant. Use ONLY the following code context to answer the user's question. 
If the answer does not appear in the provided context, answer to your best ability based on the context.

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
        return response["message"]["content"].strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating answer: {str(e)}")

@app.post("/analyze")
async def analyze_repo(request: RepoRequest) -> Dict[str, Any]:
    try:
        repo_path, collection, readme = clone_and_prepare(request.url)
        summary = generate_summary(readme, repo_path)
        return {
            "summary": summary,
            "readme": readme
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask")
async def ask_question(request: QuestionRequest) -> Dict[str, str]:
    try:
        repo_path, collection, readme = clone_and_prepare(request.repo_url)
        summary = generate_summary(readme, repo_path)
        answer = answer_question(request.question, collection, summary)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 