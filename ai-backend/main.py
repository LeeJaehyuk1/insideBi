"""
main.py – FastAPI AI 분석 서버
실행: uvicorn main:app --reload --port 8000

[SQLCoder 이중 파이프라인]
  1) 캐시(Golden SQL + _sql_cache) 조회
  2) Primary LLM (SQLCoder via Ollama 또는 Defog API)
  3) 실패 시 Fallback LLM (Groq 또는 Ollama 범용)
  4) 최종 실패 시 503 에러 반환
"""
import json
import os
import uuid
from datetime import datetime
from difflib import SequenceMatcher
from typing import Optional

import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

# Vanna / SQLCoder 초기화
import requests as _requests

from vanna_setup import (
    vn,
    get_fallback_vn,
    get_provider_vanna,
    available_providers,
    MODEL_NAME,
    LLM_PROVIDER,
    SQLCODER_MODE,
    DB_PATH as VANNA_DB_PATH,
    DATABASE_URL,
    GROQ_API_KEY,
    GROQ_MODEL_FB,
    OLLAMA_HOST,
    FALLBACK_OLLAMA_MODEL,
)

app = FastAPI(title="InsightBi AI API", version="2.0.0")

_extra_origins = [o.strip() for o in os.getenv("FRONTEND_URL", "").split(",") if o.strip()]
_allowed_origins = ["http://localhost:3000"] + _extra_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 피드백 파일 ──────────────────────────────────────────────────
FEEDBACK_FILE = os.path.join(os.path.dirname(__file__), "feedback.json")

# ── SQL 보안 가드레일 ─────────────────────────────────────────────
FORBIDDEN_KEYWORDS = [
    "DELETE", "DROP", "UPDATE", "INSERT", "CREATE",
    "ALTER", "TRUNCATE", "REPLACE", "ATTACH", "DETACH",
]

# ── 학습된 테이블 목록 (관련성 검사용) ───────────────────────────
KNOWN_TABLES = {
    "td_irncr", "td_irpos", "td_irriskcr", "td_irriskmr",
    "td_dmaqfx", "td_dmaqindex", "td_dmaqvol",
    "npl_trend", "npl_summary", "credit_grades", "sector_exposure",
    "concentration", "pd_lgd_ead", "var_trend", "var_summary",
    "stress_scenarios", "sensitivity", "lcr_nsfr_trend", "lcr_gauge",
    "maturity_gap", "liquidity_buffer", "funding_structure",
}

def is_relevant_sql(sql: str) -> bool:
    """생성된 SQL이 학습된 테이블을 참조하는지 확인"""
    sql_lower = sql.lower()
    return any(table in sql_lower for table in KNOWN_TABLES)


# ChromaDB 유사도 임계값 (낮을수록 유사 / 1.2 초과 = 관련 없음)
RELEVANCE_DISTANCE_THRESHOLD = float(os.getenv("RELEVANCE_THRESHOLD", "1.2"))

def is_question_relevant(question: str) -> bool:
    """ChromaDB에서 질문과 학습 데이터 간 유사도를 확인해 관련성 판단"""
    try:
        collection = vn.sql_collection
        results = collection.query(
            query_texts=[question],
            n_results=1,
            include=["distances"],
        )
        distances = results.get("distances", [[]])[0]
        if not distances:
            return False
        min_distance = min(distances)
        print(f"[relevance] distance={min_distance:.4f} threshold={RELEVANCE_DISTANCE_THRESHOLD}")
        return min_distance <= RELEVANCE_DISTANCE_THRESHOLD
    except Exception as e:
        print(f"[relevance] 유사도 확인 실패, 통과 처리: {e}")
        return True  # 오류 시 통과 (안전 방향)

SUGGESTIONS = [
    "지난 12개월 NPL 비율 추이",
    "업종별 익스포저 TOP 5",
    "스트레스 시나리오별 총 손실 비교",
    "현재 LCR과 NSFR 수치",
    "VaR가 1300억원을 초과한 날",
    "신용등급별 익스포저 비율",
    "만기갭 분석 자산 부채 차이",
    "조달 구조 비중",
]

# ── SQL 캐시 ──────────────────────────────────────────────────────
_sql_cache: dict[str, str] = {}
CACHE_THRESHOLD = 0.92  # 거의 동일한 질문만 캐시 사용 (LLM SQL 생성 우선)


def _load_golden_sql():
    base = os.path.dirname(__file__)
    # GOLDEN_SQL_FILE 환경변수로 명시 가능 (Railway: golden_sql_railway.json)
    filename = os.getenv("GOLDEN_SQL_FILE", "golden_sql.json")
    path = os.path.join(base, "training", filename)
    if not os.path.exists(path):
        path = os.path.join(base, "training/golden_sql.json")
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8") as f:
        pairs = json.load(f)
    for pair in pairs:
        _sql_cache[pair["question"]] = pair["sql"]
    print(f"[cache] Golden SQL {len(pairs)}개 로드 완료 ({os.path.basename(path)})")


