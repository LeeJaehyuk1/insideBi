"""
main.py – FastAPI AI 분석 서버
실행: uvicorn main:app --reload --port 8000
"""
import json
import os
import uuid
from datetime import datetime
from typing import Optional

import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

# Vanna 초기화 (import 시점에 ChromaDB + Ollama 연결)
from vanna_setup import vn, OLLAMA_MODEL

app = FastAPI(title="insideBi AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
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


# ── 모델 ─────────────────────────────────────────────────────

class AskRequest(BaseModel):
    question: str


class FeedbackRequest(BaseModel):
    message_id: str
    rating: str  # "up" | "down"


# ── 유틸 ─────────────────────────────────────────────────────

def validate_sql(sql: str) -> bool:
    upper = sql.upper()
    return not any(kw in upper for kw in FORBIDDEN_KEYWORDS)


def infer_chart_type(df: pd.DataFrame) -> str:
    """컬럼 특성으로 차트 타입 자동 추론"""
    cols = [c.lower() for c in df.columns]
    # 날짜 컬럼 감지
    date_cols = [c for c in cols if any(k in c for k in ["date", "month", "year", "날짜", "월", "기간"])]
    numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    # pct / 비율 컬럼
    pct_cols = [c for c in cols if "pct" in c or "ratio" in c or "rate" in c or "비율" in c]

    if date_cols:
        if len(numeric_cols) >= 2:
            return "area"
        return "line"
    if pct_cols and len(df.columns) <= 3 and len(df) <= 10:
        return "pie"
    return "bar"


def generate_summary(question: str, df: pd.DataFrame, sql: str) -> str:
    """간단한 결과 요약 생성 (LLM 호출 없이 규칙 기반)"""
    rows = len(df)
    cols = list(df.columns)
    if rows == 1:
        # 스칼라 결과
        parts = [f"{col}: {df.iloc[0][col]}" for col in cols]
        return "현재 수치: " + ", ".join(parts)
    return f"총 {rows}개 데이터를 조회했습니다. ({', '.join(cols[:3])} 등)"


async def ask_with_retry(question: str, max_attempts: int = 3):
    """SQL 생성 → 실행 → 실패시 오류 컨텍스트로 재시도"""
    context = question
    last_error = None
    for attempt in range(max_attempts):
        try:
            sql = vn.generate_sql(context)
            if not validate_sql(sql):
                raise HTTPException(status_code=400, detail="보안 위반 쿼리가 감지되었습니다. 데이터 조회 질문만 가능합니다.")
            df = vn.run_sql(sql)
            return sql, df
        except HTTPException:
            raise
        except Exception as e:
            last_error = str(e)
            context = f"{question}\n[이전 시도 오류 수정 필요: {last_error}]"
    raise HTTPException(status_code=500, detail=f"쿼리 생성에 실패했습니다: {last_error}")


# ── 엔드포인트 ────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok", "model": OLLAMA_MODEL}


@app.get("/api/suggest")
async def suggest():
    return {"suggestions": SUGGESTIONS}


@app.post("/api/ask")
async def ask(req: AskRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="질문을 입력해주세요.")

    sql, df = await ask_with_retry(req.question)

    # DataFrame → JSON serializable list
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
    }


@app.post("/api/feedback")
async def feedback(req: FeedbackRequest):
    if req.rating not in ("up", "down"):
        raise HTTPException(status_code=400, detail="rating은 'up' 또는 'down'이어야 합니다.")

    entry = {
        "message_id": req.message_id,
        "rating": req.rating,
        "timestamp": datetime.now().isoformat(),
    }

    # 기존 피드백 파일에 append
    records = []
    if os.path.exists(FEEDBACK_FILE):
        with open(FEEDBACK_FILE, encoding="utf-8") as f:
            try:
                records = json.load(f)
            except json.JSONDecodeError:
                records = []
    records.append(entry)
    with open(FEEDBACK_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    return {"ok": True}
