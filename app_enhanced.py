import os
import hashlib
import subprocess
import tempfile
import shutil
import ast
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
import re

import streamlit as st
from openai import OpenAI
import chromadb
from sentence_transformers import SentenceTransformer

# ------------------------------------------------------------------------------------
# SETTINGS: adjust these if needed
# ------------------------------------------------------------------------------------
OPENAI_MODEL = "gpt-3.5-turbo"  # or "gpt-4" if you have access
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
CHUNK_SIZE = 1000       # increased for better context
CHUNK_OVERLAP = 100     # increased overlap
TOP_K = 6              # more chunks for better context
CACHE_DIR = Path("cached_repos")
USE_FALLBACK_MODE = False  # Set to True to use basic analysis without OpenAI
# ------------------------------------------------------------------------------------

st.set_page_config(page_title="Squirrel AI - Play with Repositories", layout="wide")
st.title("🐿️ Squirrel AI - Play with Repositories")

# Ensure CACHE_DIR exists
CACHE_DIR.mkdir(exist_ok=True)

# Initialize OpenAI client
@st.cache_resource
def get_openai_client():
    """Initialize OpenAI client with API key from environment."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        st.error("⚠️ OPENAI_API_KEY not found in environment variables. Please set it.")
        return None
    return OpenAI(api_key=api_key)


def hash_url(url: str) -> str:
    """Return a short hash for a given URL to use as folder name."""
    return hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]


def extract_code_structure(file_path: Path) -> Dict[str, Any]:
    """Extract code structure (functions, classes, imports) from Python files."""
    if file_path.suffix != '.py':
        return {}
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        tree = ast.parse(content)
        structure = {
            'imports': [],
            'functions': [],
            'classes': [],
            'variables': []
        }
        
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    structure['imports'].append(alias.name)
            elif isinstance(node, ast.ImportFrom):
                module = node.module or ''
                for alias in node.names:
                    structure['imports'].append(f"{module}.{alias.name}")
            elif isinstance(node, ast.FunctionDef):
                structure['functions'].append({
                    'name': node.name,
                    'line': node.lineno,
                    'args': [arg.arg for arg in node.args.args],
                    'docstring': ast.get_docstring(node) or ''
                })
            elif isinstance(node, ast.ClassDef):
                methods = []
                for child in node.body:
                    if isinstance(child, ast.FunctionDef):
                        methods.append({
                            'name': child.name,
                            'line': child.lineno,
                            'args': [arg.arg for arg in child.args.args],
                            'docstring': ast.get_docstring(child) or ''
                        })
                structure['classes'].append({
                    'name': node.name,
                    'line': node.lineno,
                    'methods': methods,
                    'docstring': ast.get_docstring(node) or ''
                })
        
        return structure
    except Exception as e:
        return {'error': str(e)}


def parse_code_files(repo_path: Path) -> Dict[str, Any]:
    """Parse all code files and extract structure information."""
    code_structure = {}
    
    # Supported extensions
    exts = [".py", ".js", ".ts", ".java", ".go", ".cpp", ".c", ".rb", ".php", ".html", ".css", ".jsx", ".tsx"]
    
    for ext in exts:
        for file_path in repo_path.rglob(f"*{ext}"):
            rel_path = str(file_path.relative_to(repo_path))
            
            # Skip common directories
            if any(skip in rel_path for skip in ['.git', '__pycache__', 'node_modules', '.venv', 'venv']):
                continue
                
            if ext == '.py':
                code_structure[rel_path] = extract_code_structure(file_path)
            else:
                # For non-Python files, just store basic info
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    code_structure[rel_path] = {
                        'type': 'file',
                        'size': len(content),
                        'lines': len(content.splitlines())
                    }
                except Exception:
                    continue
    
    return code_structure


@st.cache_resource
def clone_and_prepare(repo_url: str):
    """
    Enhanced version that also extracts code structure and uses OpenAI for better analysis.
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

    # 2. SET UP IN‐MEMORY CHROMA CLIENT
    client = chromadb.Client()
    try:
        collection = client.get_collection("repo_chunks")
        if collection.count() > 0:
            return repo_path, collection, _load_readme(repo_path), parse_code_files(repo_path)
    except Exception:
        collection = client.create_collection("repo_chunks")

    # 3. PARSE CODE FILES INTO CHUNKS
    code_chunks = []
    metadatas = []

    # Supported extensions
    exts = [".py", ".js", ".ts", ".java", ".go", ".cpp", ".c", ".rb", ".php", ".html", ".css", ".jsx", ".tsx"]
    for ext in exts:
        for file_path in repo_path.rglob(f"*{ext}"):
            # Skip common directories
            if any(skip in str(file_path) for skip in ['.git', '__pycache__', 'node_modules', '.venv', 'venv']):
                continue
                
            try:
                text = file_path.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue
                
            # Split into chunks with better context preservation
            start = 0
            text_len = len(text)
            while start < text_len:
                end = min(start + CHUNK_SIZE, text_len)
                chunk = text[start:end]
                code_chunks.append(chunk)
                metadatas.append({
                    "path": str(file_path.relative_to(repo_path)),
                    "start_char": start,
                    "end_char": end,
                    "extension": ext
                })
                start += CHUNK_SIZE - CHUNK_OVERLAP

    # 4. EMBEDDINGS
    if code_chunks:
        embedder = SentenceTransformer(EMBEDDING_MODEL_NAME)
        embeddings = embedder.encode(code_chunks, show_progress_bar=True)

        # 5. STORE IN CHROMA
        ids = [str(i) for i in range(len(code_chunks))]
        collection.add(
            ids=ids,
            documents=code_chunks,
            embeddings=embeddings.tolist(),
            metadatas=metadatas,
        )

    return repo_path, collection, _load_readme(repo_path), parse_code_files(repo_path)


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
def generate_summary(readme_text: str, repo_path: Path, code_structure: Dict[str, Any], fallback_mode: bool = False) -> str:
    """
    Generate a comprehensive summary using OpenAI or basic analysis.
    """
    if fallback_mode:
        return generate_basic_summary(readme_text, repo_path, code_structure)
    
    client = get_openai_client()
    if not client:
        return generate_basic_summary(readme_text, repo_path, code_structure)
    
    # Build a listing of top-level directories & files
    top_items = sorted(
        [p.name for p in repo_path.iterdir() if not p.name.startswith(".")]
    )
    listing = "\n".join(top_items[:30])

    # Extract key statistics
    total_files = len(code_structure)
    python_files = len([f for f in code_structure.keys() if f.endswith('.py')])
    js_files = len([f for f in code_structure.keys() if f.endswith(('.js', '.jsx', '.ts', '.tsx'))])
    
    # Count functions and classes
    total_functions = sum(len(structure.get('functions', [])) for structure in code_structure.values())
    total_classes = sum(len(structure.get('classes', [])) for structure in code_structure.values())

    prompt = f"""
You are an expert codebase analyst. Provide a comprehensive, developer-friendly summary of this repository.

REPOSITORY ANALYSIS:
- Total files: {total_files}
- Python files: {python_files}
- JavaScript/TypeScript files: {js_files}
- Total functions: {total_functions}
- Total classes: {total_classes}

README CONTENT:
{readme_text[:10000]}

TOP-LEVEL CONTENTS:
{listing}

CODE STRUCTURE HIGHLIGHTS:
{json.dumps({k: v for k, v in list(code_structure.items())[:10]}, indent=2)}

Please provide:
1. **Project Purpose**: What does this project do?
2. **Tech Stack**: What technologies, frameworks, and languages are used?
3. **Architecture**: Key components and how they're organized
4. **Getting Started**: Quick setup instructions for developers
5. **Key Features**: Main functionality and capabilities
6. **File Structure**: Important directories and their purposes

Format your response in markdown with clear sections.
"""

    try:
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000,
            temperature=0.3
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return generate_basic_summary(readme_text, repo_path, code_structure)