_load_golden_sql()


# ── 관리자 인증 ───────────────────────────────────────────────────
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin1234").strip()


def require_admin(x_admin_password: str = Header(...)):
    if x_admin_password.strip() != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="관리자 비밀번호가 올바르지 않습니다.")


# ── 모델 정의 ─────────────────────────────────────────────────────

class AskRequest(BaseModel):
    question: str
    provider: Optional[str] = None  # "groq" | "gemini" | "claude" | None(기본)


class FeedbackRequest(BaseModel):
    message_id: str
    rating: str  # "up" | "down"
    question: Optional[str] = None
    sql: Optional[str] = None


class TrainSQLRequest(BaseModel):
    question: str
    sql: str


class TrainSQLBulkRequest(BaseModel):
    pairs: list[dict]          # [{question, sql}, ...]
    overwrite: bool = False    # True면 golden_sql.json 전체 교체, False면 append/upsert


class TrainDocRequest(BaseModel):
    documentation: str


class DeleteTrainingRequest(BaseModel):
    id: str


class FeedbackApproveRequest(BaseModel):
    message_id: str
    question: str
    sql: str


class FeedbackDeleteRequest(BaseModel):
    message_id: str


# ── 유틸 함수 ─────────────────────────────────────────────────────

def find_cached_sql(question: str) -> tuple[str | None, float]:
    best_q: str | None = None
    best_score = 0.0
    q = question.strip()
    for cached_q in _sql_cache:
        score = SequenceMatcher(None, q, cached_q).ratio()
        if score > best_score:
            best_score = score
            best_q = cached_q
    if best_q and best_score >= CACHE_THRESHOLD:
        return _sql_cache[best_q], best_score
    return None, 0.0


def validate_sql(sql: str) -> bool:
    upper = sql.upper()
    return not any(kw in upper for kw in FORBIDDEN_KEYWORDS)


def infer_chart_type(df: pd.DataFrame) -> str:
    cols = [c.lower() for c in df.columns]
    date_cols = [c for c in cols if any(k in c for k in ["date", "month", "year", "날짜", "월", "기간"])]
    numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    # "rate"는 환율(fx_rate 등) 오탐 방지를 위해 제외, "pct"/"ratio"/"비율"만 파이 조건으로 사용
    pct_cols = [c for c in cols if "pct" in c or "ratio" in c or "비율" in c]

    if date_cols:
        return "area" if len(numeric_cols) >= 2 else "line"
    if pct_cols and len(df.columns) <= 3 and 2 <= len(df) <= 12:
        return "pie"
    return "bar"


def generate_summary(question: str, df: pd.DataFrame, sql: str) -> str:
    rows = len(df)
    cols = list(df.columns)
    if rows == 1:
        parts = [f"{col}: {df.iloc[0][col]}" for col in cols]
        return "현재 수치: " + ", ".join(parts)
    return f"총 {rows}개 데이터를 조회했습니다. ({', '.join(cols[:3])} 등)"


# ── SQLCoder 이중 파이프라인 핵심 함수 ───────────────────────────

