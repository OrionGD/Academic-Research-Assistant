#!/bin/bash

# MongoDB Initialization Script
# Sets up MongoDB collections, indexes, and initial data

set -e

# Load environment variables
set -a
source ../.env
set +a

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

LOG_FILE="../logs/mongodb_init.log"
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

# Check if mongosh is installed
if ! command -v mongosh &> /dev/null; then
    error "mongosh is not installed. Please install MongoDB Shell."
    exit 1
fi

log "Starting MongoDB initialization for database: $MONGODB_DB_NAME"

# Create initialization script
INIT_SCRIPT=$(cat << EOF
use $MONGODB_DB_NAME;

// Create collections with validation
db.createCollection("documents", {
    validator: {
        \$jsonSchema: {
            bsonType: "object",
            required: ["content", "metadata", "created_at"],
            properties: {
                content: {
                    bsonType: "string",
                    description: "must be a string and is required"
                },
                metadata: {
                    bsonType: "object",
                    description: "must be an object and is required"
                },
                embedding: {
                    bsonType: ["array", "null"],
                    items: {
                        bsonType: "double"
                    }
                },
                created_at: {
                    bsonType: "date",
                    description: "must be a date and is required"
                }
            }
        }
    }
});

db.createCollection("conversations", {
    validator: {
        \$jsonSchema: {
            bsonType: "object",
            required: ["messages", "created_at"],
            properties: {
                messages: {
                    bsonType: "array",
                    items: {
                        bsonType: "object",
                        required: ["role", "content", "timestamp"],
                        properties: {
                            role: {
                                enum: ["user", "assistant", "system"],
                                description: "can only be user, assistant, or system"
                            },
                            content: {
                                bsonType: "string"
                            },
                            timestamp: {
                                bsonType: "date"
                            }
                        }
                    }
                },
                created_at: {
                    bsonType: "date"
                }
            }
        }
    }
});

db.createCollection("users", {
    validator: {
        \$jsonSchema: {
            bsonType: "object",
            required: ["email", "created_at"],
            properties: {
                email: {
                    bsonType: "string",
                    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
                },
                preferences: {
                    bsonType: "object"
                },
                created_at: {
                    bsonType: "date"
                }
            }
        }
    }
});

db.createCollection("chunks");

// Create indexes
db.documents.createIndex({ "created_at": -1 });
db.documents.createIndex({ "metadata.source": 1 });
db.documents.createIndex({ "metadata.user_id": 1 });
db.documents.createIndex({ "embedding": "2dsphere" });

db.conversations.createIndex({ "created_at": -1 });
db.conversations.createIndex({ "messages.timestamp": -1 });
db.conversations.createIndex({ "user_id": 1 });

db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "created_at": -1 });

db.chunks.createIndex({ "document_id": 1 });
db.chunks.createIndex({ "index": 1 });
db.chunks.createIndex({ "document_id": 1, "index": 1 }, { unique: true });

// Create initial system user
db.users.insertOne({
    email: "system@rag-backend.local",
    preferences: {
        theme: "system",
        notifications: false
    },
    created_at: new Date(),
    metadata: {
        type: "system",
        version: "1.0"
    }
});

// Create system conversation for RAG operations
db.conversations.insertOne({
    messages: [],
    created_at: new Date(),
    updated_at: new Date(),
    metadata: {
        type: "system",
        purpose: "RAG operations"
    }
});

// Create admin user (if not exists)
if (!db.users.findOne({ email: "admin@rag-backend.local" })) {
    db.users.insertOne({
        email: "admin@rag-backend.local",
        preferences: {
            theme: "dark",
            notifications: true
        },
        created_at: new Date(),
        metadata: {
            type: "admin",
            role: "administrator"
        }
    });
}

// Show collection stats
db.printCollectionStats();

// Show indexes
db.documents.getIndexes();
db.conversations.getIndexes();
db.users.getIndexes();
db.chunks.getIndexes();

EOF
)

# Execute initialization script
log "Creating collections and indexes..."
echo "$INIT_SCRIPT" | mongosh "$MONGODB_URI" --quiet 2>&1 | tee -a "$LOG_FILE"

if [ $? -eq 0 ]; then
    log "MongoDB initialization completed successfully!"
    
    # Verify setup
    VERIFY_SCRIPT=$(cat << EOF
use $MONGODB_DB_NAME;
print("\\n=== Database Statistics ===");
db.stats();
print("\\n=== Collection Counts ===");
db.documents.count();
db.conversations.count();
db.users.count();
db.chunks.count();
EOF
)
    
    echo "$VERIFY_SCRIPT" | mongosh "$MONGODB_URI" --quiet 2>&1 | tee -a "$LOG_FILE"
else
    error "MongoDB initialization failed!"
    exit 1
fi

log "Initialization complete. Check $LOG_FILE for details."