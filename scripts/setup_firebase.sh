#!/bin/bash

# Firebase Project Setup Script
# Sets up Firebase project configuration and downloads service account

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

LOG_FILE="../logs/firebase_setup.log"
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

# Check if Firebase CLI is installed
check_firebase_cli() {
    if ! command -v firebase &> /dev/null; then
        error "Firebase CLI is not installed. Please install it first:"
        echo "  npm install -g firebase-tools"
        exit 1
    fi
    
    firebase_version=$(firebase --version)
    log "Firebase CLI version: $firebase_version"
}

# Check if jq is installed (for JSON parsing)
check_jq() {
    if ! command -v jq &> /dev/null; then
        error "jq is not installed. Please install it:"
        echo "  brew install jq (macOS)"
        echo "  apt-get install jq (Ubuntu/Debian)"
        exit 1
    fi
}

# Login to Firebase
firebase_login() {
    log "Logging into Firebase..."
    
    # Check if already logged in
    if firebase projects:list &> /dev/null; then
        info "Already logged into Firebase"
        return
    fi
    
    firebase login --no-localhost
    
    if [ $? -eq 0 ]; then
        log "Firebase login successful"
    else
        error "Firebase login failed"
        exit 1
    fi
}

# Initialize Firebase project
init_firebase_project() {
    log "Initializing Firebase project..."
    
    cd "$PROJECT_ROOT"
    
    # Check if project ID is set
    if [ -z "$FIREBASE_PROJECT_ID" ] || [ "$FIREBASE_PROJECT_ID" == "your-project-id" ]; then
        warning "FIREBASE_PROJECT_ID is not set in .env"
        
        # Get list of projects
        echo "Fetching available Firebase projects..."
        firebase projects:list
        
        # Prompt for project ID
        read -p "Enter your Firebase project ID: " project_id
        
        if [ -z "$project_id" ]; then
            error "Project ID is required"
            exit 1
        fi
        
        # Update .env file
        sed -i.bak "s/FIREBASE_PROJECT_ID=.*/FIREBASE_PROJECT_ID=\"$project_id\"/" .env
        rm -f .env.bak
        
        export FIREBASE_PROJECT_ID="$project_id"
        log "Updated FIREBASE_PROJECT_ID in .env"
    fi
    
    # Initialize firebase.json if not exists
    if [ ! -f "firebase.json" ]; then
        cat > firebase.json << EOF
{
  "projects": {
    "default": "$FIREBASE_PROJECT_ID"
  }
}
EOF
        log "Created firebase.json"
    fi
    
    # Create .firebaserc if not exists
    if [ ! -f ".firebaserc" ]; then
        cat > .firebaserc << EOF
{
  "projects": {
    "default": "$FIREBASE_PROJECT_ID"
  }
}
EOF
        log "Created .firebaserc"
    fi
}

# Generate and download service account key
setup_service_account() {
    log "Setting up Firebase service account..."
    
    # Check if service account key is already in .env
    if [ -n "$FIREBASE_PRIVATE_KEY" ] && [ "$FIREBASE_PRIVATE_KEY" != "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n" ]; then
        info "Service account key already configured in .env"
        return
    fi
    
    info "To get your service account key:"
    echo "  1. Go to https://console.firebase.google.com/"
    echo "  2. Select your project: $FIREBASE_PROJECT_ID"
    echo "  3. Go to Project Settings > Service Accounts"
    echo "  4. Click 'Generate New Private Key'"
    echo "  5. Save the JSON file"
    
    read -p "Enter path to service account JSON file (or press Enter to skip): " json_path
    
    if [ -n "$json_path" ] && [ -f "$json_path" ]; then
        log "Processing service account JSON file..."
        
        # Parse JSON and update .env
        project_id=$(jq -r '.project_id' "$json_path")
        private_key_id=$(jq -r '.private_key_id' "$json_path")
        private_key=$(jq -r '.private_key' "$json_path")
        client_email=$(jq -r '.client_email' "$json_path")
        client_id=$(jq -r '.client_id' "$json_path")
        
        # Update .env file
        sed -i.bak "s|FIREBASE_PROJECT_ID=.*|FIREBASE_PROJECT_ID=\"$project_id\"|" .env
        sed -i.bak "s|FIREBASE_PRIVATE_KEY_ID=.*|FIREBASE_PRIVATE_KEY_ID=\"$private_key_id\"|" .env
        sed -i.bak "s|FIREBASE_PRIVATE_KEY=.*|FIREBASE_PRIVATE_KEY=\"$private_key\"|" .env
        sed -i.bak "s|FIREBASE_CLIENT_EMAIL=.*|FIREBASE_CLIENT_EMAIL=\"$client_email\"|" .env
        sed -i.bak "s|FIREBASE_CLIENT_ID=.*|FIREBASE_CLIENT_ID=\"$client_id\"|" .env
        
        rm -f .env.bak
        
        log "Service account configuration updated in .env"
        
        # Save JSON file to secure location
        mkdir -p "../config/firebase"
        cp "$json_path" "../config/firebase/service-account.json"
        chmod 600 "../config/firebase/service-account.json"
        log "Service account JSON saved to config/firebase/service-account.json"
    else
        warning "Service account key setup skipped. You'll need to configure it manually in .env"
    fi
}