async def ask_with_retry(question: str, provider: Optional[str] = None, max_attempts: int = 2):
    """
    [파이프라인]
    1) SQL 캐시 조회          → 히트 시 LLM 생략
    2) 지정 프로바이더 LLM    → groq | gemini | claude | 기본(vn)
    3) 실패 시 Fallback LLM  → 프로바이더 미지정 시에만 적용
    4) 모두 실패              → 503 에러
    """
    # 프로바이더 인스턴스 결정
    primary_vn = get_provider_vanna(provider) if provider else vn

    # ── Step 0: 관련성 사전 검사 ─────────────────────────────
    # Chroma distance 선필터가 정상적인 한국어 질문도 과하게 차단하고 있어
    # 여기서는 텔레메트리만 남기고, 실제 안전성은 아래 SQL 검증으로 처리한다.
    if not is_question_relevant(question):
        print(f"[relevance] soft-fail bypassed for question: {question[:80]}")

    # ── Step 1: 캐시 조회 ─────────────────────────────────────
    cached_sql, score = find_cached_sql(question)
    if cached_sql:
        print(f"[cache HIT] score={score:.2f}  provider={provider or 'default'}  sql={cached_sql[:60]}")
        try:
            df = primary_vn.run_sql(cached_sql)
            return cached_sql, df, True, "cache"
        except Exception as e:
            print(f"[cache] 캐시 SQL 실행 실패, LLM으로 폴백: {e}")

    # ── Step 2: 지정 프로바이더 LLM ──────────────────────────
    last_error: str = ""
    context = question

    for attempt in range(max_attempts):
        try:
            sql = primary_vn.generate_sql(context)
            if not sql or not sql.upper().strip().startswith("SELECT"):
                raise ValueError(f"유효하지 않은 SQL 형식: {sql[:80]}")
            if not validate_sql(sql):
                raise HTTPException(
                    status_code=400,
                    detail="보안 위반 쿼리가 감지되었습니다. 데이터 조회 질문만 가능합니다."
                )
            if not is_relevant_sql(sql):
                raise HTTPException(
                    status_code=400,
                    detail="학습된 데이터와 관련 없는 질문입니다. 등록된 테이블 데이터에 대해 질문해 주세요."
                )
            df = primary_vn.run_sql(sql)
            _sql_cache[question.strip()] = sql
            backend = provider or (f"sqlcoder-{SQLCODER_MODE}" if LLM_PROVIDER == "sqlcoder" else LLM_PROVIDER)
            print(f"[{backend}] 성공 (attempt={attempt+1})  sql={sql[:60]}")
            return sql, df, False, backend
        except HTTPException:
            raise
        except Exception as e:
            last_error = str(e)
            print(f"[{provider or 'primary'}] attempt={attempt+1} 실패: {last_error[:120]}")
            context = f"{question}\n[이전 시도 오류, 다시 시도: {last_error[:80]}]"

    # ── Step 3: Fallback LLM (프로바이더 미지정 시에만) ───────
    if not provider:
        fallback_vn = get_fallback_vn()
        if fallback_vn is not None:
            print("[fallback] Primary 실패 → Fallback LLM 시도")
            for attempt in range(2):
                try:
                    sql = fallback_vn.generate_sql(context)
                    if not sql or not sql.upper().strip().startswith("SELECT"):
                        raise ValueError(f"Fallback SQL 형식 오류: {sql[:80]}")
                    if not validate_sql(sql):
                        raise HTTPException(
                            status_code=400,
                            detail="보안 위반 쿼리가 감지되었습니다."
                        )
                    if not is_relevant_sql(sql):
                        raise HTTPException(
                            status_code=400,
                            detail="학습된 데이터와 관련 없는 질문입니다. 등록된 테이블 데이터에 대해 질문해 주세요."
                        )
                    df = fallback_vn.run_sql(sql)
                    _sql_cache[question.strip()] = sql
                    print(f"[fallback] 성공 (attempt={attempt+1})  sql={sql[:60]}")
                    return sql, df, False, "fallback"
                except HTTPException:
                    raise
                except Exception as e:
                    last_error = str(e)
                    print(f"[fallback] attempt={attempt+1} 실패: {last_error[:120]}")

    raise HTTPException(
        status_code=503,
        detail=f"SQL 생성에 실패했습니다: {last_error}"
    )


# ── 이벤트 핸들러 ─────────────────────────────────────────────────

@app.on_event("startup")
async def _startup():
    """DB가 없으면 자동 마이그레이션"""
    import sys
    import subprocess

    needs_migration = False

    if DATABASE_URL:
        # PostgreSQL: npl_trend 테이블 존재 여부로 판단
        try:
            import psycopg2
            conn = psycopg2.connect(DATABASE_URL)
            cur = conn.cursor()
            cur.execute(
                "SELECT COUNT(*) FROM information_schema.tables "
                "WHERE table_schema='public' AND table_name='npl_trend'"
            )
            needs_migration = cur.fetchone()[0] == 0
            conn.close()
        except Exception as e:
            print(f"[startup] PostgreSQL 연결 실패: {e}")
    else:
        # SQLite: 파일 존재 여부로 판단
        needs_migration = not os.path.exists(VANNA_DB_PATH)

    if needs_migration:
        print("[startup] DB not found — running migration...")
        result = subprocess.run(
            [sys.executable, os.path.join(os.path.dirname(__file__), "db", "migrate.py")],
            capture_output=True, text=True,
        )
        print("[startup] Migration complete" if result.returncode == 0
              else f"[startup] Migration failed:\n{result.stderr}")

    # ChromaDB가 비어있으면 자동 학습
    try:
        df = vn.get_training_data()
        chroma_empty = df is None or len(df) == 0
    except Exception:
        chroma_empty = True

    if chroma_empty:
        print("[startup] ChromaDB 비어있음 — 자동 학습 시작...")
        for script in ["train.py", "train_ncr.py"]:
            script_path = os.path.join(os.path.dirname(__file__), script)
            if not os.path.exists(script_path):
                continue
            result = subprocess.run(
                [sys.executable, script_path],
                capture_output=True, text=True,
            )
            if result.returncode == 0:
                print(f"[startup] {script} 학습 완료")
            else:
                print(f"[startup] {script} 학습 실패:\n{result.stderr[:500]}")
    else:
        print(f"[startup] ChromaDB 학습 데이터 {len(df)}개 확인됨 (학습 스킵)")

    # ChromaDB에서 구형 NCR 테이블(ncr_summary, ncr_trend, risk_composition) 학습 데이터 자동 정리
    _OBSOLETE_TABLES = ["ncr_summary", "ncr_trend", "risk_composition"]
    try:
        df = vn.get_training_data()
        if df is not None and len(df) > 0:
            pattern = "|".join(_OBSOLETE_TABLES)
            old = df[df["content"].str.contains(pattern, case=False, na=False)]
            if len(old) > 0:
                for id_ in old["id"].tolist():
                    try:
                        vn.remove_training_data(id=id_)
                    except Exception:
                        pass
                print(f"[startup] ChromaDB 구형 NCR 항목 {len(old)}개 제거 완료")
            else:
                print("[startup] ChromaDB 구형 NCR 항목 없음 (정리 불필요)")
    except Exception as e:
        print(f"[startup] ChromaDB 정리 실패(무시): {e}")


