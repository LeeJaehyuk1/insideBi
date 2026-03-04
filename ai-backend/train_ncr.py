"""
train_ncr.py - NCR 관련 4개 테이블 증분 학습
기존 ChromaDB를 건드리지 않고 새 테이블만 추가 학습합니다.

실행: cd ai-backend && python train_ncr.py
"""
import re
from vanna_setup import vn

# ── 기존 create 파일에서 DDL·코멘트 임포트 ────────────────────
from db.create_td_irncr import DDL as _RAW_IRNCR, COLUMN_COMMENTS as _CMT_IRNCR
from db.create_td_irpos import DDL as _RAW_IRPOS, COLUMN_COMMENTS as _CMT_IRPOS
from db.create_td_irriskcr import DDL as _RAW_IRRISKCR, COLUMN_COMMENTS as _CMT_IRRISKCR
from db.create_td_irriskmr import DDL as _RAW_IRRISKMR, COLUMN_COMMENTS as _CMT_IRRISKMR


# ── 유틸: DROP TABLE 제거 후 CREATE TABLE 블록만 추출 ─────────
def _extract_create(raw: str) -> str:
    m = re.search(r"(CREATE\s+TABLE\b.*?;)", raw, re.DOTALL | re.IGNORECASE)
    return m.group(1).strip() if m else raw.strip()


# ── 1. DDL 학습 ───────────────────────────────────────────────
DDL_MAP = {
    "td_irncr":   _extract_create(_RAW_IRNCR),
    "td_irpos":   _extract_create(_RAW_IRPOS),
    "td_irriskcr": _extract_create(_RAW_IRRISKCR),
    "td_irriskmr": _extract_create(_RAW_IRRISKMR),
}

TABLE_DESC = {
    "td_irncr":    "NCR 산출 데이터",
    "td_irpos":    "금리포지션 데이터",
    "td_irriskcr": "신용위험 산출 데이터",
    "td_irriskmr": "시장위험 산출 데이터",
}


def train_ddl():
    print("[1/3] DDL 학습...")
    for table, ddl in DDL_MAP.items():
        try:
            vn.train(ddl=ddl)
            print(f"  [DDL] {table} ({TABLE_DESC[table]}) 학습 완료")
        except Exception as e:
            print(f"  [DDL] {table} 오류: {e}")


