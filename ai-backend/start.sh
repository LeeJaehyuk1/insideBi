#!/bin/bash
set -e

# 1. Ollama 서버 백그라운드 시작
echo "[start] Starting Ollama server..."
ollama serve &

# 2. Ollama 준비 대기
until curl -sf http://localhost:11434/api/version > /dev/null 2>&1; do
  sleep 2
done
echo "[start] Ollama ready"

# 3. 모델 pull (볼륨에 캐시되면 즉시 완료)
MODEL=${OLLAMA_MODEL:-llama3.2:latest}
echo "[start] Pulling model: $MODEL"
ollama pull "$MODEL"
echo "[start] Model ready: $MODEL"

# 4. FastAPI 시작
echo "[start] Starting FastAPI..."
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