# ── 대시보드 I/O ──────────────────────────────────────────────────

CHAT_HISTORY_FILE = os.path.join(os.path.dirname(__file__), "chat_history.json")
REPORTS_FILE = os.path.join(os.path.dirname(__file__), "reports_user.json")
DASHBOARDS_FILE = os.path.join(os.path.dirname(__file__), "dashboards.json")
MY_DASHBOARD_FILE = os.path.join(os.path.dirname(__file__), "my_dashboard.json")


def _read_dashboards() -> list:
    if not os.path.exists(DASHBOARDS_FILE):
        return []
    with open(DASHBOARDS_FILE, encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []


def _write_dashboards(records: list):
    with open(DASHBOARDS_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)


# ── 피드백 I/O ────────────────────────────────────────────────────

def _read_feedback() -> list:
    if not os.path.exists(FEEDBACK_FILE):
        return []
    with open(FEEDBACK_FILE, encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []


def _write_feedback(records: list):
    with open(FEEDBACK_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)


# ════════════════════════════════════════════════════════════════
#  공개 엔드포인트
# ════════════════════════════════════════════════════════════════

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "provider": LLM_PROVIDER,
        "sqlcoder_mode": SQLCODER_MODE if LLM_PROVIDER == "sqlcoder" else None,
        "model": MODEL_NAME,
        "fallback_enabled": get_fallback_vn() is not None,
        "cache_size": len(_sql_cache),
    }


@app.get("/api/suggest")
async def suggest():
    return {"suggestions": SUGGESTIONS}


@app.post("/api/cache-reload")
async def cache_reload():
    before = len(_sql_cache)
    _sql_cache.clear()
    _load_golden_sql()
    return {"before": before, "after": len(_sql_cache)}


@app.get("/api/providers")
async def get_providers():
    """사용 가능한 LLM 프로바이더 목록"""
    return {"providers": available_providers()}


@app.post("/api/ask")
async def ask(req: AskRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="질문을 입력해주세요.")

    sql, df, from_cache, backend = await ask_with_retry(req.question, provider=req.provider)

    data = json.loads(df.to_json(orient="records", force_ascii=False))
    chart_type = infer_chart_type(df)
    summary = generate_summary(req.question, df, sql)
    message_id = str(uuid.uuid4())

    return {
        "message_id": message_id,
        "sql": sql,
        "data": data,
        "chart_type": chart_type,
        "summary": summary,
        "from_cache": from_cache,
        "backend": backend,
        "provider": req.provider or "default",
    }


def _read_user_reports() -> list:
    if not os.path.exists(REPORTS_FILE):
        return []
    with open(REPORTS_FILE, encoding="utf-8") as f:
        try:
            return json.load(f)
        except Exception:
            return []


def _write_user_reports(records: list):
    with open(REPORTS_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)


@app.get("/api/reports")
async def get_reports():
    return {"reports": _read_user_reports()}


@app.get("/api/reports/{report_id}")
async def get_report(report_id: str):
    report = next((r for r in _read_user_reports() if r.get("id") == report_id), None)
    if not report:
        raise HTTPException(status_code=404, detail="보고서를 찾을 수 없습니다.")
    return {"report": report}


@app.post("/api/reports")
async def save_report(req: Request):
    body = await req.json()
    rid = body.get("id", "")
    records = _read_user_reports()
    idx = next((i for i, r in enumerate(records) if r.get("id") == rid), -1)
    if idx >= 0:
        records[idx] = body
    else:
        records.insert(0, body)
    _write_user_reports(records)
    return {"ok": True}


@app.patch("/api/reports/{report_id}/status")
async def update_report_status(report_id: str, req: Request):
    body = await req.json()
    new_status = body.get("status")
    records = _read_user_reports()
    for r in records:
        if r.get("id") == report_id:
            r["status"] = new_status
            break
    _write_user_reports(records)
    return {"ok": True}


@app.delete("/api/reports/{report_id}")
async def delete_report(report_id: str):
    records = [r for r in _read_user_reports() if r.get("id") != report_id]
    _write_user_reports(records)
    return {"ok": True}


@app.get("/api/chat-history")
async def get_chat_history():
    if not os.path.exists(CHAT_HISTORY_FILE):
        return {"messages": []}
    with open(CHAT_HISTORY_FILE, encoding="utf-8") as f:
        try:
            return {"messages": json.load(f)}
        except Exception:
            return {"messages": []}


@app.post("/api/chat-history")
async def save_chat_history(req: Request):
    body = await req.json()
    messages = body.get("messages", [])
    with open(CHAT_HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(messages, f, ensure_ascii=False, indent=2)
    return {"ok": True}


@app.delete("/api/chat-history")
async def clear_chat_history():
    if os.path.exists(CHAT_HISTORY_FILE):
        os.remove(CHAT_HISTORY_FILE)
    return {"ok": True}


@app.get("/api/dashboards")
async def get_dashboards():
    return {"dashboards": _read_dashboards()}


@app.post("/api/dashboards")
async def save_dashboard(req: Request):
    body = await req.json()
    name = body.get("name", "")
    records = _read_dashboards()
    idx = next((i for i, d in enumerate(records) if d.get("name") == name), -1)
    if idx >= 0:
        records[idx] = body
    else:
        records.insert(0, body)
    _write_dashboards(records)
    return {"ok": True}


@app.delete("/api/dashboards/{name}")
async def delete_dashboard(name: str):
    records = [d for d in _read_dashboards() if d.get("name") != name]
    _write_dashboards(records)
    return {"ok": True}


@app.get("/api/my-dashboard")
async def get_my_dashboard():
    if not os.path.exists(MY_DASHBOARD_FILE):
        return {"dashboard": None}
    with open(MY_DASHBOARD_FILE, encoding="utf-8") as f:
        try:
            return {"dashboard": json.load(f)}
        except Exception:
            return {"dashboard": None}


@app.post("/api/my-dashboard")
async def save_my_dashboard(req: Request):
    body = await req.json()
    with open(MY_DASHBOARD_FILE, "w", encoding="utf-8") as f:
        json.dump(body, f, ensure_ascii=False, indent=2)
    return {"ok": True}


@app.delete("/api/my-dashboard")
async def delete_my_dashboard():
    if os.path.exists(MY_DASHBOARD_FILE):
        os.remove(MY_DASHBOARD_FILE)
    return {"ok": True}


@app.post("/api/feedback")
async def feedback(req: FeedbackRequest):
    if req.rating not in ("up", "down"):
        raise HTTPException(status_code=400, detail="rating은 'up' 또는 'down'이어야 합니다.")

    entry = {
        "message_id": req.message_id,
        "rating": req.rating,
        "question": req.question or "",
        "sql": req.sql or "",
        "approved": False,
        "timestamp": datetime.now().isoformat(),
    }
    records = _read_feedback()
    records.append(entry)
    _write_feedback(records)
    return {"ok": True}


# ════════════════════════════════════════════════════════════════
#  관리자 엔드포인트
# ════════════════════════════════════════════════════════════════

@app.post("/admin/login")
async def admin_login(x_admin_password: str = Header(...)):
    if x_admin_password.strip() != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="비밀번호가 올바르지 않습니다.")
    return {"ok": True}


@app.get("/admin/training")
async def admin_get_training(_=Depends(require_admin)):
    try:
        df = vn.get_training_data()
        if df is None or len(df) == 0:
            return {"items": []}
        return {"items": json.loads(df.to_json(orient="records", force_ascii=False))}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/admin/training/sql")
async def admin_train_sql(req: TrainSQLRequest, _=Depends(require_admin)):
    try:
        vn.train(question=req.question, sql=req.sql)
        _sql_cache[req.question.strip()] = req.sql

        # golden_sql.json에도 저장 (서버 재시작 후에도 유지)
        base = os.path.dirname(__file__)
        filename = os.getenv("GOLDEN_SQL_FILE", "golden_sql.json")
        path = os.path.join(base, "training", filename)
        pairs = []
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                pairs = json.load(f)
        # 중복 질문은 덮어쓰기
        pairs = [p for p in pairs if p.get("question") != req.question.strip()]
        pairs.append({"question": req.question.strip(), "sql": req.sql})
        with open(path, "w", encoding="utf-8") as f:
            json.dump(pairs, f, ensure_ascii=False, indent=2)

        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/admin/training/doc")
async def admin_train_doc(req: TrainDocRequest, _=Depends(require_admin)):
    try:
        vn.train(documentation=req.documentation)
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/admin/training/delete")
async def admin_delete_training(req: DeleteTrainingRequest, _=Depends(require_admin)):
    try:
        vn.remove_training_data(id=req.id)
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/admin/training/delete-all")
async def admin_delete_all_training(_=Depends(require_admin)):
    """ChromaDB의 SQL 타입 학습 데이터 전체 삭제 + golden_sql.json 초기화"""
    try:
        df = vn.get_training_data()
        deleted = 0
        if df is not None and len(df) > 0:
            for _, row in df.iterrows():
                if row.get("training_data_type") == "sql":
                    try:
                        vn.remove_training_data(id=row["id"])
                        deleted += 1
                    except Exception:
                        pass
        # golden_sql.json 초기화
        base = os.path.dirname(__file__)
        filename = os.getenv("GOLDEN_SQL_FILE", "golden_sql.json")
        path = os.path.join(base, "training", filename)
        with open(path, "w", encoding="utf-8") as f:
            json.dump([], f)
        _sql_cache.clear()
        return {"ok": True, "deleted": deleted}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/admin/training/retrain-all")
async def admin_retrain_all(_=Depends(require_admin)):
    """ChromaDB 전체 재학습 (train.py + train_ncr.py)"""
    import sys
    import subprocess
    results = []
    for script in ["train.py", "train_ncr.py"]:
        script_path = os.path.join(os.path.dirname(__file__), script)
        if not os.path.exists(script_path):
            results.append({"script": script, "status": "skipped"})
            continue
        result = subprocess.run(
            [sys.executable, script_path],
            capture_output=True, text=True,
        )
        results.append({
            "script": script,
            "status": "ok" if result.returncode == 0 else "error",
            "output": result.stdout[-1000:] if result.stdout else "",
            "error": result.stderr[-500:] if result.stderr and result.returncode != 0 else "",
        })
    return {"ok": True, "results": results}


@app.post("/admin/training/ddl-sync")
async def admin_ddl_sync(_=Depends(require_admin)):
    ddl_path = os.path.join(os.path.dirname(__file__), "training/ddl.sql")
    if not os.path.exists(ddl_path):
        raise HTTPException(status_code=404, detail="ddl.sql 파일을 찾을 수 없습니다.")
    try:
        with open(ddl_path, encoding="utf-8") as f:
            ddl_content = f.read()
        statements = [s.strip() for s in ddl_content.split(";") if s.strip() and "CREATE TABLE" in s.upper()]
        count = 0
        for stmt in statements:
            vn.train(ddl=stmt + ";")
            count += 1
        return {"ok": True, "trained_count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/admin/feedback")
async def admin_get_feedback(_=Depends(require_admin)):
    return {"items": _read_feedback()}


@app.post("/admin/feedback/approve")
async def admin_approve_feedback(req: FeedbackApproveRequest, _=Depends(require_admin)):
    try:
        vn.train(question=req.question, sql=req.sql)
        _sql_cache[req.question.strip()] = req.sql
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"학습 실패: {e}")

    records = _read_feedback()
    for r in records:
        if r["message_id"] == req.message_id:
            r["approved"] = True
            break
    _write_feedback(records)
    return {"ok": True}


