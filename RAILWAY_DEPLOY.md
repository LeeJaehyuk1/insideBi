# Railway 배포 가이드

이 프로젝트는 Railway에서 **3개의 서비스**로 구성됩니다.

```
[Next.js] ──→ [FastAPI (ai-backend)] ──→ [Ollama]
```

---

## 사전 준비

- [Railway](https://railway.app) 계정
- GitHub 저장소 연결
- Railway **Pro 플랜** 권장 (Ollama 모델 ~2GB, 메모리 4GB+ 필요)

---

## 서비스 1: Ollama

### 1-1. 새 서비스 추가

Railway 프로젝트 → **+ New** → **Empty Service**

### 1-2. 소스 설정

**Settings → Source** 탭:
- Source: **GitHub Repo** 선택 → 이 저장소 선택
- Root Directory: `ai-backend`
- Build Command: (비움)
- Dockerfile Path: `ollama.Dockerfile`

### 1-3. 볼륨 연결 (필수)

재배포 시 모델 재다운로드를 막으려면 볼륨이 필요합니다.

**Volumes** 탭 → **+ Add Volume**:
| 항목 | 값 |
|---|---|
| Mount Path | `/root/.ollama` |

### 1-4. 환경변수 설정

**Variables** 탭:
```
OLLAMA_MODEL=llama3.2:latest
```

> 더 작은 모델을 원하면 `llama3.2:1b` (약 700MB) 사용 가능

### 1-5. 포트 설정

**Settings → Networking**:
- TCP Port: `11434`
- **Private Networking** 활성화 (Public 노출 불필요)

### 1-6. 서비스 이름 확인

배포 후 서비스 이름을 메모해둡니다 (예: `ollama`).
내부 호스트 주소: `http://ollama.railway.internal:11434`

---

## 서비스 2: FastAPI (AI 백엔드)

### 2-1. 새 서비스 추가

Railway 프로젝트 → **+ New** → **GitHub Repo**

### 2-2. 소스 설정

**Settings → Source** 탭:
- Root Directory: `ai-backend`
- Watch Paths: `ai-backend/**`

Railway가 `railway.toml`을 자동 감지해 아래 명령으로 시작합니다:
```
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### 2-3. 환경변수 설정

**Variables** 탭:
```
OLLAMA_HOST=http://ollama.railway.internal:11434
OLLAMA_MODEL=llama3.2:latest
FRONTEND_URL=https://<Next.js 서비스 도메인>.railway.app
```

> `OLLAMA_HOST`의 서비스명은 Ollama 서비스 이름과 일치해야 합니다.
> `FRONTEND_URL`은 Next.js 서비스 배포 후 확인하여 입력하세요.

### 2-4. 포트 설정

**Settings → Networking** → **+ Add Port**:
- Public Port: 자동 생성됨
- 생성된 도메인을 메모 (예: `https://ai-backend-xxx.railway.app`)

### 2-5. SQLite DB 자동 초기화

서버 시작 시 DB 파일이 없으면 `db/migrate.py`가 자동 실행됩니다.
별도 조작 없이 첫 배포 시 자동으로 18개 테이블이 생성됩니다.

---

## 서비스 3: Next.js (프론트엔드)

### 3-1. 환경변수 설정

기존 Next.js Railway 서비스 → **Variables** 탭:
```
NEXT_PUBLIC_AI_API_URL=https://<FastAPI 서비스 도메인>.railway.app
```

### 3-2. 재배포

환경변수 저장 후 **Deploy** 또는 자동 재배포 대기.

---

## 배포 순서 요약

```
1. Ollama 서비스 배포 → 도메인(내부) 확인
2. FastAPI 서비스 배포 → OLLAMA_HOST 설정 → 도메인(공개) 확인
3. Next.js 서비스 → NEXT_PUBLIC_AI_API_URL 설정 → 재배포
```

---

## 첫 시작 타임라인

| 단계 | 소요 시간 | 내용 |
|---|---|---|
| Ollama 서버 기동 | ~10초 | |
| 모델 다운로드 (최초 1회) | 3~10분 | llama3.2 ~2GB |
| FastAPI 기동 + DB 초기화 | ~30초 | |
| **이후 재시작** | ~30초 | 볼륨에 모델 캐시됨 |

---

## 정상 동작 확인

FastAPI health check:
```
GET https://<fastapi-도메인>.railway.app/api/health
```

정상 응답:
```json
{
  "status": "ok",
  "model": "llama3.2:latest",
  "cache_size": 30
}
```

---

## 문제 해결

### AI 서버에 연결할 수 없습니다

1. FastAPI 서비스 로그 확인 → 기동 오류 여부 점검
2. `NEXT_PUBLIC_AI_API_URL`이 FastAPI 공개 도메인과 일치하는지 확인

### Ollama 연결 실패 (Connection refused)

1. Ollama 서비스가 완전히 시작됐는지 확인 (모델 pull 완료 대기)
2. `OLLAMA_HOST` 값의 서비스명이 Railway의 실제 서비스 이름과 일치하는지 확인
3. Ollama 서비스에 Private Networking이 활성화됐는지 확인

### 모델 pull 실패 (디스크 부족)

- Railway 볼륨 용량 확인 (기본 1GB → 5GB 이상으로 증설)
- 더 작은 모델 사용: `OLLAMA_MODEL=llama3.2:1b`

### CORS 오류

- FastAPI `FRONTEND_URL` 환경변수가 Next.js 도메인과 정확히 일치하는지 확인
- 프로토콜 포함 필요: `https://` 포함하여 입력

---

## 로컬 개발 환경

로컬에서는 기존과 동일하게 실행합니다:

```bash
# Ollama
ollama serve

# FastAPI
cd ai-backend
uvicorn main:app --reload --port 8000

# Next.js
npm run dev
```

`.env.local`:
```
NEXT_PUBLIC_AI_API_URL=http://localhost:8000
```
