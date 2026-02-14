FROM mongo:7.0

# Install additional tools
RUN apt-get update && apt-get install -y \
    netcat-openbsd \
    curl \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Create directories for data and scripts
RUN mkdir -p /data/db /data/configdb /scripts /docker-entrypoint-initdb.d

# Copy initialization scripts
COPY scripts/*.js /docker-entrypoint-initdb.d/
COPY scripts/*.js /scripts/
COPY config/mongod.conf /etc/mongo/mongod.conf

# Make scripts executable
RUN chmod +x /scripts/*.js

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD mongosh --eval "db.adminCommand('ping')" || exit 1

# Expose MongoDB port
EXPOSE 27017

# Use custom configuration
CMD ["mongod", "--config", "/etc/mongo/mongod.conf"]