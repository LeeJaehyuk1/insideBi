"""
vanna_setup.py – Vanna AI + SQLCoder 이중 파이프라인 (v3 - Defog 유료화 대응)

[환경별 구성]
  로컬 개발  : LLM_PROVIDER=sqlcoder  SQLCODER_MODE=ollama
              → Ollama에서 sqlcoder:7b 직접 실행 (완전 무료)

  프로덕션   : LLM_PROVIDER=sqlcoder  SQLCODER_MODE=groq
              → Groq API + SQLCoder 전용 프롬프트 (무료 티어)
              → Primary: llama-3.3-70b-versatile (고정확도)
              → Secondary: llama-3.1-8b-instant  (빠른 폴백)

  레거시     : LLM_PROVIDER=groq | openai | ollama (하위 호환)

[파이프라인]
  질문 → ChromaDB(RAG few-shot) → Primary LLM → validate → run
                                       ↓ 실패
                                  Secondary LLM (동일 Groq, 소형 모델)
                                       ↓ 실패
                                  503 에러 반환
"""
import os
import re
import sqlite3

import pandas as pd
import requests
from dotenv import load_dotenv
from vanna.chromadb import ChromaDB_VectorStore

load_dotenv()

# ── 환경 변수 ────────────────────────────────────────────────────
LLM_PROVIDER   = os.getenv("LLM_PROVIDER", "ollama")   # sqlcoder | groq | openai | ollama
SQLCODER_MODE  = os.getenv("SQLCODER_MODE", "ollama")  # ollama | groq
CHROMA_PATH    = os.getenv("CHROMA_PATH", "./chroma_db")
DB_PATH        = os.getenv("DB_PATH", "./db/insidebi.db")
DATABASE_URL   = os.getenv("DATABASE_URL", "")         # PostgreSQL (Railway 등 프로덕션)

# SQLCoder via Ollama
SQLCODER_MODEL  = os.getenv("SQLCODER_MODEL", "sqlcoder:7b")  # ollama: sqlcoder:7b / sqlcoder:15b
OLLAMA_HOST     = os.getenv("OLLAMA_HOST", "http://localhost:11434")

# Groq (프로덕션 Primary + 범용 Fallback)
GROQ_API_KEY   = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL_SQL = os.getenv("GROQ_MODEL_SQL", "llama-3.3-70b-versatile")  # SQL 생성 메인
GROQ_MODEL_FB  = os.getenv("GROQ_MODEL_FB",  "llama-3.1-8b-instant")     # SQL 생성 폴백

# 범용 Ollama fallback 모델 (로컬)
FALLBACK_OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:latest")

# 모델명 (health 엔드포인트용)
MODEL_NAME = {
    "sqlcoder": (
        f"SQLCoder-Ollama({SQLCODER_MODEL})" if SQLCODER_MODE == "ollama"
        else f"SQLCoder-Groq({GROQ_MODEL_SQL})"
    ),
    "groq":    os.getenv("GROQ_MODEL", GROQ_MODEL_SQL),
    "openai":  os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
}.get(LLM_PROVIDER, FALLBACK_OLLAMA_MODEL)


