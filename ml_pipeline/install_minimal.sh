#!/bin/bash

# ARAS ML Pipeline - Minimal Installation Script

echo "========================================="
echo "ARAS ML Pipeline - Minimal Installation"
echo "========================================="
echo ""

# Ask about embedding provider
echo "Select Embedding Provider:"
echo "1) OpenAI (cloud, paid)"
echo "2) Local Sentence Transformers (free, self-hosted)"
echo "3) Google AI (cloud, paid)"
read -p "Choice [1-3]: " embedding_choice

# Ask about vector database
echo ""
echo "Select Vector Database:"
echo "1) MongoDB Atlas (requires MongoDB)"
echo "2) ChromaDB (local, lightweight)"
echo "3) Qdrant (local/cloud)"
read -p "Choice [1-3]: " vector_choice

# Ask about LLM provider
echo ""
echo "Select LLM Provider:"
echo "1) OpenAI"
echo "2) Anthropic"
echo "3) Google"
echo "4) Ollama (local)"
read -p "Choice [1-4]: " llm_choice

# Ask about document types
echo ""
echo "Select Document Types to Support (comma-separated, e.g., 1,2,3):"
echo "1) PDF"
echo "2) Word Documents"
echo "3) Markdown"
echo "4) HTML"
echo "5) Excel"
echo "6) None (skip)"
read -p "Choice(s): " doc_choices

# Build pip install command
PACKAGES="numpy scipy python-dotenv pydantic tenacity aiohttp tqdm nltk"

# Add embedding package
case $embedding_choice in
    1) PACKAGES="$PACKAGES openai tiktoken" ;;
    2) PACKAGES="$PACKAGES sentence-transformers torch" ;;
    3) PACKAGES="$PACKAGES google-generativeai" ;;
    *) echo "Invalid choice"; exit 1 ;;
esac

# Add vector database package
case $vector_choice in
    1) PACKAGES="$PACKAGES pymongo" ;;
    2) PACKAGES="$PACKAGES chromadb" ;;
    3) PACKAGES="$PACKAGES qdrant-client" ;;
    *) echo "Invalid choice"; exit 1 ;;
esac

# Add LLM package
case $llm_choice in
    1) PACKAGES="$PACKAGES openai" ;;
    2) PACKAGES="$PACKAGES anthropic" ;;
    3) PACKAGES="$PACKAGES google-generativeai" ;;
    4) PACKAGES="$PACKAGES ollama" ;;
    *) echo "Invalid choice"; exit 1 ;;
esac

# Add document packages
if [ "$doc_choices" != "6" ]; then
    IFS=',' read -ra choices <<< "$doc_choices"
    for choice in "${choices[@]}"; do
        case $choice in
            1) PACKAGES="$PACKAGES pypdf" ;;
            2) PACKAGES="$PACKAGES python-docx" ;;
            3) PACKAGES="$PACKAGES markdown" ;;
            4) PACKAGES="$PACKAGES beautifulsoup4" ;;
            5) PACKAGES="$PACKAGES openpyxl" ;;
        esac
    done
fi

echo ""
echo "Installing packages:"
echo "$PACKAGES"
echo ""

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install packages
pip install --upgrade pip
pip install $PACKAGES

# Download NLTK data
python3 -c "import nltk; nltk.download('punkt')" 2>/dev/null

echo ""
echo "========================================="
echo "Installation Complete!"
echo "========================================="
echo ""
echo "To activate: source venv/bin/activate"
echo ""