@app.post("/admin/feedback/delete")
async def admin_delete_feedback(req: FeedbackDeleteRequest, _=Depends(require_admin)):
    records = [r for r in _read_feedback() if r["message_id"] != req.message_id]
    _write_feedback(records)
    return {"ok": True}


# ════════════════════════════════════════════════════════════════
#  브리핑 엔드포인트 (LLM 호출 없음 — 직접 SQL 조회)
@app.get("/admin/monitoring")
async def admin_monitoring(_=Depends(require_admin)):
    """피드백·채팅 히스토리 기반 모니터링 통계"""
    from collections import Counter

    # ── 피드백 통계 ─────────────────────────────────────────
    feedback_data = _read_feedback()
    up_count = sum(1 for f in feedback_data if f.get("rating") == "up")
    down_count = sum(1 for f in feedback_data if f.get("rating") == "down")
    question_counts = Counter(
        f.get("question", "").strip()
        for f in feedback_data
        if f.get("question", "").strip()
    )
    top_feedback_questions = [
        {"question": q, "count": c}
        for q, c in question_counts.most_common(10)
    ]

    # ── 채팅 히스토리 통계 ──────────────────────────────────
    chat_messages: list = []
    if os.path.exists(CHAT_HISTORY_FILE):
        with open(CHAT_HISTORY_FILE, encoding="utf-8") as f:
            try:
                chat_messages = json.load(f)
            except Exception:
                pass

    user_msgs = [m for m in chat_messages if m.get("role") == "user"]
    success_msgs = [m for m in chat_messages if m.get("status") == "success"]
    error_msgs = [m for m in chat_messages if m.get("status") == "error"]
    total_q = len(user_msgs)

    top_chat_questions = [
        {"question": q, "count": c}
        for q, c in Counter(m.get("content", "").strip() for m in user_msgs if m.get("content", "").strip()).most_common(10)
    ]

    return {
        "feedback": {
            "total": len(feedback_data),
            "up": up_count,
            "down": down_count,
            "satisfaction_rate": round(up_count / len(feedback_data) * 100, 1) if feedback_data else 0,
        },
        "chat": {
            "total_queries": total_q,
            "success": len(success_msgs),
            "error": len(error_msgs),
            "success_rate": round(len(success_msgs) / total_q * 100, 1) if total_q > 0 else 0,
        },
        "top_feedback_questions": top_feedback_questions,
        "top_chat_questions": top_chat_questions,
        "cache_size": len(_sql_cache),
    }