# ── 공통 DDL (compact) ──────────────────────────────────────────
_COMPACT_DDL = """\
CREATE TABLE npl_trend(month TEXT,npl REAL,substandard REAL,doubtful REAL,loss REAL);
CREATE TABLE credit_grades(grade TEXT,amount REAL,count INTEGER,pct REAL);
CREATE TABLE sector_exposure(sector TEXT,amount REAL,pct REAL,pd REAL);
CREATE TABLE concentration(name TEXT,x REAL,y REAL,z REAL);
CREATE TABLE npl_summary(total_loan REAL,npl_amount REAL,npl_ratio REAL,substandard REAL,doubtful REAL,loss REAL,provision_amount REAL,provision_ratio REAL,net_npl REAL);
CREATE TABLE pd_lgd_ead(pd REAL,lgd REAL,ead REAL,expected_loss REAL,unexpected_loss REAL,rwa REAL);
CREATE TABLE var_trend(date TEXT,var REAL,pnl REAL,var_limit REAL);
CREATE TABLE stress_scenarios(name TEXT,credit_loss REAL,market_loss REAL,liquidity_loss REAL,total REAL,bis_after REAL);
CREATE TABLE sensitivity(factor TEXT,value REAL,full_mark REAL);
CREATE TABLE var_summary(current REAL,limit_val REAL,utilization REAL,avg_last20 REAL,max_last20 REAL,breach_count30d INTEGER,delta REAL,gamma REAL,vega REAL,rho REAL);
CREATE TABLE lcr_nsfr_trend(month TEXT,lcr REAL,nsfr REAL,hqla REAL,outflow REAL);
CREATE TABLE maturity_gap(bucket TEXT,assets REAL,liabilities REAL,gap REAL);
CREATE TABLE liquidity_buffer(date TEXT,available REAL,required REAL,stress REAL);
CREATE TABLE funding_structure(source TEXT,amount REAL,pct REAL,stability TEXT);
CREATE TABLE lcr_gauge(lcr REAL,nsfr REAL,hqla REAL,net_outflow REAL,level1 REAL,level2a REAL,level2b REAL,lcr_threshold REAL,nsfr_threshold REAL);
CREATE TABLE ncr_trend(month TEXT,ncr REAL,ncr_limit REAL);
CREATE TABLE ncr_summary(current_ncr REAL,ncr_limit REAL,net_operating_capital REAL,total_risk REAL,market_risk REAL,credit_risk REAL,operational_risk REAL,warning_level REAL,target_level REAL,change_from_last_month REAL);
CREATE TABLE risk_composition(name TEXT,value REAL,percentage REAL);"""

# ── SQLCoder 전용 시스템 프롬프트 ───────────────────────────────
# Defog 공식 권장 포맷 기반 (Ollama sqlcoder:7b 및 Groq Llama 모두 호환)
_DB_DIALECT = "PostgreSQL" if DATABASE_URL else "SQLite"

_SQLCODER_SYSTEM = f"""\
### Instructions:
Your task is to convert a question into a SQL query, given a {_DB_DIALECT} database schema.
Adhere to these rules:
- **Deliberately go through the question and database schema word by word** to appropriately answer the question
- **Use Table Aliases** to prevent ambiguity
- **Output ONLY valid {_DB_DIALECT} SELECT SQL** — no explanation, no markdown fences, no extra text
- For time-series data, ORDER BY month or date ASC
- For TOP-N queries, use ORDER BY col DESC LIMIT N
- For the latest single value, use ORDER BY col DESC LIMIT 1
- Scalar tables (npl_summary, pd_lgd_ead, var_summary, lcr_gauge) have exactly 1 row — do NOT add LIMIT unless asked
- amount unit is 억원 (KRW 100M)
- Domain glossary: NPL=무수익여신, VaR=가치위험, LCR=유동성커버리지비율, NSFR=순안정자금조달비율, NCR=순자본비율, BIS=자기자본비율, 익스포저=신용위험노출액"""

_SQLCODER_SCHEMA = f"""
### Database Schema ({_DB_DIALECT}):
{_COMPACT_DDL}"""

# 범용 fallback 시스템 프롬프트 (간결 버전)
_FALLBACK_SYSTEM = f"""\
You are a {_DB_DIALECT} expert. Output ONLY valid {_DB_DIALECT} SELECT SQL, no explanation.
Tables:
{_COMPACT_DDL}
Rules:
- ORDER BY month/date for trends
- LIMIT N for TOP-N queries; ORDER BY col DESC LIMIT 1 for latest value
- Scalar tables (npl_summary, pd_lgd_ead, var_summary, lcr_gauge) have exactly 1 row
- amount unit: 억원 (KRW 100M)"""


