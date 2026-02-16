#!/bin/bash

# Gemini API Setup Script
# Configures Gemini API keys and models for the RAG Backend

set -e

# Load environment variables
set -a
source ../.env
set +a

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

LOG_FILE="../logs/gemini_setup.log"
mkdir -p "../logs"

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

# Check if Python is installed
check_python() {
    if ! command -v python3 &> /dev/null; then
        error "Python 3 is not installed"
        exit 1
    fi
    
    # Check if required packages are installed
    python3 -c "import google.generativeai" 2>/dev/null || {
        warning "Google Generative AI package not found. Installing..."
        pip3 install google-generativeai
    }
}

# Test Gemini API connection
test_gemini_connection() {
    log "Testing Gemini API connection..."
    
    # Create temporary Python script
    cat > /tmp/test_gemini.py << EOF
import os
import sys
import google.generativeai as genai

# Configure API
api_key = os.getenv("GEMINI_API_KEY", "$GEMINI_API_KEY")
if not api_key or api_key == "":
    print("ERROR: GEMINI_API_KEY is not set")
    sys.exit(1)

try:
    genai.configure(api_key=api_key)
    
    # List available models
    models = genai.list_models()
    
    print("✓ API connection successful")
    print("\nAvailable models:")
    for model in models:
        if 'generateContent' in model.supported_generation_methods:
            print(f"  - {model.name}")
            
    # Test with specific model
    model_name = "$GEMINI_MODEL"
    if model_name and model_name != "":
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content("Hello, are you working?")
            print(f"\n✓ Model {model_name} test successful")
        except Exception as e:
            print(f"✗ Model {model_name} test failed: {e}")
            
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
EOF
    
    # Run test
    python3 /tmp/test_gemini.py 2>&1 | tee -a "$LOG_FILE"
    
    # Clean up
    rm -f /tmp/test_gemini.py
}

# Setup Gemini API key
setup_api_key() {
    log "Setting up Gemini API key..."
    
    cd "$(dirname "${BASH_SOURCE[0]}")/.."
    
    # Check if API key is already set
    if [ -n "$GEMINI_API_KEY" ] && [ "$GEMINI_API_KEY" != "" ] && [ "$GEMINI_API_KEY" != "your-gemini-api-key" ]; then
        info "GEMINI_API_KEY is already set in .env"
        
        # Test the existing key
        test_gemini_connection
        
        read -p "Do you want to update the API key? (y/n): " update_key
        if [[ ! $update_key =~ ^[Yy]$ ]]; then
            return
        fi
    fi
    
    info "To get your Gemini API key:"
    echo "  1. Go to https://makersuite.google.com/app/apikey"
    echo "  2. Sign in with your Google account"
    echo "  3. Click 'Create API Key'"
    echo "  4. Copy the generated key"
    echo ""
    
    read -p "Enter your Gemini API key: " api_key
    
    if [ -n "$api_key" ]; then
        # Update .env file
        if grep -q "GEMINI_API_KEY=" .env; then
            sed -i.bak "s|GEMINI_API_KEY=.*|GEMINI_API_KEY=$api_key|" .env
        else
            echo "GEMINI_API_KEY=$api_key" >> .env
        fi
        rm -f .env.bak
        
        log "GEMINI_API_KEY updated in .env"
        export GEMINI_API_KEY="$api_key"
        
        # Test the new key
        test_gemini_connection
    else
        warning "API key not provided. Skipping setup."
    fi
}