# ════════════════════════════════════════════════════════════════

def _classify_fx_change(change_pct: float) -> str:
    """환율 일간 변동률 기준 (절댓값 기준 — 방향 무관하게 변동 자체가 리스크)"""
    abs_chg = abs(change_pct)
    if abs_chg >= 2.0: return "warning"
    if abs_chg >= 1.0: return "caution"
    return "normal"

def _classify_index_change(change_pct: float) -> str:
    """지수 일간 변동률 기준 (하락이 리스크)"""
    if change_pct <= -2.0: return "warning"
    if change_pct <= -1.0: return "caution"
    if change_pct >= 2.0: return "caution"
    return "normal"

def _classify_vol(vol: float) -> str:
    """변동성 수준 기준 (annualized %)"""
    if vol >= 40.0: return "danger"
    if vol >= 30.0: return "warning"
    if vol >= 20.0: return "caution"
    return "normal"

def _classify_rho(rho: float) -> str:
    """콴토 상관계수 절댓값 기준 (0~1 범위)"""
    abs_rho = abs(rho)
    if abs_rho >= 0.7: return "warning"
    if abs_rho >= 0.5: return "caution"
    return "normal"


@app.get("/api/briefing")
async def get_briefing():
    """시장 데이터 KPI 직접 조회 → 요약 반환 (LLM 호출 없음)"""
    items = []

    # ── USD/KRW 환율 ──────────────────────────────────────────────
    try:
        df_fx = vn.run_sql(
            "SELECT std_date, fx_rate FROM td_dmaqfx "
            "WHERE currency_code = 'USD' ORDER BY std_date DESC LIMIT 2"
        )
        fx_latest = float(df_fx.iloc[0]["fx_rate"])
        fx_prev = float(df_fx.iloc[1]["fx_rate"]) if len(df_fx) > 1 else fx_latest
        change_pct = (fx_latest - fx_prev) / fx_prev * 100 if fx_prev else 0.0
        sign = "+" if change_pct >= 0 else ""
        items.append({
            "key": "fx",
            "label": "USD/KRW 환율",
            "value": f"{fx_latest:,.2f}",
            "subValue": f"전일 대비 {sign}{change_pct:.2f}%",
            "status": _classify_fx_change(change_pct),
            "description": f"기준일 {str(df_fx.iloc[0]['std_date'])[:10]} 고시환율",
            "trend": "up" if change_pct > 0.1 else "down" if change_pct < -0.1 else "flat",
        })
    except Exception as e:
        print(f"[briefing] FX 조회 실패: {e}")
        items.append({
            "key": "fx", "label": "USD/KRW 환율",
            "value": "N/A", "status": "caution",
            "description": "데이터 조회 실패", "trend": "flat",
        })

    # ── KOSPI 지수 ────────────────────────────────────────────────
    try:
        df_idx = vn.run_sql(
            "SELECT std_date, curr_price FROM td_dmaqindex "
            "WHERE index_id = 'KOSPI' ORDER BY std_date DESC LIMIT 2"
        )
        idx_latest = float(df_idx.iloc[0]["curr_price"])
        idx_prev = float(df_idx.iloc[1]["curr_price"]) if len(df_idx) > 1 else idx_latest
        change_pct = (idx_latest - idx_prev) / idx_prev * 100 if idx_prev else 0.0
        sign = "+" if change_pct >= 0 else ""
        items.append({
            "key": "index",
            "label": "KOSPI 지수",
            "value": f"{idx_latest:,.2f}",
            "subValue": f"전일 대비 {sign}{change_pct:.2f}%",
            "status": _classify_index_change(change_pct),
            "description": f"기준일 {str(df_idx.iloc[0]['std_date'])[:10]} 종가",
            "trend": "up" if change_pct > 0.1 else "down" if change_pct < -0.1 else "flat",
        })
    except Exception as e:
        print(f"[briefing] INDEX 조회 실패: {e}")
        items.append({
            "key": "index", "label": "KOSPI 지수",
            "value": "N/A", "status": "caution",
            "description": "데이터 조회 실패", "trend": "flat",
        })

    # ── 시장 변동성 ───────────────────────────────────────────────
    try:
        df_vol = vn.run_sql(
            "SELECT AVG(vol) as avg_vol, MAX(vol) as max_vol FROM td_dmaqvol "
            "WHERE std_date = (SELECT MAX(std_date) FROM td_dmaqvol)"
        )
        avg_vol = float(df_vol.iloc[0]["avg_vol"])
        max_vol = float(df_vol.iloc[0]["max_vol"])
        items.append({
            "key": "vol",
            "label": "시장 변동성",
            "value": f"{avg_vol:.1f}%",
            "subValue": f"최고 {max_vol:.1f}% (평균 기준)",
            "status": _classify_vol(avg_vol),
            "description": f"변동성 {'안정 수준' if avg_vol < 20 else '주의 구간' if avg_vol < 30 else '고변동성 경보'}",
            "trend": "up" if avg_vol >= 25 else "flat",
        })
    except Exception as e:
        print(f"[briefing] VOL 조회 실패: {e}")
        items.append({
            "key": "vol", "label": "시장 변동성",
            "value": "N/A", "status": "caution",
            "description": "데이터 조회 실패", "trend": "flat",
        })

    # ── 콴토 상관계수 ─────────────────────────────────────────────
    try:
        df_rho = vn.run_sql(
            "SELECT AVG(quanto_rho) as avg_rho, MIN(quanto_rho) as min_rho, MAX(quanto_rho) as max_rho "
            "FROM td_dmaqvol "
            "WHERE std_date = (SELECT MAX(std_date) FROM td_dmaqvol)"
        )
        avg_rho = float(df_rho.iloc[0]["avg_rho"])
        min_rho = float(df_rho.iloc[0]["min_rho"])
        max_rho = float(df_rho.iloc[0]["max_rho"])
        items.append({
            "key": "rho",
            "label": "콴토 상관계수",
            "value": f"{avg_rho:.3f}",
            "subValue": f"범위 {min_rho:.3f} ~ {max_rho:.3f}",
            "status": _classify_rho(avg_rho),
            "description": f"환율-자산 상관도 {'낮음' if abs(avg_rho) < 0.5 else '중간' if abs(avg_rho) < 0.7 else '높음 — 콴토 리스크 주의'}",
            "trend": "up" if avg_rho > 0.3 else "down" if avg_rho < -0.3 else "flat",
        })
    except Exception as e:
        print(f"[briefing] RHO 조회 실패: {e}")
        items.append({
            "key": "rho", "label": "콴토 상관계수",
            "value": "N/A", "status": "caution",
            "description": "데이터 조회 실패", "trend": "flat",
        })

    return {"items": items}


