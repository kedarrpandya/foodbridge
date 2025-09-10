#!/bin/bash

# 🚀 FoodBridge Deployment Script
# This script helps you deploy FoodBridge to free hosting platforms

set -e

echo "🚀 FoodBridge Deployment Script"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
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
check_requirements() {
    print_step "Checking requirements..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi

    # Check Python
    if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
        print_error "Python is not installed. Please install Python 3.9+ first."
        exit 1
    fi

    # Check git
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi

    print_success "All requirements are met!"
}

# Setup environment variables
setup_env() {
    print_step "Setting up environment variables..."

    # Backend .env
    if [ ! -f "backend/.env" ]; then
        cp backend/.env.example backend/.env 2>/dev/null || touch backend/.env
        print_warning "Please edit backend/.env with your database and API keys"
    fi

    # Frontend .env
    if [ ! -f "frontend/.env" ]; then
        echo "VITE_API_URL=http://localhost:8000" > frontend/.env
        print_warning "Please update frontend/.env with your production API URL"
    fi

    print_success "Environment files created!"
}

# Install dependencies
install_deps() {
    print_step "Installing dependencies..."

    # Backend
    if [ -d "backend" ]; then
        cd backend
        if [ -f "requirements.txt" ]; then
            print_step "Installing Python dependencies..."
            pip install -r requirements.txt
        fi
        cd ..
    fi

    # Frontend
    if [ -d "frontend" ]; then
        cd frontend
        if [ -f "package.json" ]; then
            print_step "Installing Node.js dependencies..."
            npm install
        fi
        cd ..
    fi

    print_success "Dependencies installed!"
}

# Test local development
test_local() {
    print_step "Testing local development setup..."

    # Test backend
    if [ -d "backend" ]; then
        cd backend
        print_step "Testing backend..."
        python -c "import sys; sys.path.append('.'); from app.main import app; print('✅ Backend imports successfully')" 2>/dev/null || print_warning "Backend test failed - check your setup"
        cd ..
    fi

    # Test frontend
    if [ -d "frontend" ]; then
        cd frontend
        print_step "Testing frontend..."
        npm run build --silent 2>/dev/null || print_warning "Frontend build failed - check your setup"
        cd ..
    fi
}

# Deploy to Vercel
deploy_vercel() {
    print_step "Deploying to Vercel..."

    if ! command -v vercel &> /dev/null; then
        print_step "Installing Vercel CLI..."
        npm install -g vercel
    fi

    # Deploy backend first
    if [ -d "backend" ]; then
        print_step "Deploying backend to Vercel..."
        cd backend
        vercel --prod
        cd ..
    fi

    # Deploy frontend
    if [ -d "frontend" ]; then
        print_step "Deploying frontend to Vercel..."
        cd frontend
        vercel --prod
        cd ..
    fi

    print_success "Deployment to Vercel completed!"
}

# Deploy to Railway
deploy_railway() {
    print_step "Deploying to Railway..."

    if ! command -v railway &> /dev/null; then
        print_step "Installing Railway CLI..."
        curl -fsSL https://railway.app/install.sh | sh
    fi

    print_step "Please run the following commands manually:"
    echo "1. railway login"
    echo "2. railway link"
    echo "3. railway up"
    echo ""
    print_warning "Railway deployment requires manual setup for database and environment variables"
}

# Deploy to Render
deploy_render() {
    print_step "Deploying to Render..."

    print_step "Please follow these steps:"
    echo "1. Go to https://render.com"
    echo "2. Connect your GitHub repository"
    echo "3. Create a PostgreSQL database"
    echo "4. Create a Web Service for backend"
    echo "5. Create a Static Site for frontend"
    echo ""
    print_warning "Render deployment requires manual setup through the web interface"
}

# Main menu
show_menu() {
    echo "Choose deployment option:"
    echo "1. Vercel (Frontend) + Railway (Backend) - Recommended"
    echo "2. Render (Full-stack)"
    echo "3. Railway (Full-stack)"
    echo "4. Local development only"
    echo "5. Exit"
    echo ""
    read -p "Enter your choice (1-5): " choice

    case $choice in
        1)
            deploy_vercel
            ;;
        2)
            deploy_render
            ;;
        3)
            deploy_railway
            ;;
        4)
            test_local
            ;;
        5)
            exit 0
            ;;
        *)
            print_error "Invalid choice. Please try again."
            show_menu
            ;;
    esac
}

# Main function
main() {
    echo "Welcome to FoodBridge Deployment Script!"
    echo ""

    check_requirements
    setup_env
    install_deps

    echo ""
    print_success "Setup completed! Ready to deploy."
    echo ""

    show_menu
}

# Run main function
main "$@"