# Select and configure Gemini model
setup_model() {
    log "Configuring Gemini model..."
    
    cd "$(dirname "${BASH_SOURCE[0]}")/.."
    
    # Fetch available models
    info "Fetching available models..."
    
    # Create temporary Python script to list models
    cat > /tmp/list_models.py << EOF
import os
import google.generativeai as genai

api_key = os.getenv("GEMINI_API_KEY", "$GEMINI_API_KEY")
if not api_key or api_key == "":
    print("ERROR: GEMINI_API_KEY is not set")
    exit(1)

genai.configure(api_key=api_key)

print("\nAvailable Gemini Models:")
print("=" * 50)

for model in genai.list_models():
    if 'generateContent' in model.supported_generation_methods:
        print(f"\nModel: {model.name}")
        print(f"  Display Name: {model.display_name}")
        print(f"  Description: {model.description}")
        print(f"  Input Token Limit: {model.input_token_limit}")
        print(f"  Output Token Limit: {model.output_token_limit}")
EOF
    
    # Run model listing
    python3 /tmp/list_models.py 2>/dev/null | tee -a "$LOG_FILE"
    
    # Check if we got models
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        warning "Failed to fetch models. Using default configuration."
        default_model="models/gemini-2.5-flash"
    else
        echo ""
        read -p "Enter the model name to use (default: models/gemini-2.5-flash): " model_name
        
        if [ -z "$model_name" ]; then
            model_name="models/gemini-2.5-flash"
        fi
    fi
    
    # Update .env file
    if grep -q "GEMINI_MODEL=" .env; then
        sed -i.bak "s|GEMINI_MODEL=.*|GEMINI_MODEL=$model_name|" .env
    else
        echo "GEMINI_MODEL=$model_name" >> .env
    fi
    rm -f .env.bak
    
    log "GEMINI_MODEL updated to: $model_name"
}

# Setup embedding model
setup_embedding_model() {
    log "Configuring embedding model..."
    
    cd "$(dirname "${BASH_SOURCE[0]}")/.."
    
    info "Available embedding models:"
    echo "  - models/embedding-001 (default)"
    echo "  - models/text-embedding-004"
    echo "  - models/embedding-gecko-001"
    
    read -p "Enter embedding model name (default: models/embedding-001): " embedding_model
    
    if [ -z "$embedding_model" ]; then
        embedding_model="models/embedding-001"
    fi
    
    # Update .env file
    if grep -q "GEMINI_EMBEDDING_MODEL=" .env; then
        sed -i.bak "s|GEMINI_EMBEDDING_MODEL=.*|GEMINI_EMBEDDING_MODEL=$embedding_model|" .env
    else
        echo "GEMINI_EMBEDDING_MODEL=$embedding_model" >> .env
    fi
    rm -f .env.bak
    
    log "GEMINI_EMBEDDING_MODEL updated to: $embedding_model"
}

# Test complete setup
test_complete_setup() {
    log "Testing complete Gemini setup..."
    
    # Create comprehensive test script
    cat > /tmp/test_gemini_complete.py << EOF
import os
import sys
import google.generativeai as genai
import numpy as np
from typing import List

# Configure API
api_key = os.getenv("GEMINI_API_KEY", "$GEMINI_API_KEY")
if not api_key:
    print("❌ GEMINI_API_KEY is not set")
    sys.exit(1)

try:
    genai.configure(api_key=api_key)
    print("✅ API configuration successful")
    
    # Test text generation
    model_name = os.getenv("GEMINI_MODEL", "$GEMINI_MODEL")
    print(f"\nTesting text generation with {model_name}...")
    
    model = genai.GenerativeModel(model_name)
    response = model.generate_content(
        "Explain what a RAG system is in one sentence."
    )
    print(f"✅ Text generation successful")
    print(f"   Response: {response.text[:100]}...")
    
    # Test embeddings
    embedding_model = os.getenv("GEMINI_EMBEDDING_MODEL", "$GEMINI_EMBEDDING_MODEL")
    print(f"\nTesting embeddings with {embedding_model}...")
    
    result = genai.embed_content(
        model=embedding_model,
        content="This is a test document for embedding generation.",
        task_type="retrieval_document"
    )
    
    embedding = result['embedding']
    print(f"✅ Embedding generation successful")
    print(f"   Embedding dimension: {len(embedding)}")
    print(f"   Sample values: {embedding[:5]}")
    
    # Test batch embeddings
    print(f"\nTesting batch embeddings...")
    texts = [
        "First test document",
        "Second test document",
        "Third test document"
    ]
    
    result = genai.embed_content(
        model=embedding_model,
        content=texts,
        task_type="retrieval_document"
    )
    
    embeddings = result['embedding']
    print(f"✅ Batch embedding successful")
    print(f"   Number of embeddings: {len(embeddings)}")
    print(f"   Shape: {len(embeddings)} x {len(embeddings[0])}")
    
    # Test similarity
    if len(embeddings) >= 2:
        sim = np.dot(embeddings[0], embeddings[1]) / (
            np.linalg.norm(embeddings[0]) * np.linalg.norm(embeddings[1])
        )
        print(f"   Similarity between doc1 and doc2: {sim:.4f}")
    
    print("\n✅ All tests passed successfully!")
    
except Exception as e:
    print(f"❌ Test failed: {e}")
    sys.exit(1)
EOF
    
    # Run test
    python3 /tmp/test_gemini_complete.py 2>&1 | tee -a "$LOG_FILE"
    
    # Clean up
    rm -f /tmp/test_gemini_complete.py
}

