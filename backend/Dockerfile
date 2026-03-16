# ─────────────────────────────────────────────────────────────────────────────
# ARAS Backend — Node.js 20 + TypeScript
# Multi-stage: Stage 1 compiles TS, Stage 2 runs production-only deps
# ─────────────────────────────────────────────────────────────────────────────

# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy lock files first for layer-cache efficiency
COPY package*.json ./

# Install ALL deps (devDeps needed for tsc)
RUN npm install

# Copy source and config
COPY tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript → dist/
RUN npm run build

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS production

# curl is required for the docker-compose healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Install production deps only
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

# Copy Google Cloud service account key (used by firebase-admin & @google-cloud/storage)
# For production, prefer injecting credentials via environment variables or Docker secrets
COPY serviceAccountKey.json ./serviceAccountKey.json

EXPOSE 5000

# Default command runs the Express API server.
# The backend-workers service overrides this with: node dist/workers/index.js
CMD ["node", "dist/server.js"]