# ── SQL 후처리 ───────────────────────────────────────────────────

def _clean_sql(raw: str) -> str:
    """LLM 출력에서 마크다운 코드블록·설명 텍스트 제거 → 순수 SQL 반환"""
    s = raw.strip()
    # ```sql ... ``` 추출
    fence = re.search(r"```(?:sql)?\s*([\s\S]*?)```", s, re.IGNORECASE)
    if fence:
        return fence.group(1).strip()
    # SELECT로 시작하는 블록 추출
    for line in s.splitlines():
        line = line.strip()
        if line.upper().startswith("SELECT"):
            idx = s.find(line)
            candidate = s[idx:]
            semi = candidate.find(";")
            return (candidate[: semi + 1] if semi != -1 else candidate).strip()
    return s


# ── SQLCoder 프롬프트 빌더 ────────────────────────────────────────

def _build_sqlcoder_prompt(question: str, similar: list) -> str:
    """
    SQLCoder 공식 포맷으로 단일 문자열 프롬프트 구성
    (Ollama /api/generate 용 — completion 방식)
    """
    parts = [_SQLCODER_SYSTEM, _SQLCODER_SCHEMA]

    if similar:
        parts.append("\n### Examples:")
        for item in similar[:3]:
            if isinstance(item, dict) and "question" in item and "sql" in item:
                parts.append(f"-- Q: {item['question']}\n{item['sql']}")

    parts.append(f"\n### Question:\n{question}")
    parts.append(f"\n### Answer ({_DB_DIALECT} SQL only):\n")
    return "\n".join(parts)


def _build_sqlcoder_messages(question: str, similar: list) -> list:
    """
    SQLCoder 전용 프롬프트를 Chat 형식으로 구성
    (Groq / OpenAI-compatible API 용)
    """
    system_content = _SQLCODER_SYSTEM + _SQLCODER_SCHEMA

    messages = [{"role": "system", "content": system_content}]

    # Few-shot 예시 (ChromaDB RAG 결과)
    for item in (similar or [])[:3]:
        if isinstance(item, dict) and "question" in item and "sql" in item:
            messages.append({"role": "user",      "content": f"### Question:\n{item['question']}\n### Answer:"})
            messages.append({"role": "assistant", "content": item["sql"]})

    messages.append({"role": "user", "content": f"### Question:\n{question}\n### Answer:"})
    return messages


# ── DB 실행 헬퍼 (PostgreSQL 우선, 없으면 SQLite fallback) ────────

def _run_sql(sql: str) -> pd.DataFrame:
    if DATABASE_URL:
        from sqlalchemy import create_engine, text
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            return pd.read_sql(text(sql), conn)
    else:
        conn = sqlite3.connect(DB_PATH)
        try:
            return pd.read_sql(sql, conn)
        finally:
            conn.close()


# ════════════════════════════════════════════════════════════════
#  백엔드 클래스
# ════════════════════════════════════════════════════════════════

class _VannaBase:
    """공통 인터페이스"""
    def generate_sql(self, question: str, **kwargs) -> str:
        raise NotImplementedError


# ────────────────────────────────────────────────────────────────
# 옵션 A: SQLCoder via Ollama  (로컬 개발용, 완전 무료)
# ────────────────────────────────────────────────────────────────