# Create Gemini utility module
create_gemini_utils() {
    log "Creating Gemini utility module..."
    
    mkdir -p "../app/services"
    
    cat > "../app/services/gemini_service.py" << 'EOF'
"""
Gemini AI Service Module
Provides integration with Google's Gemini models for text generation and embeddings
"""

import google.generativeai as genai
import os
from typing import List, Optional, Dict, Any
import logging
import asyncio
from functools import lru_cache
import time

logger = logging.getLogger(__name__)

class GeminiService:
    """Service for interacting with Gemini models"""
    
    def __init__(self):
        """Initialize Gemini service with API key from environment"""
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model_name = os.getenv("GEMINI_MODEL", "models/gemini-2.5-flash")
        self.embedding_model = os.getenv("GEMINI_EMBEDDING_MODEL", "models/embedding-001")
        
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
            
        # Configure Gemini
        genai.configure(api_key=self.api_key)
        
        # Initialize model
        self.model = genai.GenerativeModel(self.model_name)
        
        # Cache for embeddings
        self.embedding_cache = {}
        
        logger.info(f"GeminiService initialized with model: {self.model_name}")
        
    async def generate_text(
        self, 
        prompt: str, 
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> str:
        """
        Generate text using Gemini model
        
        Args:
            prompt: Input prompt
            temperature: Controls randomness (0-1)
            max_tokens: Maximum tokens to generate
            
        Returns:
            Generated text
        """
        try:
            # Run in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            
            generation_config = {
                "temperature": temperature,
                **kwargs
            }
            
            if max_tokens:
                generation_config["max_output_tokens"] = max_tokens
                
            response = await loop.run_in_executor(
                None,
                lambda: self.model.generate_content(
                    prompt,
                    generation_config=generation_config
                )
            )
            
            return response.text
            
        except Exception as e:
            logger.error(f"Text generation failed: {e}")
            raise
            
    async def generate_chat_response(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        **kwargs
    ) -> str:
        """
        Generate chat response from conversation history
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Controls randomness
            
        Returns:
            Generated response
        """
        try:
            # Convert messages to Gemini format
            chat = self.model.start_chat()
            
            for message in messages[:-1]:  # All but last message
                if message["role"] == "user":
                    chat.send_message(message["content"])
                    
            # Generate response for last message
            last_message = messages[-1]["content"]
            response = await self.generate_text(
                last_message,
                temperature=temperature,
                **kwargs
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Chat response generation failed: {e}")
            raise
            
    async def generate_embeddings(
        self,
        texts: List[str],
        task_type: str = "retrieval_document",
        use_cache: bool = True
    ) -> List[List[float]]:
        """
        Generate embeddings for texts
        
        Args:
            texts: List of text strings
            task_type: Type of task (retrieval_document, retrieval_query, etc.)
            use_cache: Whether to use cached embeddings
            
        Returns:
            List of embedding vectors
        """
        try:
            # Check cache
            if use_cache:
                uncached_texts = []
                uncached_indices = []
                embeddings = [None] * len(texts)
                
                for i, text in enumerate(texts):
                    cache_key = f"{text}_{task_type}"
                    if cache_key in self.embedding_cache:
                        embeddings[i] = self.embedding_cache[cache_key]
                    else:
                        uncached_texts.append(text)
                        uncached_indices.append(i)
                        
                if not uncached_texts:
                    logger.debug("All embeddings retrieved from cache")
                    return embeddings
                    
                # Generate embeddings for uncached texts
                texts_to_embed = uncached_texts
            else:
                texts_to_embed = texts
                
            # Run embedding generation in thread pool
            loop = asyncio.get_event_loop()
            
            result = await loop.run_in_executor(
                None,
                lambda: genai.embed_content(
                    model=self.embedding_model,
                    content=texts_to_embed,
                    task_type=task_type
                )
            )
            
            new_embeddings = result['embedding']
            
            # Update cache and combine results
            if use_cache:
                for i, (idx, text) in enumerate(zip(uncached_indices, uncached_texts)):
                    cache_key = f"{text}_{task_type}"
                    self.embedding_cache[cache_key] = new_embeddings[i]
                    embeddings[idx] = new_embeddings[i]
                return embeddings
            else:
                return new_embeddings
                
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            raise
            
    async def batch_generate_embeddings(
        self,
        texts: List[str],
        batch_size: int = 10,
        task_type: str = "retrieval_document"
    ) -> List[List[float]]:
        """
        Generate embeddings in batches to handle large volumes
        
        Args:
            texts: List of text strings
            batch_size: Size of each batch
            task_type: Type of task
            
        Returns:
            List of embedding vectors
        """
        all_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            logger.debug(f"Processing batch {i//batch_size + 1}/{(len(texts)-1)//batch_size + 1}")
            
            batch_embeddings = await self.generate_embeddings(
                batch,
                task_type=task_type,
                use_cache=True
            )
            
            all_embeddings.extend(batch_embeddings)
            
            # Small delay to avoid rate limiting
            if i + batch_size < len(texts):
                await asyncio.sleep(0.1)
                
        return all_embeddings
        
    async def generate_with_context(
        self,
        query: str,
        context_docs: List[str],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> str:
        """
        Generate response using RAG context
        
        Args:
            query: User query
            context_docs: Retrieved relevant documents
            temperature: Controls randomness
            
        Returns:
            Generated response with context
        """
        # Build prompt with context
        context = "\n\n".join(context_docs)
        prompt = f"""Context information:
{context}

Based on the above context, please answer the following question:
{query}

If the answer cannot be found in the context, please say so politely."""
        
        return await self.generate_text(
            prompt,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
    def clear_cache(self):
        """Clear embedding cache"""
        self.embedding_cache.clear()
        logger.info("Embedding cache cleared")
        
    async def get_model_info(self) -> Dict[str, Any]:
        """Get information about current model"""
        try:
            models = genai.list_models()
            model_info = None
            
            for model in models:
                if model.name == self.model_name:
                    model_info = {
                        "name": model.name,
                        "display_name": model.display_name,
                        "description": model.description,
                        "input_token_limit": model.input_token_limit,
                        "output_token_limit": model.output_token_limit,
                        "supported_methods": model.supported_generation_methods
                    }
                    break
                    
            return {
                "configured_model": self.model_name,
                "embedding_model": self.embedding_model,
                "model_info": model_info,
                "cache_size": len(self.embedding_cache)
            }
            
        except Exception as e:
            logger.error(f"Failed to get model info: {e}")
            return {
                "configured_model": self.model_name,
                "embedding_model": self.embedding_model,
                "error": str(e)
            }

# Singleton instance
_gemini_service: Optional[GeminiService] = None

def get_gemini_service() -> GeminiService:
    """Get or create Gemini service instance"""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service
EOF
    
    log "Gemini service module created at app/services/gemini_service.py"
}

# Main setup function
main() {
    echo -e "${BLUE}"
    echo "========================================="
    echo "   Gemini API Setup"
    echo "========================================="
    echo -e "${NC}"
    
    # Check requirements
    check_python
    
    # Run setup steps
    setup_api_key
    setup_model
    setup_embedding_model
    test_complete_setup
    create_gemini_utils
    
    log "Gemini setup completed successfully!"
    
    echo -e "\n${GREEN}Next steps:${NC}"
    echo "1. Import and use the GeminiService in your application:"
    echo "   from app.services.gemini_service import get_gemini_service"
    echo ""
    echo "2. Test the integration:"
    echo "   python3 -c \"from app.services.gemini_service import get_gemini_service; service = get_gemini_service(); print(service.get_model_info())\""
    
    echo -e "\n${YELLOW}Gemini API Documentation: https://ai.google.dev/docs${NC}"
}

# Run main function
main "$@"