# ════════════════════════════════════════════════════════════════
#  Smart Narrative 엔드포인트
# ════════════════════════════════════════════════════════════════

class NarrativeRequest(BaseModel):
    question: str
    data: list  # list of dicts


@app.post("/api/narrative")
async def generate_narrative(req: NarrativeRequest):
    """데이터 → 1~2문장 한국어 설명 (LLM 또는 템플릿 fallback)"""
    if not req.data:
        return {"narrative": ""}

    try:
        df = pd.DataFrame(req.data)
    except Exception:
        return {"narrative": ""}

    numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    rows = len(df)

    # ── 통계 계산 ─────────────────────────────────────────────
    stats: dict = {"rows": rows}
    for col in numeric_cols[:3]:
        vals = df[col].dropna()
        if len(vals) == 0:
            continue
        stats[col] = {
            "min": float(vals.min()),
            "max": float(vals.max()),
            "mean": float(vals.mean()),
            "last": float(vals.iloc[-1]),
            "first": float(vals.iloc[0]),
            "trend": "상승" if vals.iloc[-1] > vals.iloc[0] else "하락" if vals.iloc[-1] < vals.iloc[0] else "보합",
        }

    # ── LLM으로 설명 생성 시도 ─────────────────────────────────
    try:
        stats_summary = "; ".join([
            f"{col}: 최솟값={v['min']:.2f}, 최댓값={v['max']:.2f}, 추세={v['trend']}"
            for col, v in stats.items() if isinstance(v, dict)
        ])
        prompt_text = (
            f"질문: {req.question}\n"
            f"데이터 요약({rows}행): {stats_summary}\n"
            "위 데이터를 한국어로 1~2문장으로 간결하게 설명해 주세요. "
            "수치와 추세를 포함하고, 리스크 관리 관점에서 해석하세요."
        )
        messages = [{"role": "user", "content": prompt_text}]
        narrative = None

        # 1순위: Groq API 직접 호출 (프로덕션)
        if GROQ_API_KEY:
            from openai import OpenAI as _OpenAI
            _client = _OpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
            resp = _client.chat.completions.create(
                model=GROQ_MODEL_FB,
                messages=messages,
                temperature=0.3,
                max_tokens=150,
            )
            narrative = resp.choices[0].message.content
        # 2순위: Ollama 직접 호출 (로컬)
        elif OLLAMA_HOST:
            resp = _requests.post(
                f"{OLLAMA_HOST}/api/chat",
                json={"model": FALLBACK_OLLAMA_MODEL, "messages": messages, "stream": False},
                timeout=30,
            )
            resp.raise_for_status()
            narrative = resp.json()["message"]["content"]

        if narrative:
            sentences = [s.strip() for s in narrative.replace("\n", " ").split(".") if s.strip()]
            narrative = ". ".join(sentences[:2]) + ("." if sentences else "")
            return {"narrative": narrative}
    except Exception as e:
        import traceback
        print(f"[narrative] LLM 실패, 템플릿 사용: {e}")
        print(traceback.format_exc())

    # ── 템플릿 fallback ────────────────────────────────────────
    parts = []
    for col, v in stats.items():
        if not isinstance(v, dict):
            continue
        parts.append(f"{col}은 {v['first']:.2f}에서 {v['last']:.2f}으로 {v['trend']} 추세입니다.")
        if v["max"] != v["last"]:
            parts.append(f"최댓값은 {v['max']:.2f}이었습니다.")
        break  # 첫 번째 수치 컬럼만
    if not parts:
        parts = [f"총 {rows}개의 데이터가 조회되었습니다."]
    return {"narrative": " ".join(parts[:2])}
