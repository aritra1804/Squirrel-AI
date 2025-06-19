#!/usr/bin/env python3
"""
Squirrel AI Setup Script
Quick setup for the AI-powered repository analysis platform
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e.stderr}")
        return False

def check_requirements():
    """Check if required tools are installed"""
    print("🔍 Checking system requirements...")
    
    requirements = {
        'python3': 'Python 3.8+',
        'node': 'Node.js 16+',
        'npm': 'npm',
        'git': 'Git'
    }
    
    missing = []
    for tool, name in requirements.items():
        if shutil.which(tool) is None:
            missing.append(name)
        else:
            print(f"✅ {name} found")
    
    if missing:
        print(f"❌ Missing requirements: {', '.join(missing)}")
        print("Please install the missing tools and run this script again.")
        return False
    
    return True

def create_env_file():
    """Create .env file with OpenAI API key prompt"""
    env_file = Path(".env")
    
    if env_file.exists():
        print("✅ .env file already exists")
        return True
    
    print("🔧 Setting up environment variables...")
    
    # Get OpenAI API key from user
    api_key = input("Enter your OpenAI API key: ").strip()
    
    if not api_key:
        print("❌ OpenAI API key is required")
        return False
    
    # Create .env file
    env_content = f"""# Squirrel AI Environment Variables
OPENAI_API_KEY={api_key}
OPENAI_MODEL=gpt-3.5-turbo
"""
    
    try:
        with open(env_file, 'w') as f:
            f.write(env_content)
        print("✅ .env file created successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to create .env file: {e}")
        return False

def install_backend_dependencies():
    """Install Python dependencies"""
    backend_dir = Path("backend")
    if not backend_dir.exists():
        print("❌ Backend directory not found")
        return False
    
    os.chdir(backend_dir)
    
    # Upgrade pip first
    if not run_command("pip install --upgrade pip", "Upgrading pip"):
        return False
    
    # Install requirements
    if not run_command("pip install -r requirements.txt", "Installing backend dependencies"):
        return False
    
    os.chdir("..")
    return True

def install_frontend_dependencies():
    """Install Node.js dependencies"""
    frontend_dir = Path("frontend")
    if not frontend_dir.exists():
        print("❌ Frontend directory not found")
        return False
    
    os.chdir(frontend_dir)
    
    if not run_command("npm install", "Installing frontend dependencies"):
        return False
    
    os.chdir("..")
    return True

def create_cache_directories():
    """Create necessary cache directories"""
    print("📁 Creating cache directories...")
    
    directories = [
        "backend/cached_repos",
        "frontend/dist"
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"✅ Created {directory}")

def main():
    """Main setup function"""
    print("🚀 Squirrel AI Setup Script")
    print("=" * 50)
    
    # Check requirements
    if not check_requirements():
        sys.exit(1)
    
    # Create environment file
    if not create_env_file():
        sys.exit(1)
    
    # Install backend dependencies
    if not install_backend_dependencies():
        print("❌ Backend setup failed")
        sys.exit(1)
    
    # Install frontend dependencies
    if not install_frontend_dependencies():
        print("❌ Frontend setup failed")
        sys.exit(1)
    
    # Create cache directories
    create_cache_directories()
    
    print("\n" + "=" * 50)
    print("🎉 Squirrel AI setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Start the application: ./start.sh")
    print("2. Open your browser to: http://localhost:5173")
    print("3. Enter a GitHub repository URL to get started")
    print("\n📚 For more information, see README.md")
    print("🔧 For API documentation, visit: http://localhost:8000/docs")

if __name__ == "__main__":
    main() 