def generate_basic_summary(readme_text: str, repo_path: Path, code_structure: Dict[str, Any]) -> str:
    """Generate a basic summary without OpenAI API."""
    # Build a listing of top-level directories & files
    top_items = sorted(
        [p.name for p in repo_path.iterdir() if not p.name.startswith(".")]
    )
    listing = "\n".join(top_items[:20])

    # Extract key statistics
    total_files = len(code_structure)
    python_files = len([f for f in code_structure.keys() if f.endswith('.py')])
    js_files = len([f for f in code_structure.keys() if f.endswith(('.js', '.jsx', '.ts', '.tsx'))])
    
    # Count functions and classes
    total_functions = sum(len(structure.get('functions', [])) for structure in code_structure.values())
    total_classes = sum(len(structure.get('classes', [])) for structure in code_structure.values())

    summary = f"""
## 📋 Repository Overview (Basic Analysis)

### 📊 Project Statistics
- **Total Files**: {total_files}
- **Python Files**: {python_files}
- **JavaScript/TypeScript Files**: {js_files}
- **Total Functions**: {total_functions}
- **Total Classes**: {total_classes}

### 📁 Top-Level Structure
```
{listing}
```

### 📖 README Content
{readme_text[:2000]}{'...' if len(readme_text) > 2000 else ''}

### 🔍 Key Files Found
"""
    
    # Show some key files
    key_files = list(code_structure.keys())[:10]
    for file in key_files:
        ext = file.split('.')[-1] if '.' in file else 'unknown'
        summary += f"- **{file}** ({ext.upper()})\n"
    
    summary += f"""
### 💡 Analysis Notes
- This appears to be a {'Python' if python_files > js_files else 'JavaScript/TypeScript' if js_files > python_files else 'mixed'} project
- {'Has significant code structure' if total_functions > 0 or total_classes > 0 else 'Basic file structure'}
- {'Contains documentation' if readme_text else 'No README found'}

### 🔧 Next Steps
To get AI-powered analysis:
1. Add credits to your OpenAI account, or
2. Use the original app.py with Ollama (if you have it installed)
"""
    
    return summary


