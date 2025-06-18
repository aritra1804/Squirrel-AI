# GitGenie - AI-Powered GitHub Repository Analyzer

🚀 **Understand any GitHub repository instantly with AI-powered analysis and intelligent Q&A.**

GitGenie is a modern web application that uses advanced AI to analyze GitHub repositories, provide intelligent summaries, and answer questions about codebases in real-time.

## ✨ Features

- **🤖 AI-Powered Analysis**: Advanced repository analysis using Ollama and sentence transformers
- **💬 Interactive Q&A**: Ask questions about any part of the codebase and get intelligent answers
- **⚡ Lightning Fast**: Powered by Ollama for quick, accurate responses
- **🌐 Multi-Language Support**: Supports Python, JavaScript, TypeScript, Java, Go, C++, C, and Ruby
- **🎨 Modern UI**: Beautiful, responsive design built with React and Chakra UI
- **🆓 Completely Free**: No API keys or subscriptions required

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Chakra UI** for beautiful, accessible components
- **Vite** for fast development and building
- **React Icons** for consistent iconography
- **Axios** for API communication

### Backend
- **FastAPI** for high-performance API
- **Ollama** for local LLM inference
- **ChromaDB** for vector storage and similarity search
- **Sentence Transformers** for text embeddings
- **Python 3.12+**

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- Node.js 18+
- Git
- Ollama (for local LLM)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd gitgenie
   ```

2. **Install Ollama and pull the model**
   ```bash
   # Install Ollama (https://ollama.com)
   ollama pull llama3.2
   ```

3. **Start Ollama**
   ```bash
   ollama serve
   ```

4. **Set up the backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   python main.py
   ```

5. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 📖 Usage

1. **Enter a GitHub repository URL** in the input field
2. **Click "Analyze Repository"** to get an AI-generated summary
3. **Ask questions** about the codebase using the Q&A feature
4. **Explore the README** and code insights

### Example Questions
- "How does the authentication work?"
- "What are the main components?"
- "Explain the project structure"
- "How do I run this project?"

## 🎨 Design Features

- **Professional Branding**: Clean, modern design with consistent branding
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile
- **Interactive Elements**: Hover effects, loading states, and smooth animations
- **Accessibility**: Built with accessibility in mind using Chakra UI
- **Dark Mode Ready**: Theme system supports both light and dark modes

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:
```env
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

### Customization
- **Colors**: Modify the theme in `frontend/src/theme.ts`
- **API Endpoints**: Update `API_URL` in `frontend/src/App.tsx`
- **Supported Languages**: Edit the `exts` list in `backend/main.py`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ollama** for providing local LLM capabilities
- **Chakra UI** for the beautiful component library
- **FastAPI** for the high-performance backend framework
- **Sentence Transformers** for text embedding capabilities

---

**Made with ❤️ for developers who want to understand code faster.**