class SQLCoderOllamaVanna(_VannaBase, ChromaDB_VectorStore):
    """
    Ollama에서 sqlcoder:7b 모델을 직접 실행.
    ChromaDB RAG → SQLCoder 전용 completion 프롬프트 → SQL 생성
    """

    def __init__(self):
        ChromaDB_VectorStore.__init__(self, config={"path": CHROMA_PATH, "n_results": 3})

    # ── Vanna 추상 메서드 구현 (ChromaDB_VectorStore 요건 충족) ──────
    # generate_sql을 직접 오버라이드하므로 실제로 호출되지 않음
    def system_message(self, message: str) -> dict:
        return {"role": "system", "content": message}

    def user_message(self, message: str) -> dict:
        return {"role": "user", "content": message}

    def assistant_message(self, message: str) -> dict:
        return {"role": "assistant", "content": message}

    def submit_prompt(self, prompt, **kwargs) -> str:
        """generate_sql에서 직접 호출하므로 여기는 사용되지 않음"""
        raise NotImplementedError("SQLCoderOllamaVanna uses generate_sql directly")

    # ── 핵심 로직 ───────────────────────────────────────────────────
    def _ollama_generate(self, prompt: str) -> str:
        """Ollama /api/generate (completion) 엔드포인트 호출"""
        resp = requests.post(
            f"{OLLAMA_HOST}/api/generate",
            json={
                "model": SQLCODER_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_predict": 300,
                    "temperature": 0.0,
                    "stop": ["```", "\n\n\n", "###", "-- Q:"],
                },
            },
            timeout=120,
        )
        resp.raise_for_status()
        return resp.json().get("response", "")

    def generate_sql(self, question: str, **kwargs) -> str:
        try:
            similar = self.get_similar_question_sql(question)
        except Exception:
            similar = []
        prompt = _build_sqlcoder_prompt(question, similar)
        raw = self._ollama_generate(prompt)
        return _clean_sql(raw)

    def generate_embedding(self, data: str, **kwargs):
        return ChromaDB_VectorStore.generate_embedding(self, data, **kwargs)


# ────────────────────────────────────────────────────────────────
# 옵션 B: SQLCoder 전용 프롬프트 + Groq  (프로덕션, 무료 티어)
# ────────────────────────────────────────────────────────────────

class GroqSQLVanna(_VannaBase, ChromaDB_VectorStore):
    """
    Groq API + SQLCoder 전용 프롬프트로 고정확도 Text-to-SQL.
    - Primary 모델: llama-3.3-70b-versatile  (벤치마크: SQLCoder 7B 능가)
    - 내부 Secondary: llama-3.1-8b-instant   (rate limit 초과 시 자동 전환)

    Groq 무료 티어 rate limit:
      llama-3.3-70b : 30 RPM / 14,400 RPD / 12,000 TPM
      llama-3.1-8b  : 30 RPM / 14,400 RPD / 20,000 TPM
    """

    def __init__(self):
        ChromaDB_VectorStore.__init__(self, config={"path": CHROMA_PATH, "n_results": 3})
        if not GROQ_API_KEY:
            raise EnvironmentError(
                "GROQ_API_KEY 환경변수가 설정되지 않았습니다. "
                "https://console.groq.com 에서 무료 API 키를 발급 받으세요."
            )
        from openai import OpenAI
        self._client = OpenAI(
            api_key=GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1",
        )

    # ── Vanna 추상 메서드 구현 ────────────────────────────────────
    def system_message(self, message: str) -> dict:
        return {"role": "system", "content": message}

    def user_message(self, message: str) -> dict:
        return {"role": "user", "content": message}

    def assistant_message(self, message: str) -> dict:
        return {"role": "assistant", "content": message}

    def submit_prompt(self, prompt, **kwargs) -> str:
        raise NotImplementedError("GroqSQLVanna uses generate_sql directly")

    # ── 핵심 로직 ───────────────────────────────────────────────────
    def _call_groq(self, messages: list, model: str) -> str:
        resp = self._client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.0,
            max_tokens=300,
        )
        return resp.choices[0].message.content

    def generate_sql(self, question: str, **kwargs) -> str:
        try:
            similar = self.get_similar_question_sql(question)
        except Exception:
            similar = []

        messages = _build_sqlcoder_messages(question, similar)

        # Primary: 고정확도 대형 모델
        try:
            raw = self._call_groq(messages, GROQ_MODEL_SQL)
            return _clean_sql(raw)
        except Exception as e:
            err_str = str(e)
            # Rate limit(429) 또는 서버 에러 시에만 internal secondary로 전환
            if "429" in err_str or "rate" in err_str.lower() or "503" in err_str:
                print(f"[groq] {GROQ_MODEL_SQL} rate-limit → {GROQ_MODEL_FB} 전환: {err_str[:80]}")
                raw = self._call_groq(messages, GROQ_MODEL_FB)
                return _clean_sql(raw)
            raise  # 다른 에러는 상위 fallback으로 전달

    def generate_embedding(self, data: str, **kwargs):
        return ChromaDB_VectorStore.generate_embedding(self, data, **kwargs)