def answer_question(question: str, collection: chromadb.api.models.Collection.Collection, 
                   code_structure: Dict[str, Any], repo_path: Path) -> str:
    """
    Enhanced Q&A using OpenAI with better context and code structure awareness.
    """
    client = get_openai_client()
    if not client:
        return "OpenAI client not available. Please set OPENAI_API_KEY."

    # Special handling for common questions
    lower_q = question.strip().lower()
    if any(phrase in lower_q for phrase in ["repo about", "what is the repo", "project purpose"]):
        return st.session_state.repo_summary

    # Retrieve relevant code chunks
    embedder = SentenceTransformer(EMBEDDING_MODEL_NAME)
    q_embedding = embedder.encode([question])[0]

    results = collection.query(
        query_embeddings=[q_embedding.tolist()],
        n_results=TOP_K,
    )
    retrieved_chunks = results["documents"][0]
    retrieved_metas = results["metadatas"][0]

    # Build enhanced context
    context_parts = []
    for chunk, meta in zip(retrieved_chunks, retrieved_metas):
        path = meta.get("path", "unknown")
        ext = meta.get("extension", "")
        
        # Add code structure info if available
        structure_info = ""
        if path in code_structure:
            structure = code_structure[path]
            if 'functions' in structure and structure['functions']:
                func_names = [f['name'] for f in structure['functions'][:3]]
                structure_info = f"\nFunctions in this file: {', '.join(func_names)}"
            if 'classes' in structure and structure['classes']:
                class_names = [c['name'] for c in structure['classes'][:3]]
                structure_info += f"\nClasses in this file: {', '.join(class_names)}"
        
        context_parts.append(f"### File: {path} ({ext}){structure_info}\n```{ext}\n{chunk}\n```")

    context = "\n\n".join(context_parts)

    # Enhanced prompt for better code understanding
    prompt = f"""
You are an expert software developer and code analyst. Answer the user's question about this codebase using the provided context.

CONTEXT (Relevant code files and their structure):
{context}

CODEBASE STRUCTURE SUMMARY:
{json.dumps({k: v for k, v in list(code_structure.items())[:5]}, indent=2)}

QUESTION: {question}

INSTRUCTIONS:
1. Use ONLY the provided code context to answer
2. If the answer isn't in the context, say "I don't see information about that in the provided code"
3. Reference specific file paths and line numbers when relevant
4. Explain code patterns, architecture decisions, and implementation details
5. Provide practical insights for developers working with this codebase
6. If asked about implementation, suggest approaches based on the existing patterns

Provide a comprehensive, developer-friendly answer.
"""

    try:
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=800,
            temperature=0.2
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"(Error generating answer: {e})"


