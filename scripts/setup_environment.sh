#!/bin/bash

# Development Environment Setup Script
# Sets up complete development environment for RAG Backend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_NAME="venv"
PYTHON_VERSION="3.9"
LOG_FILE="$PROJECT_ROOT/logs/setup.log"

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

# Logging function
log() {
    echo -e "${GREEN}[$(date +"%Y-%m-%d %H:%M:%S")] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +"%Y-%m-%d %H:%M:%S")] ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date +"%Y-%m-%d %H:%M:%S")] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date +"%Y-%m-%d %H:%M:%S")] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check Python version
    if command -v python3 &>/dev/null; then
        python_version=$(python3 --version | cut -d' ' -f2)
        log "Python version: $python_version"
        
        # Check if Python version is >= 3.8
        if [[ $(echo "$python_version" | cut -d'.' -f2) -lt 8 ]]; then
            warning "Python 3.8 or higher is recommended. Current version: $python_version"
        fi
    else
        error "Python 3 is not installed. Please install Python 3.8 or higher."
        exit 1
    fi
    
    # Check pip
    if ! command -v pip3 &>/dev/null; then
        error "pip3 is not installed. Please install pip."
        exit 1
    fi
    
    # Check MongoDB
    if ! command -v mongod &>/dev/null; then
        warning "MongoDB is not installed. Please install MongoDB for database functionality."
    else
        mongod_version=$(mongod --version | head -n1)
        log "MongoDB: $mongod_version"
    fi
    
    # Check Docker (optional)
    if command -v docker &>/dev/null; then
        docker_version=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        log "Docker version: $docker_version"
    else
        info "Docker is not installed. Containerization features will be unavailable."
    fi
    
    # Check Node.js (optional for frontend)
    if command -v node &>/dev/null; then
        node_version=$(node --version)
        log "Node.js version: $node_version"
    fi
}

# Create virtual environment
setup_virtual_env() {
    log "Setting up Python virtual environment..."
    
    cd "$PROJECT_ROOT"
    
    # Check if venv already exists
    if [ -d "$VENV_NAME" ]; then
        warning "Virtual environment already exists. Skipping creation."
        return
    fi
    
    # Create virtual environment
    python3 -m venv "$VENV_NAME"
    
    if [ $? -eq 0 ]; then
        log "Virtual environment created successfully"
    else
        error "Failed to create virtual environment"
        exit 1
    fi
}

# Install Python dependencies
install_dependencies() {
    log "Installing Python dependencies..."
    
    cd "$PROJECT_ROOT"
    
    # Activate virtual environment
    source "$VENV_NAME/bin/activate"
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install requirements
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
        log "Installed production dependencies"
    else
        warning "requirements.txt not found"
    fi
    
    # Install development requirements
    if [ -f "requirements-dev.txt" ]; then
        pip install -r requirements-dev.txt
        log "Installed development dependencies"
    else
        warning "requirements-dev.txt not found"
    fi
    
    # Install test requirements
    if [ -f "requirements-test.txt" ]; then
        pip install -r requirements-test.txt
        log "Installed test dependencies"
    fi
    
    # Deactivate virtual environment
    deactivate
    
    log "Dependencies installed successfully"
}

# Setup environment configuration
setup_env_config() {
    log "Setting up environment configuration..."
    
    cd "$PROJECT_ROOT"
    
    # Check if .env file exists
    if [ -f ".env" ]; then
        warning ".env file already exists. Creating .env.backup"
        cp .env .env.backup
    fi
    
    # Create .env from example if available
    if [ -f ".env.example" ]; then
        cp .env.example .env
        log "Created .env from .env.example"
    else
        # Create minimal .env file
        cat > .env << EOF
# Project Configuration
PROJECT_NAME="RAG Backend"
SECRET_KEY="$(openssl rand -hex 32)"

# MongoDB Configuration
MONGODB_URI="mongodb://localhost:27017"
MONGODB_DB_NAME="rag_backend"

# Firebase Configuration (Optional)
FIREBASE_PROJECT_ID=""
FIREBASE_PRIVATE_KEY_ID=""
FIREBASE_PRIVATE_KEY=""
FIREBASE_CLIENT_EMAIL=""
FIREBASE_CLIENT_ID=""

# Gemini API Configuration
GEMINI_API_KEY=""
GEMINI_MODEL="models/gemini-2.5-flash"
GEMINI_EMBEDDING_MODEL="models/embedding-001"

# Redis Configuration (Optional)
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_DB=0
EOF
        log "Created minimal .env file"
    fi
    
    # Generate random secret if needed
    if [ -f ".env" ] && grep -q "your-secret-key" .env; then
        sed -i.bak "s/your-secret-key/$(openssl rand -hex 32)/g" .env
        rm -f .env.bak
        log "Generated random SECRET_KEY"
    fi
    
    # Set proper permissions
    chmod 600 .env
    
    log "Environment configuration completed"
}

