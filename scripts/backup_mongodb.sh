#!/bin/bash

# MongoDB Backup Script
# This script creates compressed backups of MongoDB database

# Load environment variables
set -a
source ../.env
set +a

# Configuration
BACKUP_DIR="../backups/mongodb"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="mongodb_backup_${TIMESTAMP}"
RETENTION_DAYS=7
LOG_FILE="../logs/mongodb_backup.log"

# Create directories if they don't exist
mkdir -p "$BACKUP_DIR"
mkdir -p "../logs"

# Logging function
log_message() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a "$LOG_FILE"
}

# Start backup
log_message "Starting MongoDB backup..."

# Extract MongoDB connection details from URI
if [[ $MONGODB_URI =~ mongodb\+srv://([^:]+):([^@]+)@([^/]+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASSWORD="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
else
    log_message "ERROR: Failed to parse MongoDB URI"
    exit 1
fi

# Perform backup
log_message "Backing up database: $MONGODB_DB_NAME"

mongodump \
    --uri="$MONGODB_URI" \
    --db="$MONGODB_DB_NAME" \
    --out="$BACKUP_DIR/$BACKUP_NAME" \
    --gzip \
    2>&1 | tee -a "$LOG_FILE"

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    log_message "Backup completed successfully: $BACKUP_NAME"
    
    # Create archive
    tar -czf "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"
    rm -rf "$BACKUP_DIR/$BACKUP_NAME"
    
    # Calculate backup size
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" | cut -f1)
    log_message "Backup size: $BACKUP_SIZE"
    
    # Clean up old backups
    find "$BACKUP_DIR" -name "mongodb_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
    log_message "Cleaned up backups older than $RETENTION_DAYS days"
    
    # Optional: Upload to cloud storage (AWS S3, Google Cloud Storage, etc.)
    # aws s3 cp "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" "s3://your-bucket/backups/"
else
    log_message "ERROR: Backup failed"
    exit 1
fi

log_message "Backup process completed"