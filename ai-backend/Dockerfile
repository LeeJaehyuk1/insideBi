FROM python:3.11-slim

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Railway/Docker 배포 시 SQLCODER_MODE=defog_api 환경변수를 설정하면
# Defog API 모드로 자동 전환됩니다 (Ollama 불필요).
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
