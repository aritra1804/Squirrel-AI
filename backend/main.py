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

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import chromadb
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ------------------------------------------------------------------------------------
# SETTINGS: adjust these if needed
# ------------------------------------------------------------------------------------
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "your-openai-api-key-here")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")  # or "gpt-4" if you have access
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
CHUNK_SIZE = 1000       # increased for better context
CHUNK_OVERLAP = 100     # increased overlap
TOP_K = 6              # more chunks for better context
CACHE_DIR = Path("cached_repos")
# ------------------------------------------------------------------------------------

# Initialize FastAPI app
app = FastAPI(title="Squirrel AI API", version="2.0.0")

# Add CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Pydantic models
class AnalyzeRequest(BaseModel):
    url: str

class QuestionRequest(BaseModel):
    question: str
    repo_url: str

class AnalyzeResponse(BaseModel):
    summary: str
    readme: str
    code_structure: Dict[str, Any]
    stats: Dict[str, Any]

class QuestionResponse(BaseModel):
    answer: str
    context_files: List[str]

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

    # 2. SET UP IN‐MEMORY CHROMA CLIENT (per-repo collection)
    client = chromadb.Client()
    collection_name = f"repo_chunks_{repo_hash}"
    try:
        collection = client.get_collection(collection_name)
        if collection.count() > 0:
            return repo_path, collection, _load_readme(repo_path), parse_code_files(repo_path)
    except Exception:
        collection = client.create_collection(collection_name)

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
    """Load README file content."""
    for name in ("README.md", "README.MD", "README.txt", "readme.md"):
        readme_path = repo_path / name
        if readme_path.exists():
            try:
                return readme_path.read_text(encoding="utf-8", errors="ignore")[:15000]
            except Exception:
                return ""
    return ""

def generate_summary(readme_text: str, repo_path: Path, code_structure: Dict[str, Any]) -> str:
    """
    Generate a comprehensive summary using OpenAI.
    """
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
        response = openai_client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000,
            temperature=0.3
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"(Error generating summary: {e})"

def answer_question(question: str, collection: chromadb.api.models.Collection.Collection, 
                   code_structure: Dict[str, Any], repo_path: Path) -> tuple[str, List[str]]:
    """
    Enhanced Q&A using OpenAI with better context and code structure awareness.
    """
    # Special handling for common questions
    lower_q = question.strip().lower()
    if any(phrase in lower_q for phrase in ["repo about", "what is the repo", "project purpose"]):
        return "This is a repository analysis. Please ask specific questions about the codebase.", []

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
    context_files = []
    for chunk, meta in zip(retrieved_chunks, retrieved_metas):
        path = meta.get("path", "unknown")
        ext = meta.get("extension", "")
        context_files.append(path)
        
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
        response = openai_client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=800,
            temperature=0.2
        )
        return response.choices[0].message.content.strip(), context_files
    except Exception as e:
        return f"(Error generating answer: {e})", []

# Ensure CACHE_DIR exists
CACHE_DIR.mkdir(exist_ok=True)

@app.get("/")
async def root():
    return {"message": "Squirrel AI API v2.0.0 - Play with Repositories using AI!"}

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_repository(request: AnalyzeRequest):
    """Analyze a GitHub repository and return summary, README, and code structure."""
    try:
        # Clone and prepare repository
        repo_path, collection, readme_text, code_structure = clone_and_prepare(request.url)
        
        # Generate summary
        summary = generate_summary(readme_text, repo_path, code_structure)
        
        # Calculate statistics
        total_files = len(code_structure)
        # Dynamically count files by extension
        ext_counts = {}
        for f in code_structure.keys():
            ext = f.split('.')[-1] if '.' in f else 'other'
            ext_counts[ext] = ext_counts.get(ext, 0) + 1
        # Optionally, map common extensions to language names
        ext_to_lang = {
            'py': 'Python',
            'js': 'JavaScript',
            'ts': 'TypeScript',
            'java': 'Java',
            'go': 'Go',
            'cpp': 'C++',
            'c': 'C',
            'rb': 'Ruby',
            'php': 'PHP',
            'html': 'HTML',
            'css': 'CSS',
            'jsx': 'JSX',
            'tsx': 'TSX',
        }
        lang_counts = {}
        for ext, count in ext_counts.items():
            lang = ext_to_lang.get(ext, ext.upper())
            lang_counts[lang] = lang_counts.get(lang, 0) + count
        
        total_functions = sum(len(structure.get('functions', [])) for structure in code_structure.values())
        total_classes = sum(len(structure.get('classes', [])) for structure in code_structure.values())
        
        stats = {
            "total_files": total_files,
            "languages": lang_counts,
            "total_functions": total_functions,
            "total_classes": total_classes
        }
        
        return AnalyzeResponse(
            summary=summary,
            readme=readme_text,
            code_structure=code_structure,
            stats=stats
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask", response_model=QuestionResponse)
async def ask_question(request: QuestionRequest):
    """Ask a question about a repository and get an AI-powered answer."""
    try:
        # Clone and prepare repository
        repo_path, collection, readme_text, code_structure = clone_and_prepare(request.repo_url)
        
        # Answer the question
        answer, context_files = answer_question(request.question, collection, code_structure, repo_path)
        
        return QuestionResponse(
            answer=answer,
            context_files=context_files
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "2.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 