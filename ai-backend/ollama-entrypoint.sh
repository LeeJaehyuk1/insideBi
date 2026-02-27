#!/bin/bash
set -e

# Start Ollama server in background
ollama serve &
OLLAMA_PID=$!

# Wait until Ollama is ready
echo "[ollama] Starting server..."
until curl -sf http://localhost:11434/api/version > /dev/null 2>&1; do
  sleep 2
done
echo "[ollama] Server ready"

# Pull model (OLLAMA_MODEL env var, default: llama3.2:latest)
MODEL=${OLLAMA_MODEL:-llama3.2:latest}
echo "[ollama] Pulling model: $MODEL"
ollama pull "$MODEL"
echo "[ollama] Model ready: $MODEL"

# Keep server running
wait $OLLAMA_PID
