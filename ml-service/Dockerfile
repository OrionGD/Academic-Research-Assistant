# ─────────────────────────────────────────────────────────────────────────────
# ARAS ML Service — Python 3.11 + FastAPI + uvicorn
# Python 3.11 is required: uses X | Y union syntax and list[str] generics
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.11-slim

# curl is required for the docker-compose healthcheck
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies (cached layer before copying source)
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy all application source files
COPY . .

EXPOSE 8000

# Run with uvicorn; reload is disabled in production
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
