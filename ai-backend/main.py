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
import requests as _requests

from vanna_setup import (
    vn,
    get_fallback_vn,
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
# ════════════════════════════════════════════════════════════════

def _classify_npl(value: float) -> str:
    if value >= 3.0: return "danger"
    if value >= 2.0: return "warning"
    if value >= 1.5: return "caution"
    return "normal"

def _classify_var_util(utilization: float) -> str:
    if utilization >= 95: return "danger"
    if utilization >= 80: return "warning"
    if utilization >= 65: return "caution"
    return "normal"

def _classify_lcr(lcr: float) -> str:
    if lcr < 100: return "danger"
    if lcr < 110: return "warning"
    if lcr < 120: return "caution"
    return "normal"


@app.get("/api/briefing")
async def get_briefing():
    """주요 KPI 직접 조회 → 요약 반환 (LLM 호출 없음)"""
    items = []
    try:
        # ── NPL ──────────────────────────────────────────────
        try:
            df_npl = vn.run_sql(
                "SELECT npl_ratio, npl_amount, total_loan FROM npl_summary LIMIT 1"
            )
            npl_ratio = float(df_npl.iloc[0]["npl_ratio"])
            npl_amount = float(df_npl.iloc[0]["npl_amount"])
            total_loan = float(df_npl.iloc[0]["total_loan"])
            items.append({
                "key": "npl",
                "label": "신용리스크 (NPL)",
                "value": f"{npl_ratio:.2f}%",
                "subValue": f"NPL 잔액 {npl_amount:.0f}억원 / 총여신 {total_loan:.0f}억원",
                "status": _classify_npl(npl_ratio),
                "description": f"NPL 비율 {'정상 수준' if npl_ratio < 1.5 else '기준 초과 — 모니터링 필요'}",
                "trend": "up" if npl_ratio >= 1.5 else "flat",
            })
        except Exception as e:
            print(f"[briefing] NPL 조회 실패: {e}")
            items.append({
                "key": "npl", "label": "신용리스크 (NPL)",
                "value": "N/A", "status": "caution",
                "description": "데이터 조회 실패", "trend": "flat",
            })

        # ── VaR ──────────────────────────────────────────────
        try:
            df_var = vn.run_sql(
                "SELECT current, limit_val, utilization FROM var_summary LIMIT 1"
            )
            current_var = float(df_var.iloc[0]["current"])
            var_limit = float(df_var.iloc[0]["limit_val"])
            utilization = float(df_var.iloc[0]["utilization"])
            items.append({
                "key": "var",
                "label": "시장리스크 (VaR)",
                "value": f"{current_var:.0f}억원",
                "subValue": f"한도 {var_limit:.0f}억원 대비 {utilization:.1f}% 소진",
                "status": _classify_var_util(utilization),
                "description": f"VaR 한도 소진율 {utilization:.1f}% — {'여유' if utilization < 65 else '주의 필요'}",
                "trend": "up" if utilization >= 65 else "flat",
            })
        except Exception as e:
            print(f"[briefing] VaR 조회 실패: {e}")
            items.append({
                "key": "var", "label": "시장리스크 (VaR)",
                "value": "N/A", "status": "caution",
                "description": "데이터 조회 실패", "trend": "flat",
            })

        # ── LCR ──────────────────────────────────────────────
        try:
            df_lcr = vn.run_sql(
                "SELECT lcr, nsfr FROM lcr_gauge LIMIT 1"
            )
            lcr = float(df_lcr.iloc[0]["lcr"])
            nsfr = float(df_lcr.iloc[0]["nsfr"])
            items.append({
                "key": "lcr",
                "label": "유동성리스크 (LCR)",
                "value": f"{lcr:.1f}%",
                "subValue": f"NSFR {nsfr:.1f}% / 규제 최저 100%",
                "status": _classify_lcr(lcr),
                "description": f"LCR {lcr:.1f}% — {'규제 준수' if lcr >= 100 else '규제 미달 위험'}",
                "trend": "down" if lcr < 120 else "flat",
            })
        except Exception as e:
            print(f"[briefing] LCR 조회 실패: {e}")
            items.append({
                "key": "lcr", "label": "유동성리스크 (LCR)",
                "value": "N/A", "status": "caution",
                "description": "데이터 조회 실패", "trend": "flat",
            })

        # ── NCR ──────────────────────────────────────────────
        try:
            df_ncr = vn.run_sql(
                "SELECT current_ncr, ncr_limit, warning_level, target_level, change_from_last_month FROM ncr_summary LIMIT 1"
            )
            current_ncr = float(df_ncr.iloc[0]["current_ncr"])
            ncr_limit = float(df_ncr.iloc[0]["ncr_limit"])
            warning_level = float(df_ncr.iloc[0]["warning_level"])
            target_level = float(df_ncr.iloc[0]["target_level"])
            change = float(df_ncr.iloc[0]["change_from_last_month"])
            # NCR은 높을수록 좋음: limit(150%) 미만 위험, warning(200%) 미만 경고, target(500%) 미만 주의
            if current_ncr < ncr_limit:
                ncr_status = "danger"
            elif current_ncr < warning_level:
                ncr_status = "warning"
            elif current_ncr < target_level:
                ncr_status = "caution"
            else:
                ncr_status = "normal"
            items.append({
                "key": "ncr",
                "label": "NCR리스크 (순자본비율)",
                "value": f"{current_ncr:.1f}%",
                "subValue": f"규제 한도 {ncr_limit:.0f}% / 목표 {target_level:.0f}%",
                "status": ncr_status,
                "description": f"전월 대비 {'+' if change >= 0 else ''}{change:.1f}%p — {'양호' if current_ncr >= target_level else '목표 미달'}",
                "trend": "up" if change > 0 else "down" if change < 0 else "flat",
            })
        except Exception as e:
            print(f"[briefing] NCR 조회 실패: {e}")
            items.append({
                "key": "ncr", "label": "NCR리스크 (순자본비율)",
                "value": "N/A", "status": "caution",
                "description": "데이터 조회 실패", "trend": "flat",
            })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
        print(f"[narrative] LLM 실패, 템플릿 사용: {e}")

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
