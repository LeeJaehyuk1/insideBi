"""
main.py – FastAPI AI 분석 서버
실행: uvicorn main:app --reload --port 8000
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

# Vanna 초기화 (import 시점에 ChromaDB + LLM 연결)
from vanna_setup import vn, MODEL_NAME, LLM_PROVIDER, DB_PATH as VANNA_DB_PATH

app = FastAPI(title="insideBi AI API", version="1.0.0")

# FRONTEND_URL 환경변수로 허용 origin 추가 (쉼표로 여러 개 가능)
_extra_origins = [o.strip() for o in os.getenv("FRONTEND_URL", "").split(",") if o.strip()]
_allowed_origins = ["http://localhost:3000"] + _extra_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 피드백 저장 파일
FEEDBACK_FILE = os.path.join(os.path.dirname(__file__), "feedback.json")

# SQL 보안 가드레일
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

# ── SQL 캐시 ──────────────────────────────────────────────────
_sql_cache: dict[str, str] = {}

CACHE_THRESHOLD = 0.78


def _load_golden_sql():
    """서버 시작 시 Golden SQL 쌍을 캐시에 로드"""
    path = os.path.join(os.path.dirname(__file__), "training/golden_sql.json")
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8") as f:
        pairs = json.load(f)
    for pair in pairs:
        _sql_cache[pair["question"]] = pair["sql"]
    print(f"[cache] Golden SQL {len(pairs)}개 로드 완료")


_load_golden_sql()


@app.on_event("startup")
async def _startup():
    """Railway 등 클라우드 환경: DB가 없으면 자동 마이그레이션"""
    import sys
    if not os.path.exists(VANNA_DB_PATH):
        print("[startup] DB not found — running migration...")
        import subprocess
        result = subprocess.run(
            [sys.executable, os.path.join(os.path.dirname(__file__), "db", "migrate.py")],
            capture_output=True, text=True,
        )
        if result.returncode == 0:
            print("[startup] Migration complete")
        else:
            print(f"[startup] Migration failed:\n{result.stderr}")


def find_cached_sql(question: str) -> tuple[str | None, float]:
    """질문과 캐시된 질문들 간의 퍼지 유사도를 계산해 SQL 반환"""
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


# ── 관리자 인증 ───────────────────────────────────────────────

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin1234")


def require_admin(x_admin_password: str = Header(...)):
    if x_admin_password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="관리자 비밀번호가 올바르지 않습니다.")


# ── 모델 ─────────────────────────────────────────────────────

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


# ── 유틸 ─────────────────────────────────────────────────────

def validate_sql(sql: str) -> bool:
    upper = sql.upper()
    return not any(kw in upper for kw in FORBIDDEN_KEYWORDS)


def infer_chart_type(df: pd.DataFrame) -> str:
    """컬럼 특성으로 차트 타입 자동 추론"""
    cols = [c.lower() for c in df.columns]
    date_cols = [c for c in cols if any(k in c for k in ["date", "month", "year", "날짜", "월", "기간"])]
    numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    pct_cols = [c for c in cols if "pct" in c or "ratio" in c or "rate" in c or "비율" in c]

    if date_cols:
        if len(numeric_cols) >= 2:
            return "area"
        return "line"
    if pct_cols and len(df.columns) <= 3 and len(df) <= 10:
        return "pie"
    return "bar"


def generate_summary(question: str, df: pd.DataFrame, sql: str) -> str:
    """간단한 결과 요약 생성 (규칙 기반)"""
    rows = len(df)
    cols = list(df.columns)
    if rows == 1:
        parts = [f"{col}: {df.iloc[0][col]}" for col in cols]
        return "현재 수치: " + ", ".join(parts)
    return f"총 {rows}개 데이터를 조회했습니다. ({', '.join(cols[:3])} 등)"


async def ask_with_retry(question: str, max_attempts: int = 3):
    """
    1) 캐시 조회 → 히트 시 LLM 생략
    2) 캐시 미스 → LLM SQL 생성 (최대 3회 재시도)
    3) 성공한 SQL을 캐시에 저장
    """
    cached_sql, score = find_cached_sql(question)
    if cached_sql:
        print(f"[cache HIT] score={score:.2f}  sql={cached_sql}")
        try:
            df = vn.run_sql(cached_sql)
            return cached_sql, df, True
        except Exception as e:
            print(f"[cache] 캐시 SQL 실행 실패, LLM으로 폴백: {e}")

    context = question
    last_error = None
    for attempt in range(max_attempts):
        try:
            sql = vn.generate_sql(context)
            if not validate_sql(sql):
                raise HTTPException(status_code=400, detail="보안 위반 쿼리가 감지되었습니다. 데이터 조회 질문만 가능합니다.")
            df = vn.run_sql(sql)
            _sql_cache[question.strip()] = sql
            print(f"[cache STORE] question={question[:30]}  sql={sql}")
            return sql, df, False
        except HTTPException:
            raise
        except Exception as e:
            last_error = str(e)
            context = f"{question}\n[이전 시도 오류 수정 필요: {last_error}]"
    raise HTTPException(status_code=500, detail=f"쿼리 생성에 실패했습니다: {last_error}")


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


# ── 공개 엔드포인트 ───────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "provider": LLM_PROVIDER,
        "model": MODEL_NAME,
        "cache_size": len(_sql_cache),
    }


@app.get("/api/suggest")
async def suggest():
    return {"suggestions": SUGGESTIONS}


@app.post("/api/cache-reload")
async def cache_reload():
    """Golden SQL 캐시를 파일에서 다시 로드"""
    before = len(_sql_cache)
    _sql_cache.clear()
    _load_golden_sql()
    after = len(_sql_cache)
    return {"before": before, "after": after}


@app.post("/api/ask")
async def ask(req: AskRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="질문을 입력해주세요.")

    sql, df, from_cache = await ask_with_retry(req.question)

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


# ── 관리자 엔드포인트 ─────────────────────────────────────────

@app.post("/admin/login")
async def admin_login(x_admin_password: str = Header(...)):
    if x_admin_password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="비밀번호가 올바르지 않습니다.")
    return {"ok": True}


@app.get("/admin/training")
async def admin_get_training(_=Depends(require_admin)):
    """Vanna ChromaDB에 저장된 학습 데이터 전체 반환"""
    try:
        df = vn.get_training_data()
        if df is None or len(df) == 0:
            return {"items": []}
        records = json.loads(df.to_json(orient="records", force_ascii=False))
        return {"items": records}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/admin/training/sql")
async def admin_train_sql(req: TrainSQLRequest, _=Depends(require_admin)):
    """Q-SQL 쌍을 학습"""
    try:
        vn.train(question=req.question, sql=req.sql)
        # 캐시에도 즉시 반영
        _sql_cache[req.question.strip()] = req.sql
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/admin/training/doc")
async def admin_train_doc(req: TrainDocRequest, _=Depends(require_admin)):
    """비즈니스 용어/문서를 학습"""
    try:
        vn.train(documentation=req.documentation)
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/admin/training/delete")
async def admin_delete_training(req: DeleteTrainingRequest, _=Depends(require_admin)):
    """학습 데이터 항목 삭제"""
    try:
        vn.remove_training_data(id=req.id)
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/admin/training/ddl-sync")
async def admin_ddl_sync(_=Depends(require_admin)):
    """ddl.sql 파일을 파싱하여 DDL 전체 재학습"""
    ddl_path = os.path.join(os.path.dirname(__file__), "training/ddl.sql")
    if not os.path.exists(ddl_path):
        raise HTTPException(status_code=404, detail="ddl.sql 파일을 찾을 수 없습니다.")
    try:
        with open(ddl_path, encoding="utf-8") as f:
            ddl_content = f.read()
        # CREATE TABLE 단위로 분할하여 개별 학습
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
    """피드백 목록 반환"""
    records = _read_feedback()
    return {"items": records}


@app.post("/admin/feedback/approve")
async def admin_approve_feedback(req: FeedbackApproveRequest, _=Depends(require_admin)):
    """피드백 승인: Q-SQL 쌍으로 학습 후 approved 플래그 업데이트"""
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
    """피드백 항목 삭제"""
    records = _read_feedback()
    records = [r for r in records if r["message_id"] != req.message_id]
    _write_feedback(records)
    return {"ok": True}
