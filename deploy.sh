#!/bin/bash

# 🐿️ Squirrel AI Deployment Script
# This script helps you deploy Squirrel AI to Vercel and Railway

set -e

echo "🐿️ Squirrel AI Deployment Script"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "git is not installed. Please install git first."
        exit 1
    fi
    
    print_success "All dependencies are installed!"
}

# Build frontend
build_frontend() {
    print_status "Building frontend..."
    
    cd frontend
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    # Build the project
    print_status "Building the project..."
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "Frontend built successfully!"
    else
        print_error "Frontend build failed!"
        exit 1
    fi
    
    cd ..
}

# Deploy to Vercel
deploy_to_vercel() {
    print_status "Deploying to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_status "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    cd frontend
    
    # Deploy to Vercel
    print_status "Starting Vercel deployment..."
    vercel --prod
    
    cd ..
    
    print_success "Frontend deployed to Vercel!"
}

# Setup environment variables
setup_env_vars() {
    print_status "Setting up environment variables..."
    
    echo ""
    echo "Please provide the following information:"
    echo ""
    
    read -p "Enter your OpenAI API key: " openai_key
    read -p "Enter your backend URL (e.g., https://your-app.railway.app): " backend_url
    
    echo ""
    print_status "Environment variables to set in Vercel:"
    echo "VITE_API_URL=$backend_url"
    echo ""
    print_status "Environment variables to set in Railway/Render:"
    echo "OPENAI_API_KEY=$openai_key"
    echo ""
    
    print_warning "Please set these environment variables in your deployment platforms!"
}

# Main deployment flow
main() {
    echo ""
    print_status "Starting Squirrel AI deployment..."
    echo ""
    
    # Check dependencies
    check_dependencies
    
    # Build frontend
    build_frontend
    
    # Setup environment variables
    setup_env_vars
    
    # Deploy to Vercel
    deploy_to_vercel
    
    echo ""
    print_success "🎉 Deployment completed!"
    echo ""
    print_status "Next steps:"
    echo "1. Deploy your backend to Railway or Render"
    echo "2. Set the environment variables in both platforms"
    echo "3. Update the VITE_API_URL in Vercel with your backend URL"
    echo "4. Test your deployment!"
    echo ""
    print_status "For detailed instructions, see DEPLOYMENT.md"
}

# Run main function
main "$@" 