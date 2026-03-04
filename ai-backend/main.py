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
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

# Vanna / SQLCoder 초기화
from vanna_setup import (
    vn,
    get_fallback_vn,
    MODEL_NAME,
    LLM_PROVIDER,
    SQLCODER_MODE,
    DB_PATH as VANNA_DB_PATH,
    DATABASE_URL,
)

app = FastAPI(title="insideBi AI API", version="2.0.0")

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
CACHE_THRESHOLD = 0.62


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


class FeedbackRequest(BaseModel):
    message_id: str
    rating: str  # "up" | "down"
    question: Optional[str] = None
    sql: Optional[str] = None


class TrainSQLRequest(BaseModel):
    question: str
    sql: str


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
    pct_cols = [c for c in cols if "pct" in c or "ratio" in c or "rate" in c or "비율" in c]

    if date_cols:
        return "area" if len(numeric_cols) >= 2 else "line"
    if pct_cols and len(df.columns) <= 3 and len(df) <= 10:
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

async def ask_with_retry(question: str, max_attempts: int = 2):
    """
    [파이프라인]
    1) SQL 캐시 조회        → 히트 시 LLM 생략
    2) Primary LLM 시도    → SQLCoder (Ollama or Defog API)
    3) Primary 실패 시     → Fallback LLM (Groq or 범용 Ollama) 재시도
    4) 모두 실패           → 503 에러
    """
    # ── Step 1: 캐시 조회 ─────────────────────────────────────
    cached_sql, score = find_cached_sql(question)
    if cached_sql:
        print(f"[cache HIT] score={score:.2f}  sql={cached_sql[:60]}")
        try:
            df = vn.run_sql(cached_sql)
            return cached_sql, df, True, "cache"
        except Exception as e:
            print(f"[cache] 캐시 SQL 실행 실패, Primary LLM으로 폴백: {e}")

    # ── Step 2: Primary LLM (SQLCoder) ───────────────────────
    last_error: str = ""
    context = question

    for attempt in range(max_attempts):
        try:
            sql = vn.generate_sql(context)
            if not sql or not sql.upper().strip().startswith("SELECT"):
                raise ValueError(f"유효하지 않은 SQL 형식: {sql[:80]}")
            if not validate_sql(sql):
                raise HTTPException(
                    status_code=400,
                    detail="보안 위반 쿼리가 감지되었습니다. 데이터 조회 질문만 가능합니다."
                )
            df = vn.run_sql(sql)
            _sql_cache[question.strip()] = sql
            backend = f"sqlcoder-{SQLCODER_MODE}" if LLM_PROVIDER == "sqlcoder" else LLM_PROVIDER
            print(f"[{backend}] 성공 (attempt={attempt+1})  sql={sql[:60]}")
            return sql, df, False, backend
        except HTTPException:
            raise
        except Exception as e:
            last_error = str(e)
            print(f"[primary] attempt={attempt+1} 실패: {last_error[:120]}")
            context = f"{question}\n[이전 시도 오류, 다시 시도: {last_error[:80]}]"

    # ── Step 3: Fallback LLM ─────────────────────────────────
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
        detail=f"SQL 생성에 실패했습니다 (Primary + Fallback 모두 실패): {last_error}"
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


@app.post("/api/ask")
async def ask(req: AskRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="질문을 입력해주세요.")

    sql, df, from_cache, backend = await ask_with_retry(req.question)

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
        "backend": backend,   # 어느 LLM이 응답했는지 디버깅용
    }


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
