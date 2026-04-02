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
DB_PATH        = os.getenv("DB_PATH", "./db/insightbi.db")
DATABASE_URL   = os.getenv("DATABASE_URL", "")         # PostgreSQL (Railway 등 프로덕션)

# SQLCoder via Ollama
SQLCODER_MODEL  = os.getenv("SQLCODER_MODEL", "sqlcoder:7b")  # ollama: sqlcoder:7b / sqlcoder:15b
OLLAMA_HOST     = os.getenv("OLLAMA_HOST", "http://localhost:11434")

# Groq (프로덕션 Primary + 범용 Fallback)
GROQ_API_KEY   = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL_SQL = os.getenv("GROQ_MODEL_SQL", "llama-3.3-70b-versatile")  # SQL 생성 메인
GROQ_MODEL_FB  = os.getenv("GROQ_MODEL_FB",  "llama-3.1-8b-instant")     # SQL 생성 폴백

# Gemini (인터넷 환경)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL   = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

# Claude (인터넷 환경)
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY", "")
CLAUDE_MODEL   = os.getenv("CLAUDE_MODEL", "claude-haiku-4-5-20251001")

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
CREATE TABLE td_irncr(std_date CHAR(8),org_code VARCHAR(6),con_sep_clcd VARCHAR(1),ncr_stress_no NUMERIC,port_no NUMERIC,obj_dtl_cd VARCHAR(100),item_lclas_cd VARCHAR(2),item_lclas_nm VARCHAR(100),item_mclas_cd VARCHAR(2),item_mclas_nm VARCHAR(100),item_sclas_cd VARCHAR(2),item_sclas_nm VARCHAR(100),item_dtl_cd VARCHAR(2),item_dtl_nm VARCHAR(100),prod_val NUMERIC);
CREATE TABLE td_irpos(std_date CHAR(8),org_code VARCHAR(6),con_sep_clcd VARCHAR(1),bo_item_code VARCHAR(100),biz_area_cd VARCHAR(4),biz_area_nm VARCHAR(100),item_code VARCHAR(100),item_name VARCHAR(200),fund_code VARCHAR(80),fund_name VARCHAR(100),cpty_code VARCHAR(50),cpty_name VARCHAR(500),market_amt NUMERIC,book_amt NUMERIC,notional_amt NUMERIC,eval_pl_amt NUMERIC,posi_amt NUMERIC,delta_posi_amt NUMERIC,gamma_posi_amt NUMERIC,vega_posi_amt NUMERIC,ir_risk_yn VARCHAR(1),fx_risk_yn VARCHAR(1),st_risk_yn VARCHAR(1),ncr_st_gbn VARCHAR(2),ncr_st_gbn_nm VARCHAR(100),ncr_bond_gbn VARCHAR(1),ncr_bond_gbn_nm VARCHAR(100),proc_risk_type VARCHAR(100));
CREATE TABLE td_irriskcr(std_date CHAR(8),org_code VARCHAR(6),con_sep_clcd VARCHAR(1),port_no NUMERIC,ncr_stress_no NUMERIC,bo_item_code VARCHAR(100),cpty_code VARCHAR(50),cpty_name VARCHAR(500),ncr_grad_cd VARCHAR(10),ncr_grad_cd_nm VARCHAR(10),crdt_chng_amt NUMERIC,crdt_risk_val NUMERIC,crdt_risk_amt NUMERIC,crdt_mtgt_amt NUMERIC,crdt_mtgt_risk_amt NUMERIC,ccf_grp VARCHAR(10),ccf_grp_nm VARCHAR(100),ccf_rate NUMERIC,coll_allo_amt NUMERIC,grnt_amt NUMERIC);
CREATE TABLE td_irriskmr(std_date CHAR(8),org_code VARCHAR(6),con_sep_clcd VARCHAR(1),port_no NUMERIC,ncr_stress_no NUMERIC,bo_item_code VARCHAR(100),item_code VARCHAR(100),item_name VARCHAR(200),cpty_code VARCHAR(50),cpty_name VARCHAR(500),ncr_grad_cd VARCHAR(10),ncr_grad_cd_nm VARCHAR(10),posi_amt NUMERIC,std_amt NUMERIC,st_specific_risk_val NUMERIC,st_specific_risk_amt NUMERIC,st_gen_risk_val NUMERIC,st_gen_risk_amt NUMERIC,ir_specific_risk_val NUMERIC,ir_specific_risk_amt NUMERIC,ir_gen_risk_val NUMERIC,ir_gen_risk_amt NUMERIC,fx_curr_risk_val NUMERIC,fx_curr_risk_amt NUMERIC,fx_gold_risk_amt NUMERIC,opt_gamma_risk_amt NUMERIC,opt_vega_risk_amt NUMERIC,ncr_ir_grp_gbn VARCHAR(1),ncr_ir_grp_nm VARCHAR(100),proc_risk_type VARCHAR(100));"""

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

# 범용 fallback 시스템 프롬프트 — 소형 모델(1~3B) 친화적 간결 버전
_FALLBACK_SYSTEM = f"""\
You are a {_DB_DIALECT} SQL assistant.
CRITICAL RULES:
1. Output ONLY a single SELECT statement — nothing else.
2. Do NOT output CREATE, DROP, INSERT, UPDATE, or any DDL.
3. Do NOT add explanations or markdown.

