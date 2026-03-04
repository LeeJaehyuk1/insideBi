# InsightBi AI 백엔드 환경 비교 문서

> 작성일: 2026-03-04
> 대상 파일: `ai-backend/main.py`, `ai-backend/vanna_setup.py`, `ai-backend/.env`

---

## 목차

1. [환경 개요](#1-환경-개요)
2. [LLM 파이프라인](#2-llm-파이프라인)
3. [데이터베이스](#3-데이터베이스)
4. [ChromaDB 벡터 스토어](#4-chromadb-벡터-스토어)
5. [Golden SQL 캐시](#5-golden-sql-캐시)
6. [Narrative 엔드포인트](#6-narrative-엔드포인트)
7. [전체 요청 흐름](#7-전체-요청-흐름)
8. [환경변수 대조표](#8-환경변수-대조표)
9. [주요 리스크 포인트](#9-주요-리스크-포인트)
10. [자주 발생하는 문제](#10-자주-발생하는-문제)

---

## 1. 환경 개요

| 구분 | 로컬 (Local) | 프로덕션 (Railway) |
|---|---|---|
| 서버 | Windows 11, localhost:8000 | Railway 컨테이너 |
| LLM | Ollama (로컬 GPU/CPU) | Groq API (클라우드) |
| DB | PostgreSQL localhost / SQLite fallback | Railway PostgreSQL |
| ChromaDB | 로컬 디렉토리 (영구) | 컨테이너 내부 (재배포 시 초기화) |
| 인터넷 | 불필요 | 필요 (Groq API) |

---

## 2. LLM 파이프라인

### 2-1. 환경별 클래스 및 모델

| 구분 | 로컬 | Railway |
|---|---|---|
| `LLM_PROVIDER` | `sqlcoder` | `sqlcoder` |
| `SQLCODER_MODE` | `ollama` | `groq` |
| **사용 클래스** | `SQLCoderOllamaVanna` | `GroqSQLVanna` |
| **Primary 모델** | `sqlcoder:7b` (로컬 4GB) | `llama-3.3-70b-versatile` |
| **Fallback 클래스** | `FallbackOllamaVanna` | `None` |
| **Fallback 모델** | `qwen2.5-coder:1.5b` | `llama-3.1-8b-instant` (Groq 내부) |
| **추론 속도** | 30 ~ 120초 (CPU) | 1 ~ 3초 |

### 2-2. SQL 생성 방식 차이

**로컬 — Ollama completion 방식**

```
_build_sqlcoder_prompt()
  → 시스템 프롬프트 + 스키마 + few-shot + 질문을 단일 문자열로 조합
  → POST /api/generate  (Ollama completion endpoint)
  → 응답: { "response": "SELECT ..." }
```

**Railway — Groq chat 방식**

```
_build_sqlcoder_messages()
  → [{"role":"system","content":...}, {"role":"user","content":...}] 리스트로 조합
  → client.chat.completions.create()  (OpenAI 호환 API)
  → 응답: choices[0].message.content
```

### 2-3. Fallback 동작 차이

- **로컬**: Primary(`sqlcoder:7b`) 실패 시 → `FallbackOllamaVanna`(`qwen2.5-coder:1.5b`)로 재시도 (최대 2회)
- **Railway**: Primary(`llama-3.3-70b-versatile`) 실패/rate limit(429) 시 → Groq 내부에서 `llama-3.1-8b-instant`로 자동 전환. 별도 Fallback 클래스 없음

---

## 3. 데이터베이스

### 3-1. 연결 정보

| 구분 | 로컬 | Railway |
|---|---|---|
| DB 종류 | PostgreSQL 또는 SQLite | PostgreSQL |
| 호스트 | localhost:5432 | postgres.railway.internal:5432 |
| DB명 | `insidebi` | `railway` |
| SQLite fallback | `./db/insightbi.db` (DATABASE_URL 미설정 시) | 없음 |
| 인코딩 | Korean_Korea.949 collation (Windows) | UTF-8 |

### 3-2. 연결 풀 설정 (`vanna_setup.py`)

```python
_pg_engine = create_engine(
    DATABASE_URL,
    pool_size=3,        # 기본 연결 수
    max_overflow=2,     # 추가 허용 연결
    pool_pre_ping=True, # 끊긴 연결 자동 재연결
    pool_recycle=300,   # 5분마다 연결 재활용
    connect_args={"connect_timeout": 10},
)
```

### 3-3. 테이블 목록

| 테이블 | 설명 | 행 수 |
|---|---|---|
| `npl_trend` | 월별 NPL 비율 추이 | 12 |
| `credit_grades` | 신용등급별 익스포저 | 7 |
| `sector_exposure` | 업종별 익스포저 | 8 |
| `concentration` | 업종 집중도 | 8 |
| `npl_summary` | NPL 요약 (scalar) | 1 |
| `pd_lgd_ead` | 신용리스크 파라미터 (scalar) | 1 |
| `var_trend` | VaR 일별 추이 | ~170 |
| `stress_scenarios` | 스트레스 시나리오 | 6 |
| `sensitivity` | 리스크 민감도 | 6 |
| `var_summary` | VaR 요약 (scalar) | 1 |
| `lcr_nsfr_trend` | LCR/NSFR 월별 추이 | 12 |
| `maturity_gap` | 만기갭 구간별 | 7 |
| `liquidity_buffer` | 유동성 버퍼 전망 | 5 |
| `funding_structure` | 조달 구조 | 7 |
| `lcr_gauge` | LCR 게이지 (scalar) | 1 |
| `td_irncr` | NCR 산출 데이터 | 다수 |
| `td_irpos` | 금리포지션 데이터 | 784 |
| `td_irriskcr` | 신용위험 산출 데이터 | 4,180 |
| `td_irriskmr` | 시장위험 산출 데이터 | 3,780 |

---

## 4. ChromaDB 벡터 스토어

### 4-1. 개요

| 구분 | 로컬 | Railway |
|---|---|---|
| 저장 경로 | `./chroma_db` (영구) | `./chroma_db` (컨테이너 내부) |
| **지속성** | 영구 유지 | ⚠️ **재배포 시 초기화** |
| 학습 트리거 | 수동 `python train.py` | startup 시 자동 감지 후 실행 |
| n_results | 3 (RAG few-shot 예제 수) | 3 |

### 4-2. startup 자동 학습 로직

```python
# main.py _startup()
df = vn.get_training_data()
chroma_empty = df is None or len(df) == 0

if chroma_empty:
    # train.py + train_ncr.py 순차 실행
    subprocess.run([sys.executable, "train.py"])
    subprocess.run([sys.executable, "train_ncr.py"])
```

Railway 재배포 후 **첫 요청까지 1~2분 소요** 될 수 있음 (ChromaDB 학습 완료 대기).

### 4-3. 학습 내용 구성

| 학습 유형 | 파일 | 내용 |
|---|---|---|
| DDL | `training/ddl.sql` | 19개 테이블 CREATE 문 |
| 문서 | `training/documentation.md` | 비즈니스 도메인 용어집 |
| Golden SQL | `training/golden_sql.json` | 154개 질문-SQL 쌍 |
| NCR DDL | `db/create_td_ir*.py` | td_irncr/pos/riskcr/riskmr 스키마 |

### 4-4. 구형 항목 자동 정리

startup 시 `ncr_summary`, `ncr_trend`, `risk_composition` 관련 구형 ChromaDB 항목을 자동 제거합니다.

---

## 5. Golden SQL 캐시

### 5-1. 동작 방식

```python
# 서버 시작 시 메모리 로드
_sql_cache: dict[str, str] = {}
_load_golden_sql()  # golden_sql.json → _sql_cache (154개)

# 요청마다 유사도 비교
def find_cached_sql(question):
    score = SequenceMatcher(None, question, cached_q).ratio()
    if score >= CACHE_THRESHOLD:  # 0.92
        return cached_sql, score
```

### 5-2. 환경별 파일

| 구분 | 로컬 | Railway |
|---|---|---|
| 기본 파일 | `training/golden_sql.json` | `training/golden_sql.json` |
| 환경변수 지정 | `GOLDEN_SQL_FILE=golden_sql.json` | `GOLDEN_SQL_FILE=golden_sql_railway.json` (설정 시) |
| 항목 수 | 154개 | 154개 |

### 5-3. 캐시 임계값

| 버전 | 임계값 | 비고 |
|---|---|---|
| 구버전 | `0.62` | 대부분 캐시 히트 → LLM 거의 미사용 |
| **현재** | **`0.92`** | 거의 동일한 질문만 캐시, 나머지는 LLM 생성 |

---

## 6. Narrative 엔드포인트

`POST /api/narrative` — 차트 데이터를 받아 1~2문장 한국어 해설 생성

### 6-1. 환경별 LLM 호출

| 구분 | 로컬 | Railway |
|---|---|---|
| 조건 | `GROQ_API_KEY` 없음 | `GROQ_API_KEY` 있음 |
| 사용 LLM | Ollama `FALLBACK_OLLAMA_MODEL` | Groq `llama-3.1-8b-instant` |
| 속도 | 느림 | 빠름 |

### 6-2. 처리 흐름

```
req.data (list of dicts)
  → pd.DataFrame() 변환
  → 수치 컬럼 통계 계산 (min/max/mean/trend)
  → 프롬프트 생성
  → LLM 호출 (Groq or Ollama)
  → 실패 시 템플릿 fallback
      → "{col}은 {first}에서 {last}으로 {trend} 추세입니다."
```

---

## 7. 전체 요청 흐름

### 로컬

```
[사용자 질문]
       ↓
  _sql_cache 조회 (SequenceMatcher, threshold=0.92)
       ↓ 캐시 미스
  SQLCoderOllamaVanna.generate_sql()
       ↓
  ChromaDB RAG → 유사 예제 3개 추출
       ↓
  _build_sqlcoder_prompt() → 단일 문자열 프롬프트
       ↓
  POST http://localhost:11434/api/generate
  모델: sqlcoder:7b
       ↓ 실패 (최대 2회)
  FallbackOllamaVanna.generate_sql()
  모델: qwen2.5-coder:1.5b
       ↓
  _clean_sql() → SELECT 문 추출
       ↓
  vn.run_sql() → PostgreSQL(insidebi) or SQLite
       ↓
  응답 반환 (sql, data, chart_type, summary)
```

### Railway

```
[사용자 질문]
       ↓
  _sql_cache 조회 (SequenceMatcher, threshold=0.92)
       ↓ 캐시 미스
  GroqSQLVanna.generate_sql()
       ↓
  ChromaDB RAG → 유사 예제 3개 추출
       ↓
  _build_sqlcoder_messages() → 메시지 리스트
       ↓
  Groq chat.completions.create()
  모델: llama-3.3-70b-versatile
       ↓ rate limit(429) 또는 503
  Groq 내부 전환: llama-3.1-8b-instant
       ↓ 모두 실패
  HTTP 503 반환
       ↓ 성공
  _clean_sql() → SELECT 문 추출
       ↓
  vn.run_sql() → Railway PostgreSQL
       ↓
  응답 반환 (sql, data, chart_type, summary)
```

---

## 8. 환경변수 대조표

| 변수명 | 로컬 값 | Railway 값 | 설명 |
|---|---|---|---|
| `LLM_PROVIDER` | `sqlcoder` | `sqlcoder` | LLM 백엔드 종류 |
| `SQLCODER_MODE` | `ollama` | `groq` | SQLCoder 실행 방식 |
| `SQLCODER_MODEL` | `sqlcoder:7b` | — | Ollama 모델명 |
| `OLLAMA_HOST` | `http://localhost:11434` | `http://ollama.railway.internal:11434` | Ollama 서버 주소 |
| `OLLAMA_MODEL` | `qwen2.5-coder:1.5b` | — | Fallback Ollama 모델 |
| `GROQ_API_KEY` | — | `gsk_...` | Groq API 키 |
| `GROQ_MODEL_SQL` | `llama-3.3-70b-versatile` | `llama-3.3-70b-versatile` | Groq Primary 모델 |
| `GROQ_MODEL_FB` | `llama-3.1-8b-instant` | `llama-3.1-8b-instant` | Groq Fallback 모델 |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/insidebi` | `postgresql://...@postgres.railway.internal:5432/railway` | DB 연결 문자열 |
| `DB_PATH` | `./db/insightbi.db` | `./db/insightbi.db` | SQLite fallback 경로 |
| `CHROMA_PATH` | `./chroma_db` | `./chroma_db` | ChromaDB 저장 경로 |
| `ADMIN_PASSWORD` | `admin1234` | Railway Variables에 설정 | 관리자 비밀번호 |
| `FRONTEND_URL` | — | Next.js 서비스 도메인 | CORS 허용 도메인 |
| `GOLDEN_SQL_FILE` | — (기본값 사용) | `golden_sql_railway.json` (선택) | Golden SQL 파일명 |

---

## 9. 주요 리스크 포인트

| 항목 | 로컬 | Railway | 대응 방안 |
|---|---|---|---|
| **추론 속도** | 30~120초 (CPU) | 1~3초 | — |
| **Rate Limit** | 없음 | Groq 30 RPM / 14,400 RPD | 내부 모델 전환으로 자동 대응 |
| **ChromaDB 유실** | 없음 | 재배포 시 초기화 | startup 자동 재학습 |
| **콜드 스타트** | 빠름 | 재배포 후 1~2분 소요 | 학습 완료 후 첫 요청 정상 처리 |
| **인코딩 오류** | pandas UTF-8 실패 가능 | 없음 | pg_dump/psql로 직접 이전 |
| **DB 연결 끊김** | 드뭄 | Railway idle timeout | `pool_pre_ping=True`, `pool_recycle=300` |
| **SQLite fallback** | DATABASE_URL 미설정 시 활성 | 비활성 | Railway는 항상 PostgreSQL |

---

## 10. 자주 발생하는 문제

### `[narrative] LLM 실패, 템플릿 사용`

- **원인**: `vn.submit_prompt()`가 새 백엔드에서 `NotImplementedError` 발생
- **해결**: Groq/Ollama API를 `GROQ_API_KEY` 유무로 직접 분기 호출로 수정됨

### 모든 질문이 캐시에서 응답 (`from_cache: true`)

- **원인**: `CACHE_THRESHOLD=0.62` 설정이 너무 낮아 유사 질문 전부 캐시 히트
- **해결**: `0.92`로 상향 → 거의 동일한 질문만 캐시, 나머지는 LLM 생성

### Railway 재배포 후 첫 응답 느림

- **원인**: ChromaDB 초기화 → `train.py` + `train_ncr.py` 자동 실행
- **해결**: 정상 동작. 학습 완료 후 2번째 요청부터 정상 속도

### `string indices must be integers, not 'str'`

- **원인**: `vn.submit_prompt(plain_string)` 호출 시 Vanna 내부에서 문자열을 메시지 리스트로 오인
- **해결**: `submit_prompt` 우회, Groq/Ollama 직접 호출로 변경