def generate_code_explanation(file_path: str, code_structure: Dict[str, Any]) -> str:
    """Generate detailed explanation of a specific file."""
    client = get_openai_client()
    if not client:
        return "OpenAI client not available."
    
    if file_path not in code_structure:
        return "File not found in codebase."
    
    structure = code_structure[file_path]
    
    prompt = f"""
Analyze this code file and provide a detailed explanation for developers.

FILE: {file_path}

CODE STRUCTURE:
{json.dumps(structure, indent=2)}

Please provide:
1. **File Purpose**: What does this file do?
2. **Key Components**: Functions, classes, and their purposes
3. **Dependencies**: What does this file import/depend on?
4. **Usage**: How would other developers use this file?
5. **Architecture**: How does it fit into the overall project?

Format your response in markdown.
"""

    try:
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=600,
            temperature=0.2
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"(Error generating explanation: {e})"


def generate_basic_analysis(file_path: str, code_structure: Dict[str, Any], repo_path: Path) -> str:
    """Generate basic code analysis without OpenAI API."""
    if file_path not in code_structure:
        return "File not found in codebase."
    
    structure = code_structure[file_path]
    file_ext = file_path.split('.')[-1] if '.' in file_path else "unknown"
    
    # Read file content for basic analysis
    try:
        with open(repo_path / file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        lines = content.splitlines()
        total_lines = len(lines)
        non_empty_lines = len([line for line in lines if line.strip()])
    except Exception:
        total_lines = 0
        non_empty_lines = 0
    
    analysis = f"""
## 📄 File Analysis: {file_path}

### 📊 Basic Information
- **File Type**: {file_ext.upper()}
- **Total Lines**: {total_lines}
- **Non-empty Lines**: {non_empty_lines}
- **File Size**: {len(content) if 'content' in locals() else 'Unknown'} characters

### 🔍 Structure Analysis
"""
    
    if 'functions' in structure and structure['functions']:
        analysis += "\n#### Functions Found:\n"
        for func in structure['functions'][:10]:  # Show first 10 functions
            analysis += f"- **{func['name']}** (line {func['line']})\n"
            if func['args']:
                analysis += f"  - Arguments: {', '.join(func['args'])}\n"
            if func['docstring']:
                analysis += f"  - Docstring: {func['docstring'][:100]}...\n"
    
    if 'classes' in structure and structure['classes']:
        analysis += "\n#### Classes Found:\n"
        for cls in structure['classes'][:5]:  # Show first 5 classes
            analysis += f"- **{cls['name']}** (line {cls['line']})\n"
            if cls['methods']:
                analysis += f"  - Methods: {', '.join([m['name'] for m in cls['methods'][:5]])}\n"
            if cls['docstring']:
                analysis += f"  - Docstring: {cls['docstring'][:100]}...\n"
    
    if 'imports' in structure and structure['imports']:
        analysis += f"\n#### Dependencies:\n"
        for imp in structure['imports'][:10]:  # Show first 10 imports
            analysis += f"- `{imp}`\n"
    
    analysis += f"""
### 💡 Usage Tips
- This appears to be a {file_ext.upper()} file
- {'Contains functions and classes' if structure.get('functions') or structure.get('classes') else 'Basic file structure'}
- {'Has documentation strings' if any(func.get('docstring') for func in structure.get('functions', [])) else 'No documentation strings found'}

### 🔧 Next Steps
To get more detailed AI-powered analysis, please:
1. Add credits to your OpenAI account
2. Or use the original app.py with Ollama (if you have it installed)
"""
    
    return analysis


# -------------------------
# STREAMLIT UI
# -------------------------
if "repo_loaded" not in st.session_state:
    st.session_state.repo_loaded = False
    st.session_state.repo_summary = ""
    st.session_state.collection = None
    st.session_state.repo_path = None
    st.session_state.readme = ""
    st.session_state.code_structure = {}
    st.session_state.chat_history = []

# Sidebar
with st.sidebar:
    st.header("🐿️ Squirrel AI Setup")
    
    # API Key input
    api_key = st.text_input("OpenAI API Key", type="password", help="Enter your OpenAI API key")
    if api_key:
        os.environ["OPENAI_API_KEY"] = api_key
    
    # Model selection
    model_options = ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"]
    selected_model = st.selectbox(
        "OpenAI Model",
        model_options,
        index=0,
        help="Choose the OpenAI model to use. GPT-3.5-turbo is faster and cheaper, GPT-4 is more capable but slower and more expensive."
    )
    # Update the global model setting
    OPENAI_MODEL = selected_model
    
    # Fallback mode for when API quota is exceeded
    fallback_mode = st.checkbox(
        "🔧 Fallback Mode (No OpenAI Required)",
        value=False,
        help="Enable this if you've run out of OpenAI credits. Uses basic analysis without AI."
    )
    
    st.header(" Load Repository")
    input_url = st.text_input(
        "GitHub Repository URL:",
        placeholder="https://github.com/owner/repo"
    )
    
    if st.button("🔍 Load and Analyze", type="primary"):
        if not input_url.strip():
            st.sidebar.error("Please enter a valid GitHub URL.")
        elif not api_key:
            st.sidebar.error("Please enter your OpenAI API key.")
        else:
            try:
                with st.spinner("🔄 Cloning, parsing, and analyzing..."):
                    repo_path, collection, readme_text, code_structure = clone_and_prepare(input_url.strip())
                    summary = generate_summary(readme_text, repo_path, code_structure, fallback_mode)

                st.session_state.repo_loaded = True
                st.session_state.repo_summary = summary
                st.session_state.collection = collection
                st.session_state.repo_path = repo_path
                st.session_state.readme = readme_text
                st.session_state.code_structure = code_structure
                st.session_state.chat_history = []
                st.success("✅ Repository loaded and analyzed successfully!")

            except Exception as e:
                st.session_state.repo_loaded = False
                st.error(f"❌ Error: {e}")

# Main content
if st.session_state.repo_loaded:
    # Repository Overview
    st.header("📋 Repository Overview")
    st.markdown(st.session_state.repo_summary)
    
    # Tabs for different features
    tab1, tab2, tab3, tab4 = st.tabs(["💬 AI Chat", "📁 Code Explorer", "🔍 File Analysis", "📊 Structure"])
    
    with tab1:
        st.subheader("💬 Ask Questions About This Codebase")
        
        # Chat interface
        for i, (question, answer) in enumerate(st.session_state.chat_history):
            with st.chat_message("user"):
                st.write(question)
            with st.chat_message("assistant"):
                st.write(answer)
        
        # New question input
        if prompt := st.chat_input("Ask about the codebase..."):
            st.session_state.chat_history.append((prompt, ""))
            
            with st.chat_message("user"):
                st.write(prompt)
            
            with st.chat_message("assistant"):
                with st.spinner("🤔 Thinking..."):
                    answer = answer_question(prompt, st.session_state.collection, 
                                          st.session_state.code_structure, st.session_state.repo_path)
                st.write(answer)
                st.session_state.chat_history[-1] = (prompt, answer)
    
    with tab2:
        st.subheader("📁 Explore Code Files")
        
        # File selector
        files = list(st.session_state.code_structure.keys())
        if files:
            selected_file = st.selectbox("Select a file to explore:", files)
            
            if selected_file:
                file_path = st.session_state.repo_path / selected_file
                if file_path.exists():
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    
                    st.subheader(f"📄 {selected_file}")
                    
                    # File info
                    col1, col2, col3 = st.columns(3)
                    with col1:
                        st.metric("Lines", len(content.splitlines()))
                    with col2:
                        st.metric("Size", f"{len(content)} chars")
                    with col3:
                        st.metric("Type", selected_file.split('.')[-1] if '.' in selected_file else "Unknown")
                    
                    # Code structure info
                    if selected_file in st.session_state.code_structure:
                        structure = st.session_state.code_structure[selected_file]
                        if 'functions' in structure and structure['functions']:
                            st.write("**Functions:**")
                            for func in structure['functions'][:5]:
                                st.write(f"- `{func['name']}` (line {func['line']})")
                        if 'classes' in structure and structure['classes']:
                            st.write("**Classes:**")
                            for cls in structure['classes'][:5]:
                                st.write(f"- `{cls['name']}` (line {cls['line']})")
                    
                    # Code display
                    st.code(content, language=selected_file.split('.')[-1] if '.' in selected_file else None)
    
    with tab3:
        st.subheader("🔍 AI-Powered File Analysis")
        
        files = list(st.session_state.code_structure.keys())
        if files:
            selected_file = st.selectbox("Select a file for AI analysis:", files, key="analysis_file")
            
            if st.button("🤖 Generate AI Explanation"):
                with st.spinner("Analyzing file..."):
                    if fallback_mode:
                        explanation = generate_basic_analysis(selected_file, st.session_state.code_structure, st.session_state.repo_path)
                    else:
                        explanation = generate_code_explanation(selected_file, st.session_state.code_structure)
                st.markdown(explanation)
    
    with tab4:
        st.subheader("📊 Codebase Structure")
        
        # Statistics
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("Total Files", len(st.session_state.code_structure))
        with col2:
            python_files = len([f for f in st.session_state.code_structure.keys() if f.endswith('.py')])
            st.metric("Python Files", python_files)
        with col3:
            js_files = len([f for f in st.session_state.code_structure.keys() if f.endswith(('.js', '.jsx', '.ts', '.tsx'))])
            st.metric("JS/TS Files", js_files)
        with col4:
            total_functions = sum(len(structure.get('functions', [])) for structure in st.session_state.code_structure.values())
            st.metric("Total Functions", total_functions)
        
        # File tree
        st.subheader("📂 File Tree")
        for file_path in sorted(st.session_state.code_structure.keys()):
            parts = file_path.split('/')
            indent = "  " * (len(parts) - 1)
            st.text(f"{indent}📄 {parts[-1]}")

else:
    st.info("👋 Welcome to Squirrel AI! Enter a GitHub URL and your OpenAI API key in the sidebar to play with repositories.")
    
    # OpenAI setup help
    with st.expander("🔑 Need help with OpenAI API?"):
        st.markdown("""
        **To get started:**
        1. **Get an API Key**: Visit [OpenAI Platform](https://platform.openai.com/api-keys) and create a new API key
        2. **Add Credits**: Make sure your account has credits (you can add them in the billing section)
        3. **Choose Model**: 
           - **gpt-3.5-turbo**: Fast, cheap, good for most tasks (recommended)
           - **gpt-4**: More capable but slower and more expensive
           - **gpt-4-turbo**: Latest version with better performance
        
        **Cost Estimate**: 
        - GPT-3.5-turbo: ~$0.002 per 1K tokens
        - GPT-4: ~$0.03 per 1K tokens
        
        **Free Tier**: OpenAI offers $5 free credit for new users!
        
        **🔧 Fallback Mode**: If you run out of credits, enable "Fallback Mode" in the sidebar for basic analysis without OpenAI.
        """)
    
    # Example questions
    st.subheader("💡 Example Questions You Can Ask:")
    st.markdown("""
    - "What is the main purpose of this project?"
    - "How is authentication implemented?"
    - "Explain the database schema"
    - "What are the main API endpoints?"
    - "How do I set up this project locally?"
    - "What testing framework is used?"
    - "Explain the project architecture"
    - "What are the key dependencies?"
    """)