# ────────────────────────────────────────────────────────────────
# Fallback: 범용 Ollama (sqlcoder 실패 시)
# ────────────────────────────────────────────────────────────────

class FallbackOllamaVanna(_VannaBase, ChromaDB_VectorStore):
    """로컬 환경 fallback — 범용 llama 모델로 SQL 재시도"""

    def __init__(self):
        ChromaDB_VectorStore.__init__(self, config={"path": CHROMA_PATH, "n_results": 3})

    # ── Vanna 추상 메서드 구현 ────────────────────────────────────
    def system_message(self, message: str) -> dict:
        return {"role": "system", "content": message}

    def user_message(self, message: str) -> dict:
        return {"role": "user", "content": message}

    def assistant_message(self, message: str) -> dict:
        return {"role": "assistant", "content": message}

    def submit_prompt(self, prompt, **kwargs) -> str:
        raise NotImplementedError("FallbackOllamaVanna uses generate_sql directly")

    def generate_sql(self, question: str, **kwargs) -> str:
        try:
            similar = self.get_similar_question_sql(question)
        except Exception:
            similar = []

        messages = [{"role": "system", "content": _FALLBACK_SYSTEM}]
        for item in (similar or []):
            if isinstance(item, dict) and "question" in item and "sql" in item:
                messages.append({"role": "user",      "content": item["question"]})
                messages.append({"role": "assistant", "content": item["sql"]})
        messages.append({"role": "user", "content": question})

        resp = requests.post(
            f"{OLLAMA_HOST}/api/chat",
            json={
                "model": FALLBACK_OLLAMA_MODEL,
                "messages": messages,
                "stream": False,
                "options": {"temperature": 0.0, "num_predict": 300},
            },
            timeout=120,
        )
        resp.raise_for_status()
        return _clean_sql(resp.json()["message"]["content"])

    def generate_embedding(self, data: str, **kwargs):
        return ChromaDB_VectorStore.generate_embedding(self, data, **kwargs)


# ────────────────────────────────────────────────────────────────
# 레거시: 기존 Vanna 내장 백엔드 (openai / groq / ollama 직접)
# ────────────────────────────────────────────────────────────────

if LLM_PROVIDER in ("openai", "groq"):
    from vanna.openai import OpenAI_Chat

    class _LegacyBase:
        """Vanna 내장 submit_prompt를 그대로 사용하는 레거시 클래스"""
        def generate_sql(self, question: str, **kwargs) -> str:
            try:
                similar = self.get_similar_question_sql(question)
            except Exception:
                similar = []
            messages = [{"role": "system", "content": _FALLBACK_SYSTEM}]
            for item in (similar or []):
                if isinstance(item, dict) and "question" in item and "sql" in item:
                    messages.append({"role": "user",      "content": item["question"]})
                    messages.append({"role": "assistant", "content": item["sql"]})
            messages.append({"role": "user", "content": question})
            return _clean_sql(self.submit_prompt(messages, **kwargs))

    class OpenAIVanna(_LegacyBase, ChromaDB_VectorStore, OpenAI_Chat):
        def __init__(self):
            ChromaDB_VectorStore.__init__(self, config={"path": CHROMA_PATH, "n_results": 3})
            cfg = {
                "api_key": os.getenv("OPENAI_API_KEY") if LLM_PROVIDER == "openai"
                           else os.getenv("GROQ_API_KEY"),
                "model":   os.getenv("OPENAI_MODEL", "gpt-4o-mini") if LLM_PROVIDER == "openai"
                           else os.getenv("GROQ_MODEL", GROQ_MODEL_SQL),
            }
            if LLM_PROVIDER == "groq":
                cfg["base_url"] = "https://api.groq.com/openai/v1"
            OpenAI_Chat.__init__(self, config=cfg)