# ── 2. 비즈니스 문서 학습 ─────────────────────────────────────
DOCUMENTATION = """
## NCR(순자본비율) 관련 테이블 — InsightBi 리스크관리 시스템

NCR(Net Capital Ratio, 순자본비율)은 금융투자업자의 자본 건전성 규제 지표입니다.
4개 테이블 모두 공통 키 컬럼: std_date(기준일자 YYYYMMDD), org_code(사무소코드),
con_sep_clcd(연결별도구분코드 — 'C':연결, 'S':별도).

---

### td_irncr — NCR 산출 데이터
항목별 NCR 산출 결과를 저장합니다.
- PK: std_date, org_code, con_sep_clcd, ncr_stress_no, port_no, obj_dtl_cd,
      item_lclas_cd, item_mclas_cd, item_sclas_cd, item_dtl_cd
- ncr_stress_no: NCR 스트레스 번호 (0=기본, 1이상=스트레스 시나리오)
- port_no: 포트폴리오 번호
- obj_dtl_cd: 대상 상세 코드
- item_lclas_cd/nm: 항목 대분류 코드/명
- item_mclas_cd/nm: 항목 중분류 코드/명
- item_sclas_cd/nm: 항목 소분류 코드/명
- item_dtl_cd/nm: 항목 상세분류 코드/명
- prod_val: 산출값 (NUMERIC) — 각 항목의 NCR 계산 결과값

---

### td_irpos — 포지션 데이터 (NCR 산출 기초)
보유자산 및 파생상품 포지션 원장 데이터입니다.
- PK: std_date, org_code, con_sep_clcd, bo_item_code(익스포져ID)
- item_code/item_name: 종목코드/종목명
- fund_code/fund_name: 펀드코드/명 (집합투자 포지션)
- cust_fund_code/name: 고객펀드코드/명
- biz_area_cd/nm: NCR 업무영역 코드/명
- market_amt: 시장금액 (시가평가액)
- book_amt: 장부금액 (취득원가 기반)
- notional_amt: 명목금액 (파생상품 계약금액)
- eval_pl_amt: 평가손익금액
- posi_amt: 포지션금액 (NCR 계산 기준)
- delta_posi_amt: 델타포지션금액 (옵션 델타 환산)
- gamma_posi_amt: 감마포지션금액
- vega_posi_amt: 베가포지션금액
- delta / gamma / vega: 파생상품 그릭스
- cpty_code/name: 거래상대방코드/명
- ncr_st_gbn/nm: NCR 주식구분 코드/명
- ncr_bond_gbn/nm: NCR 채권구분 코드/명
- ir_risk_yn ~ loan_risk_yn: 위험 유형별 해당 여부 (Y/N)
- proc_risk_type: NCR 위험설정구분

---

### td_irriskcr — 신용위험 산출 데이터
NCR 신용위험 항목별 산출 결과를 저장합니다.
- PK: std_date, org_code, con_sep_clcd, port_no, ncr_stress_no, bo_item_code
- cpty_code/name: 거래상대방코드/명
- ncr_grad_cd/nm: NCR 신용등급 코드/명
- crdt_chng_amt: 신용환산액 (익스포저 × CCF)
- crdt_risk_val: 신용위험값 (위험가중치)
- crdt_risk_amt: 신용위험액 (신용환산액 × 위험가중치)
- crdt_mtgt_amt: 신용경감금액 (담보·보증 인정액)
- crdt_mtgt_val: 신용경감위험값
- crdt_mtgt_risk_amt: 신용경감위험액 (경감 후 위험액)
- ccf_rate: 신용환산율(%) — 미사용 약정 등의 신용환산 비율
- coll_allo_amt: 담보인정금액
- appl_coll_allo_amt: 적용담보인정금액
- grnt_amt: 보증금액
- crdt_cncr_risk_yn: 신용집중위험 해당 여부

---

### td_irriskmr — 시장위험 산출 데이터
NCR 시장위험 항목별 산출 결과를 저장합니다.
- PK: std_date, org_code, con_sep_clcd, port_no, ncr_stress_no, bo_item_code
- posi_amt: 포지션금액 (시장위험 계산 기준)
- std_amt: 상계후 포지션기준금액 (상계 적용 후)
- bef_std_amt: 상계전 포지션기준금액
- 주식위험: st_specific_risk_val/amt(개별), st_gen_risk_val/amt(일반),
            st_mprf_tr_risk_val/amt(차익거래), st_cncr_risk_val/amt(집중)
- 금리위험: ir_specific_risk_val/amt(개별), ir_gen_risk_val/amt(일반),
            ir_udwr_risk_amt(인수)
- 외환위험: fx_curr_risk_val/amt(통화), fx_gold_risk_val/amt(금)
- 집합투자위험: set_pssn_risk_val/amt(보유), set_sale_risk_val/amt(판매)
- 옵션위험: opt_gamma_risk_val/amt, opt_vega_risk_val/amt, opt_dpo_prc_risk_amt
- 일반상품위험: gen_prod_risk_amt
- ncr_ir_grp_gbn/nm: NCR 금리 그룹 구분
- assmd_ir_chg_rate: 상정금리변동폭
- ncr_st_gbn/nm: NCR 주식구분

---

### 공통 패턴

- 기준일자 조회: WHERE std_date = '20260301'
- 기간 조회: WHERE std_date BETWEEN '20260101' AND '20260331'
- 연결/별도 구분: WHERE con_sep_clcd = 'C'  -- 연결
- 스트레스 vs 기본: WHERE ncr_stress_no = 0  -- 기본 시나리오
- 전체 집계 시 GROUP BY std_date 활용
- 금액 단위는 모두 원(KRW) 기준
"""


def train_documentation():
    print("[2/3] 비즈니스 문서 학습...")
    try:
        vn.train(documentation=DOCUMENTATION)
        print("  [DOC] NCR 테이블 문서 학습 완료")
    except Exception as e:
        print(f"  [DOC] 오류: {e}")