Available tables (columns):
npl_trend(month,npl,substandard,doubtful,loss)
credit_grades(grade,amount,count,pct)
sector_exposure(sector,amount,pct,pd)
concentration(name,x,y,z)
npl_summary(total_loan,npl_amount,npl_ratio,substandard,doubtful,loss,provision_amount,provision_ratio,net_npl)
pd_lgd_ead(pd,lgd,ead,expected_loss,unexpected_loss,rwa)
var_trend(date,var,pnl,var_limit)
stress_scenarios(name,credit_loss,market_loss,liquidity_loss,total,bis_after)
sensitivity(factor,value,full_mark)
var_summary(current,limit_val,utilization,avg_last20,max_last20,breach_count30d,delta,gamma,vega,rho)
lcr_nsfr_trend(month,lcr,nsfr,hqla,outflow)
maturity_gap(bucket,assets,liabilities,gap)
liquidity_buffer(date,available,required,stress)
funding_structure(source,amount,pct,stability)
lcr_gauge(lcr,nsfr,hqla,net_outflow,level1,level2a,level2b,lcr_threshold,nsfr_threshold)
td_irncr(std_date,org_code,con_sep_clcd,ncr_stress_no,port_no,obj_dtl_cd,item_lclas_cd,item_lclas_nm,item_mclas_cd,item_mclas_nm,item_sclas_cd,item_sclas_nm,item_dtl_cd,item_dtl_nm,prod_val)
td_irpos(std_date,org_code,con_sep_clcd,bo_item_code,biz_area_cd,biz_area_nm,item_code,item_name,fund_code,fund_name,cpty_code,cpty_name,market_amt,book_amt,notional_amt,eval_pl_amt,posi_amt,delta_posi_amt,gamma_posi_amt,vega_posi_amt,ir_risk_yn,fx_risk_yn,st_risk_yn,ncr_st_gbn,ncr_st_gbn_nm,ncr_bond_gbn,ncr_bond_gbn_nm,proc_risk_type)
td_irriskcr(std_date,org_code,con_sep_clcd,port_no,ncr_stress_no,bo_item_code,cpty_code,cpty_name,ncr_grad_cd,ncr_grad_cd_nm,crdt_chng_amt,crdt_risk_val,crdt_risk_amt,crdt_mtgt_amt,crdt_mtgt_risk_amt,ccf_grp,ccf_grp_nm,ccf_rate,coll_allo_amt,grnt_amt)
td_irriskmr(std_date,org_code,con_sep_clcd,port_no,ncr_stress_no,bo_item_code,item_code,item_name,cpty_code,cpty_name,ncr_grad_cd,ncr_grad_cd_nm,posi_amt,std_amt,st_specific_risk_val,st_specific_risk_amt,st_gen_risk_val,st_gen_risk_amt,ir_specific_risk_val,ir_specific_risk_amt,ir_gen_risk_val,ir_gen_risk_amt,fx_curr_risk_val,fx_curr_risk_amt,fx_gold_risk_amt,opt_gamma_risk_amt,opt_vega_risk_amt,ncr_ir_grp_gbn,ncr_ir_grp_nm,proc_risk_type)