elif LLM_PROVIDER == "ollama":
    from vanna.ollama import Ollama

    class _LegacyBase:
        def generate_sql(self, question: str, **kwargs) -> str:
            try:
                similar = self.get_similar_question_sql(question)
            except Exception:
                similar = []
            messages = [{"role": "system", "content": _FALLBACK_SYSTEM}]
            for item in (similar or []):
                if isinstance(item, dict) and "question" in item and "sql" in item:
                    messages.append({"role": "user",      "content": item["question"]})
                    messages.append({"role": "assistant", "content": item["sql"]})
            messages.append({"role": "user", "content": question})
            return _clean_sql(self.submit_prompt(messages, **kwargs))

    class OllamaVanna(_LegacyBase, ChromaDB_VectorStore, Ollama):
        def __init__(self):
            ChromaDB_VectorStore.__init__(self, config={"path": CHROMA_PATH, "n_results": 3})
            Ollama.__init__(self, config={"model": FALLBACK_OLLAMA_MODEL})


# ════════════════════════════════════════════════════════════════
#  팩토리: 환경변수에 따라 런타임에 백엔드 결정
# ════════════════════════════════════════════════════════════════

def _build_primary() -> _VannaBase:
    if LLM_PROVIDER == "sqlcoder":
        if SQLCODER_MODE == "groq":
            print(f"[vanna] Primary: SQLCoder-Groq  ({GROQ_MODEL_SQL} → fallback {GROQ_MODEL_FB})")
            return GroqSQLVanna()
        else:
            print(f"[vanna] Primary: SQLCoder-Ollama  ({SQLCODER_MODEL})")
            return SQLCoderOllamaVanna()
    elif LLM_PROVIDER in ("openai", "groq"):
        print(f"[vanna] Primary: {LLM_PROVIDER} (legacy Vanna)")
        inst = OpenAIVanna()
        if LLM_PROVIDER == "groq":
            from openai import OpenAI as _OAI
            inst.client = _OAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
        return inst
    else:
        print(f"[vanna] Primary: Ollama generic  ({FALLBACK_OLLAMA_MODEL})")
        return OllamaVanna()


def _build_fallback():
    """Primary 실패 시 사용하는 2차 백엔드"""
    if LLM_PROVIDER == "sqlcoder":
        if SQLCODER_MODE == "groq":
            # 프로덕션: Groq 이미 내부 secondary 내장 → 추가 fallback 없음
            print("[vanna] Fallback: None (Groq 내부 모델 전환으로 충분)")
            return None
        else:
            # 로컬: Ollama 범용 모델로 fallback
            print(f"[vanna] Fallback: Ollama generic  ({FALLBACK_OLLAMA_MODEL})")
            return FallbackOllamaVanna()
    return None


# ── 전역 인스턴스 ────────────────────────────────────────────────

vn = _build_primary()
_fallback_vn = None

try:
    _fallback_vn = _build_fallback()
except Exception as e:
    print(f"[vanna] Fallback 초기화 실패 (무시): {e}")


def get_fallback_vn():
    return _fallback_vn


# ── SQLite 실행 함수 연결 ────────────────────────────────────────

vn.run_sql        = _run_sql
vn.run_sql_is_set = True

if _fallback_vn is not None:
    _fallback_vn.run_sql        = _run_sql
    _fallback_vn.run_sql_is_set = True