# Create project structure
create_project_structure() {
    log "Creating project directory structure..."
    
    cd "$PROJECT_ROOT"
    
    # Create necessary directories
    mkdir -p app/{api,core,models,services,utils}
    mkdir -p tests/{unit,integration,fixtures}
    mkdir -p data/{uploads,exports,temp}
    mkdir -p logs
    mkdir -p backups/{mongodb,uploads,configs}
    mkdir -p scripts
    mkdir -p config
    mkdir -p docs
    
    log "Project structure created"
}

# Initialize git repository
init_git() {
    log "Initializing git repository..."
    
    cd "$PROJECT_ROOT"
    
    # Check if git is installed
    if ! command -v git &>/dev/null; then
        warning "Git is not installed. Skipping repository initialization."
        return
    fi
    
    # Initialize git if not already
    if [ ! -d ".git" ]; then
        git init
        
        # Create .gitignore if not exists
        if [ ! -f ".gitignore" ]; then
            cat > .gitignore << EOF
# Python
__pycache__/
*.py[cod]
*.so
.Python
venv/
env/
ENV/
*.egg-info/
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Environment
.env
.env.local
.env.*.local

# Data
data/
logs/
*.log
*.pid
*.pid.lock

# Backups
backups/

# Test
.coverage
htmlcov/
.pytest_cache/
.tox/

# MongoDB
*.dump
*.archive

# Docker
*.pid
*.sock

# OS
.DS_Store
Thumbs.db
EOF
        fi
        
        log "Git repository initialized"
    else
        warning "Git repository already exists"
    fi
}

# Setup pre-commit hooks
setup_pre_commit() {
    log "Setting up pre-commit hooks..."
    
    cd "$PROJECT_ROOT"
    
    # Check if pre-commit is installed
    if ! command -v pre-commit &>/dev/null; then
        warning "pre-commit is not installed. Skipping hook setup."
        return
    fi
    
    # Create pre-commit config if not exists
    if [ ! -f ".pre-commit-config.yaml" ]; then
        cat > .pre-commit-config.yaml << EOF
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: check-added-large-files
      
  - repo: https://github.com/psf/black
    rev: 23.3.0
    hooks:
      - id: black
        language_version: python3
        
  - repo: https://github.com/PyCQA/flake8
    rev: 6.0.0
    hooks:
      - id: flake8
        args: ['--max-line-length=88']
        
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.3.0
    hooks:
      - id: mypy
        additional_dependencies: [types-all]
EOF
    fi
    
    # Install pre-commit hooks
    pre-commit install
    
    log "Pre-commit hooks installed"
}

# Setup Docker environment
setup_docker() {
    log "Setting up Docker environment..."
    
    cd "$PROJECT_ROOT"
    
    # Check if Docker is installed
    if ! command -v docker &>/dev/null; then
        warning "Docker is not installed. Skipping Docker setup."
        return
    fi
    
    # Create Dockerfile if not exists
    if [ ! -f "Dockerfile" ]; then
        cat > Dockerfile << EOF
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF
        log "Created Dockerfile"
    fi
    
    # Create docker-compose.yml if not exists
    if [ ! -f "docker-compose.yml" ]; then
        cat > docker-compose.yml << EOF
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017
      - MONGODB_DB_NAME=rag_backend
    depends_on:
      - mongodb
      - redis
    volumes:
      - ./:/app
    networks:
      - rag-network

  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    networks:
      - rag-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - rag-network

volumes:
  mongodb_data:
  redis_data:

networks:
  rag-network:
    driver: bridge
EOF
        log "Created docker-compose.yml"
    fi
    
    log "Docker setup completed"
}

# Main setup function
main() {
    echo -e "${BLUE}"
    echo "========================================="
    echo "   RAG Backend Development Setup"
    echo "========================================="
    echo -e "${NC}"
    
    # Create log file
    touch "$LOG_FILE"
    
    # Run setup steps
    check_requirements
    create_project_structure
    setup_virtual_env
    install_dependencies
    setup_env_config
    init_git
    setup_pre_commit
    setup_docker
    
    log "Setup completed successfully!"
    
    echo -e "\n${GREEN}Next steps:${NC}"
    echo "1. Edit the .env file with your configuration"
    echo "2. Activate virtual environment: source $VENV_NAME/bin/activate"
    echo "3. Run MongoDB: mongod"
    echo "4. Start the application: uvicorn app.main:app --reload"
    echo "5. Run tests: pytest"
    
    echo -e "\n${YELLOW}For more information, check the documentation in docs/${NC}"
}

# Run main function
main "$@"