SQL hints:
- Trend queries: ORDER BY month/date ASC
- Top-N: ORDER BY col DESC LIMIT N
- Latest value: ORDER BY col DESC LIMIT 1
- Scalar tables (npl_summary,pd_lgd_ead,var_summary,lcr_gauge): 1 row only
- NCR queries: use td_irncr(prod_val), td_irriskcr(crdt_risk_amt), td_irriskmr(risk amt cols)
- amount unit: 억원"""


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

# SQLAlchemy 엔진은 모듈 레벨에서 한 번만 생성 (연결 풀 재사용)
_pg_engine = None
if DATABASE_URL:
    from sqlalchemy import create_engine
    _pg_engine = create_engine(
        DATABASE_URL,
        pool_size=3,           # 기본 연결 풀 크기 (Railway 무료 티어 고려)
        max_overflow=2,        # 추가 허용 연결 수
        pool_pre_ping=True,    # 쿼리 전 연결 유효성 검사 (끊긴 연결 자동 재연결)
        pool_recycle=300,      # 5분마다 연결 재활용 (Railway idle connection 차단 대응)
        connect_args={"connect_timeout": 10},  # 연결 타임아웃 10초
    )


def _run_sql(sql: str) -> pd.DataFrame:
    if _pg_engine is not None:
        from sqlalchemy import text
        last_err = None
        for attempt in range(3):  # 최대 3회 재시도
            try:
                with _pg_engine.connect() as conn:
                    return pd.read_sql(text(sql), conn)
            except Exception as e:
                last_err = e
                print(f"[db] SQL 실행 실패 (시도 {attempt + 1}/3): {e}")
                if attempt < 2:
                    import time
                    time.sleep(1)
        raise last_err
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


# ════════════════════════════════════════════════════════════════
#  멀티 프로바이더: Gemini / Claude (인터넷 환경)
# ════════════════════════════════════════════════════════════════

class GeminiSQLVanna(_VannaBase, ChromaDB_VectorStore):
    """Google Gemini — 저비용 고속 Text-to-SQL (1M 컨텍스트)"""

    def __init__(self):
        ChromaDB_VectorStore.__init__(self, config={"path": CHROMA_PATH, "n_results": 3})
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        self._genai = genai

    def system_message(self, message: str) -> dict:
        return {"role": "system", "content": message}

    def user_message(self, message: str) -> dict:
        return {"role": "user", "content": message}

    def assistant_message(self, message: str) -> dict:
        return {"role": "assistant", "content": message}

    def submit_prompt(self, prompt, **kwargs) -> str:
        raise NotImplementedError

    def generate_sql(self, question: str, **kwargs) -> str:
        try:
            similar = self.get_similar_question_sql(question)
        except Exception:
            similar = []

        messages = _build_sqlcoder_messages(question, similar)
        system_content = next((m["content"] for m in messages if m["role"] == "system"), "")
        contents = [
            {"role": "model" if m["role"] == "assistant" else "user", "parts": [m["content"]]}
            for m in messages if m["role"] != "system"
        ]

        model = self._genai.GenerativeModel(
            GEMINI_MODEL,
            system_instruction=system_content,
        )
        resp = model.generate_content(
            contents,
            generation_config=self._genai.GenerationConfig(
                temperature=0.0,
                max_output_tokens=300,
            ),
        )
        return _clean_sql(resp.text)

    def generate_embedding(self, data: str, **kwargs):
        return ChromaDB_VectorStore.generate_embedding(self, data, **kwargs)


class ClaudeSQLVanna(_VannaBase, ChromaDB_VectorStore):
    """Anthropic Claude — 200K 컨텍스트 고정확도 Text-to-SQL"""

    def __init__(self):
        ChromaDB_VectorStore.__init__(self, config={"path": CHROMA_PATH, "n_results": 3})
        import anthropic
        self._client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)

    def system_message(self, message: str) -> dict:
        return {"role": "system", "content": message}

    def user_message(self, message: str) -> dict:
        return {"role": "user", "content": message}

    def assistant_message(self, message: str) -> dict:
        return {"role": "assistant", "content": message}

    def submit_prompt(self, prompt, **kwargs) -> str:
        raise NotImplementedError

    def generate_sql(self, question: str, **kwargs) -> str:
        try:
            similar = self.get_similar_question_sql(question)
        except Exception:
            similar = []

        messages = _build_sqlcoder_messages(question, similar)
        system_content = next((m["content"] for m in messages if m["role"] == "system"), "")
        chat_messages = [m for m in messages if m["role"] != "system"]

        resp = self._client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=300,
            system=system_content,
            messages=chat_messages,
        )
        return _clean_sql(resp.content[0].text)

    def generate_embedding(self, data: str, **kwargs):
        return ChromaDB_VectorStore.generate_embedding(self, data, **kwargs)


# ── 멀티 프로바이더 레지스트리 ──────────────────────────────────────

_provider_registry: dict[str, _VannaBase] = {}

_PROVIDER_META = {
    "groq":   {"name": "Groq",   "model": GROQ_MODEL_SQL, "color": "orange"},
    "gemini": {"name": "Gemini", "model": GEMINI_MODEL,   "color": "blue"},
    "claude": {"name": "Claude", "model": CLAUDE_MODEL,   "color": "purple"},
}


def _init_providers():
    if GROQ_API_KEY:
        try:
            inst = GroqSQLVanna()
            inst.run_sql = _run_sql
            inst.run_sql_is_set = True
            _provider_registry["groq"] = inst
            print(f"[provider] Groq 초기화 완료 ({GROQ_MODEL_SQL})")
        except Exception as e:
            print(f"[provider] Groq 초기화 실패: {e}")

    if GEMINI_API_KEY:
        try:
            inst = GeminiSQLVanna()
            inst.run_sql = _run_sql
            inst.run_sql_is_set = True
            _provider_registry["gemini"] = inst
            print(f"[provider] Gemini 초기화 완료 ({GEMINI_MODEL})")
        except Exception as e:
            print(f"[provider] Gemini 초기화 실패: {e}")

    if CLAUDE_API_KEY:
        try:
            inst = ClaudeSQLVanna()
            inst.run_sql = _run_sql
            inst.run_sql_is_set = True
            _provider_registry["claude"] = inst
            print(f"[provider] Claude 초기화 완료 ({CLAUDE_MODEL})")
        except Exception as e:
            print(f"[provider] Claude 초기화 실패: {e}")


_init_providers()


def get_provider_vanna(provider: str) -> _VannaBase:
    """지정 프로바이더 Vanna 인스턴스 반환. 없으면 기본 vn."""
    return _provider_registry.get(provider, vn)


def available_providers() -> list[dict]:
    """프론트엔드에 노출할 프로바이더 목록 (가용 여부 포함)"""
    result = []
    for key in ["groq", "gemini", "claude"]:
        meta = _PROVIDER_META[key]
        result.append({
            "id": key,
            "name": meta["name"],
            "model": meta["model"],
            "color": meta["color"],
            "available": key in _provider_registry,
        })
    return result