# Enable Firebase services
enable_firebase_services() {
    log "Enabling Firebase services..."
    
    info "The following services are recommended for RAG Backend:"
    echo "  - Authentication (for user management)"
    echo "  - Firestore (for real-time data)"
    echo "  - Storage (for file uploads)"
    echo "  - Functions (for serverless functions)"
    
    read -p "Enable these services now? (y/n): " enable_services
    
    if [[ $enable_services =~ ^[Yy]$ ]]; then
        # Enable Authentication
        log "Enabling Firebase Authentication..."
        firebase auth:enable --project="$FIREBASE_PROJECT_ID"
        
        # Create Firestore database
        log "Creating Firestore database..."
        firebase firestore:databases:create --project="$FIREBASE_PROJECT_ID" --location=us-central
        
        # Enable Storage
        log "Enabling Firebase Storage..."
        firebase storage:create --project="$FIREBASE_PROJECT_ID" --location=us-central
        
        log "Firebase services enabled successfully"
    else
        info "Skipping service enablement. You can enable them later in Firebase Console."
    fi
}

# Setup Firebase security rules
setup_security_rules() {
    log "Setting up Firebase security rules..."
    
    mkdir -p "../config/firebase"
    
    # Firestore rules
    cat > "../config/firebase/firestore.rules" << 'EOF'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public read access for authenticated users
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // User profiles
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth.uid == userId;
    }
    
    // Conversations
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null;
    }
  }
}
EOF
    
    # Storage rules
    cat > "../config/firebase/storage.rules" << 'EOF'
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // User uploads
    match /users/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth.uid == userId;
    }
  }
}
EOF
    
    log "Security rules created in config/firebase/"
    
    # Deploy rules if desired
    read -p "Deploy security rules now? (y/n): " deploy_rules
    
    if [[ $deploy_rules =~ ^[Yy]$ ]]; then
        cd "$PROJECT_ROOT"
        
        # Create temporary firebase.json with rules
        cat > firebase.json << EOF
{
  "firestore": {
    "rules": "config/firebase/firestore.rules"
  },
  "storage": {
    "rules": "config/firebase/storage.rules"
  }
}
EOF
        
        firebase deploy --only firestore:rules,storage:rules --project="$FIREBASE_PROJECT_ID"
        log "Security rules deployed"
    fi
}

# Create Firebase initialization script for the app
create_app_init_script() {
    log "Creating Firebase app initialization script..."
    
    cat > "../app/core/firebase_init.py" << 'EOF'
"""
Firebase initialization module
Handles Firebase Admin SDK initialization and provides utility functions
"""

import firebase_admin
from firebase_admin import credentials, auth, firestore, storage
import os
from pathlib import Path
import json
import logging

logger = logging.getLogger(__name__)

class FirebaseManager:
    """Manages Firebase initialization and operations"""
    
    def __init__(self):
        self.app = None
        self.db = None
        self.bucket = None
        self.initialized = False
        
    def initialize(self):
        """Initialize Firebase Admin SDK"""
        if self.initialized:
            return
            
        try:
            # Check for service account file
            service_account_path = Path(__file__).parent.parent.parent / "config" / "firebase" / "service-account.json"
            
            if service_account_path.exists():
                # Use service account file
                cred = credentials.Certificate(str(service_account_path))
                self.app = firebase_admin.initialize_app(cred)
                logger.info("Firebase initialized with service account file")
            else:
                # Use environment variables
                firebase_config = {
                    "type": "service_account",
                    "project_id": os.getenv("FIREBASE_PROJECT_ID"),
                    "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
                    "private_key": os.getenv("FIREBASE_PRIVATE_KEY").replace('\\n', '\n'),
                    "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
                    "client_id": os.getenv("FIREBASE_CLIENT_ID"),
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
                
                cred = credentials.Certificate(firebase_config)
                self.app = firebase_admin.initialize_app(cred)
                logger.info("Firebase initialized with environment variables")
            
            # Initialize services
            self.db = firestore.client()
            self.bucket = storage.bucket()
            self.initialized = True
            
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
            raise
            
    def verify_token(self, id_token):
        """Verify Firebase ID token"""
        try:
            decoded_token = auth.verify_id_token(id_token)
            return decoded_token
        except Exception as e:
            logger.error(f"Token verification failed: {e}")
            return None
            
    def get_user(self, uid):
        """Get user by UID"""
        try:
            user = auth.get_user(uid)
            return user
        except Exception as e:
            logger.error(f"Failed to get user: {e}")
            return None
            
    def create_user(self, email, password=None, **kwargs):
        """Create new user"""
        try:
            user = auth.create_user(
                email=email,
                password=password,
                **kwargs
            )
            return user
        except Exception as e:
            logger.error(f"Failed to create user: {e}")
            return None

# Global instance
firebase_manager = FirebaseManager()

def get_firebase_manager():
    """Get Firebase manager instance"""
    if not firebase_manager.initialized:
        firebase_manager.initialize()
    return firebase_manager
EOF
    
    log "Firebase initialization script created at app/core/firebase_init.py"
}

# Main setup function
main() {
    echo -e "${BLUE}"
    echo "========================================="
    echo "   Firebase Project Setup"
    echo "========================================="
    echo -e "${NC}"
    
    # Set project root
    PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
    
    # Check requirements
    check_firebase_cli
    check_jq
    
    # Run setup steps
    firebase_login
    init_firebase_project
    setup_service_account
    enable_firebase_services
    setup_security_rules
    create_app_init_script
    
    log "Firebase setup completed successfully!"
    
    echo -e "\n${GREEN}Next steps:${NC}"
    echo "1. Review and update firebase.json and .firebaserc if needed"
    echo "2. Test Firebase connection by running the application"
    echo "3. Configure additional Firebase services in the console as needed"
    
    echo -e "\n${YELLOW}Firebase Console: https://console.firebase.google.com/project/$FIREBASE_PROJECT_ID/overview${NC}"
}

# Run main function
main "$@"