import os
from dotenv import load_dotenv
from vanna.ollama import Ollama
from vanna.chromadb import ChromaDB_VectorStore

load_dotenv()

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama")  # ollama | openai | groq
CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma_db")
DB_PATH = os.getenv("DB_PATH", "./db/insidebi.db")

# ── 고정 시스템 프롬프트 ───────────────────────────────────────
# 매 요청 동일한 prefix → LLM KV 캐시 활성화 (Ollama)
# 한국어 주석 제거 + 컴팩트 DDL → 토큰 수 대폭 감소
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

# 이 문자열은 불변(클래스 변수) → LLM이 동일 prefix로 KV 캐시 재사용 (Ollama)
_FIXED_SYSTEM_PROMPT = f"""\
You are a SQLite expert. Output only valid SQLite SQL, no explanation.
Tables:
{_COMPACT_DDL}
Rules:
- ORDER BY month/date for trends
- LIMIT N for TOP-N queries
- ORDER BY col DESC LIMIT 1 for latest value
- Scalar tables (npl_summary, pd_lgd_ead, var_summary, lcr_gauge) have exactly 1 row
- amount unit: 억원 (KRW 100M)"""


def _clean_sql(raw: str) -> str:
    """LLM 출력에서 마크다운 코드블록 제거"""
    s = raw.strip()
    if "```" in s:
        for part in s.split("```"):
            part = part.strip().lstrip("sql").strip()
            if part.upper().startswith("SELECT"):
                return part
    return s


class _VannaBase:
    """submit_prompt()를 제공하는 백엔드에 공통 SQL 생성 로직 주입"""
    _FIXED_SYS = _FIXED_SYSTEM_PROMPT

    def generate_sql(self, question: str, **kwargs) -> str:
        """
        고정 시스템 프롬프트 + 상위 3개 few-shot 예시 → LLM KV 캐시 활용 (Ollama)
        토큰: ~3060 → ~670 (78% 감소)
        """
        # ChromaDB에서 유사 Q-SQL 상위 3개 조회
        try:
            similar = self.get_similar_question_sql(question)
        except Exception:
            similar = []

        # 고정 시스템 프롬프트 (KV 캐시 대상)
        messages = [{"role": "system", "content": self._FIXED_SYS}]

        # few-shot 예시 (가변 부분 - KV 캐시 이후 연산)
        for item in (similar or []):
            if isinstance(item, dict) and "question" in item and "sql" in item:
                messages.append({"role": "user", "content": item["question"]})
                messages.append({"role": "assistant", "content": item["sql"]})

        # 실제 질문
        messages.append({"role": "user", "content": question})

        raw = self.submit_prompt(messages, **kwargs)
        return _clean_sql(raw)


class OllamaVanna(_VannaBase, ChromaDB_VectorStore, Ollama):
    def __init__(self):
        ChromaDB_VectorStore.__init__(self, config={"path": CHROMA_PATH, "n_results": 3})
        Ollama.__init__(self, config={"model": os.getenv("OLLAMA_MODEL", "llama3.1:8b")})


# OpenAI / Groq 는 같은 클라이언트(openai 패키지), base_url만 다름
if LLM_PROVIDER in ("openai", "groq"):
    from vanna.openai import OpenAI_Chat

    class OpenAIVanna(_VannaBase, ChromaDB_VectorStore, OpenAI_Chat):
        def __init__(self):
            ChromaDB_VectorStore.__init__(self, config={"path": CHROMA_PATH, "n_results": 3})
            cfg = {
                "api_key": os.getenv("OPENAI_API_KEY") if LLM_PROVIDER == "openai"
                           else os.getenv("GROQ_API_KEY"),
                "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini") if LLM_PROVIDER == "openai"
                         else os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
            }
            if LLM_PROVIDER == "groq":
                cfg["base_url"] = "https://api.groq.com/openai/v1"
            OpenAI_Chat.__init__(self, config=cfg)


# 모델명 (health endpoint용)
MODEL_NAME = {
    "openai": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
    "groq":   os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
}.get(LLM_PROVIDER, os.getenv("OLLAMA_MODEL", "llama3.1:8b"))

# 팩토리
vn = OpenAIVanna() if LLM_PROVIDER in ("openai", "groq") else OllamaVanna()
vn.connect_to_sqlite(DB_PATH)