# ── 3. Golden SQL 학습 ────────────────────────────────────────
GOLDEN_SQL = [
    # ── td_irncr ───────────────────────────────────────────────
    {
        "question": "NCR 항목 대분류별 산출값 합계",
        "sql": (
            "SELECT item_lclas_nm, SUM(prod_val) AS total_val "
            "FROM td_irncr "
            "WHERE ncr_stress_no = 0 "
            "GROUP BY item_lclas_cd, item_lclas_nm "
            "ORDER BY total_val DESC"
        ),
    },
    {
        "question": "포트폴리오별 NCR 산출값 합계",
        "sql": (
            "SELECT port_no, SUM(prod_val) AS total_val "
            "FROM td_irncr "
            "WHERE ncr_stress_no = 0 "
            "GROUP BY port_no "
            "ORDER BY total_val DESC"
        ),
    },
    {
        "question": "기준일자별 NCR 산출값 추이",
        "sql": (
            "SELECT std_date, SUM(prod_val) AS total_val "
            "FROM td_irncr "
            "WHERE ncr_stress_no = 0 "
            "GROUP BY std_date "
            "ORDER BY std_date"
        ),
    },
    {
        "question": "NCR 스트레스 시나리오별 산출값 비교",
        "sql": (
            "SELECT ncr_stress_no, SUM(prod_val) AS total_val "
            "FROM td_irncr "
            "GROUP BY ncr_stress_no "
            "ORDER BY ncr_stress_no"
        ),
    },
    {
        "question": "NCR 항목 중분류별 산출값",
        "sql": (
            "SELECT item_lclas_nm, item_mclas_nm, SUM(prod_val) AS total_val "
            "FROM td_irncr "
            "WHERE ncr_stress_no = 0 "
            "GROUP BY item_lclas_cd, item_lclas_nm, item_mclas_cd, item_mclas_nm "
            "ORDER BY item_lclas_cd, total_val DESC"
        ),
    },
    # ── td_irpos ──────────────────────────────────────────────
    {
        "question": "시장금액 상위 10개 포지션 종목",
        "sql": (
            "SELECT item_name, market_amt, book_amt, eval_pl_amt "
            "FROM td_irpos "
            "ORDER BY ABS(market_amt) DESC "
            "LIMIT 10"
        ),
    },
    {
        "question": "NCR 업무영역별 포지션금액 합계",
        "sql": (
            "SELECT biz_area_nm, SUM(posi_amt) AS total_posi "
            "FROM td_irpos "
            "WHERE biz_area_nm IS NOT NULL "
            "GROUP BY biz_area_cd, biz_area_nm "
            "ORDER BY total_posi DESC"
        ),
    },
    {
        "question": "파생상품 델타포지션 금액 상위 종목",
        "sql": (
            "SELECT item_name, delta_posi_amt, gamma_posi_amt, vega_posi_amt "
            "FROM td_irpos "
            "WHERE delta_posi_amt IS NOT NULL "
            "ORDER BY ABS(delta_posi_amt) DESC "
            "LIMIT 10"
        ),
    },
    {
        "question": "금리위험 해당 포지션의 시장금액 합계",
        "sql": (
            "SELECT SUM(market_amt) AS ir_risk_market_amt "
            "FROM td_irpos "
            "WHERE ir_risk_yn = 'Y'"
        ),
    },
    {
        "question": "NCR 주식구분별 포지션금액",
        "sql": (
            "SELECT ncr_st_gbn_nm, SUM(posi_amt) AS total_posi "
            "FROM td_irpos "
            "WHERE ncr_st_gbn_nm IS NOT NULL "
            "GROUP BY ncr_st_gbn, ncr_st_gbn_nm "
            "ORDER BY total_posi DESC"
        ),
    },
    # ── td_irriskcr ───────────────────────────────────────────
    {
        "question": "거래상대방별 신용위험액 상위 10개",
        "sql": (
            "SELECT cpty_name, SUM(crdt_risk_amt) AS total_crdt_risk "
            "FROM td_irriskcr "
            "WHERE ncr_stress_no = 0 "
            "GROUP BY cpty_code, cpty_name "
            "ORDER BY total_crdt_risk DESC "
            "LIMIT 10"
        ),
    },
    {
        "question": "NCR 신용등급별 신용위험액",
        "sql": (
            "SELECT ncr_grad_cd_nm, "
            "       SUM(crdt_chng_amt) AS total_chng, "
            "       SUM(crdt_risk_amt) AS total_risk "
            "FROM td_irriskcr "
            "WHERE ncr_stress_no = 0 "
            "GROUP BY ncr_grad_cd, ncr_grad_cd_nm "
            "ORDER BY total_risk DESC"
        ),
    },
    {
        "question": "신용경감 전후 위험액 비교",
        "sql": (
            "SELECT SUM(crdt_risk_amt)       AS risk_before, "
            "       SUM(crdt_mtgt_risk_amt)   AS risk_after, "
            "       SUM(crdt_risk_amt) - SUM(crdt_mtgt_risk_amt) AS reduction "
            "FROM td_irriskcr "
            "WHERE ncr_stress_no = 0"
        ),
    },
    {
        "question": "기준일자별 신용위험액 추이",
        "sql": (
            "SELECT std_date, SUM(crdt_risk_amt) AS total_crdt_risk "
            "FROM td_irriskcr "
            "WHERE ncr_stress_no = 0 "
            "GROUP BY std_date "
            "ORDER BY std_date"
        ),
    },
    {
        "question": "CCF 그룹별 신용환산액 합계",
        "sql": (
            "SELECT ccf_grp_nm, SUM(crdt_chng_amt) AS total_chng "
            "FROM td_irriskcr "
            "WHERE ncr_stress_no = 0 AND ccf_grp_nm IS NOT NULL "
            "GROUP BY ccf_grp, ccf_grp_nm "
            "ORDER BY total_chng DESC"
        ),
    },
    # ── td_irriskmr ───────────────────────────────────────────
    {
        "question": "시장위험 유형별 위험액 합계 (주식·금리·외환)",
        "sql": (
            "SELECT "
            "  SUM(st_specific_risk_amt + st_gen_risk_amt)    AS stock_risk, "
            "  SUM(ir_specific_risk_amt + ir_gen_risk_amt)    AS ir_risk, "
            "  SUM(fx_curr_risk_amt + fx_gold_risk_amt)       AS fx_risk "
            "FROM td_irriskmr "
            "WHERE ncr_stress_no = 0"
        ),
    },
    {
        "question": "주식 개별위험 및 일반위험액 상위 포지션",
        "sql": (
            "SELECT item_name, st_specific_risk_amt, st_gen_risk_amt "
            "FROM td_irriskmr "
            "WHERE ncr_stress_no = 0 "
            "  AND (st_specific_risk_amt > 0 OR st_gen_risk_amt > 0) "
            "ORDER BY st_specific_risk_amt DESC "
            "LIMIT 10"
        ),
    },
    {
        "question": "기준일자별 시장위험액 추이",
        "sql": (
            "SELECT std_date, "
            "       SUM(st_specific_risk_amt + st_gen_risk_amt)  AS stock_risk, "
            "       SUM(ir_specific_risk_amt + ir_gen_risk_amt)  AS ir_risk, "
            "       SUM(fx_curr_risk_amt + fx_gold_risk_amt)     AS fx_risk "
            "FROM td_irriskmr "
            "WHERE ncr_stress_no = 0 "
            "GROUP BY std_date "
            "ORDER BY std_date"
        ),
    },
    {
        "question": "옵션 감마·베가 위험액 합계",
        "sql": (
            "SELECT SUM(opt_gamma_risk_amt) AS gamma_risk, "
            "       SUM(opt_vega_risk_amt)  AS vega_risk "
            "FROM td_irriskmr "
            "WHERE ncr_stress_no = 0"
        ),
    },
    {
        "question": "NCR 금리그룹별 금리일반위험액",
        "sql": (
            "SELECT ncr_ir_grp_nm, SUM(ir_gen_risk_amt) AS total_ir_gen_risk "
            "FROM td_irriskmr "
            "WHERE ncr_stress_no = 0 AND ncr_ir_grp_nm IS NOT NULL "
            "GROUP BY ncr_ir_grp_gbn, ncr_ir_grp_nm "
            "ORDER BY total_ir_gen_risk DESC"
        ),
    },
    # ── 복합 쿼리 ─────────────────────────────────────────────
    {
        "question": "NCR 산출값과 시장위험액을 포트폴리오별로 비교",
        "sql": (
            "SELECT n.port_no, "
            "       SUM(n.prod_val)   AS ncr_val, "
            "       SUM(m.st_specific_risk_amt + m.st_gen_risk_amt "
            "           + m.ir_specific_risk_amt + m.ir_gen_risk_amt) AS mkt_risk "
            "FROM td_irncr n "
            "JOIN td_irriskmr m "
            "  ON n.std_date = m.std_date "
            "  AND n.org_code = m.org_code "
            "  AND n.port_no  = m.port_no "
            "  AND n.ncr_stress_no = m.ncr_stress_no "
            "WHERE n.ncr_stress_no = 0 "
            "GROUP BY n.port_no "
            "ORDER BY ncr_val DESC"
        ),
    },
]


def train_golden_sql():
    print("[3/3] Golden SQL 학습...")
    ok = 0
    for pair in GOLDEN_SQL:
        try:
            vn.train(question=pair["question"], sql=pair["sql"])
            print(f"  [SQL] {pair['question'][:50]}")
            ok += 1
        except Exception as e:
            print(f"  [SQL] 오류 ({pair['question'][:30]}): {e}")
    print(f"  → {ok}/{len(GOLDEN_SQL)}개 완료")


# ── 실행 ──────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=== NCR 테이블 증분 학습 시작 ===\n")
    train_ddl()
    print()
    train_documentation()
    print()
    train_golden_sql()
    print("\n=== 학습 완료 ===")
