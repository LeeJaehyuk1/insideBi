"""
create_td_irncr.py - TD_IRNCR 테이블 생성
실행: python db/create_td_irncr.py
"""
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DDL = """
DROP TABLE IF EXISTS td_irncr;
CREATE TABLE td_irncr (
    std_date        CHAR(8)         NOT NULL,
    org_code        VARCHAR(6)      NOT NULL,
    con_sep_clcd    VARCHAR(1)      NOT NULL,
    ncr_stress_no   NUMERIC(20,0)   NOT NULL,
    port_no         NUMERIC(20,0)   NOT NULL,
    obj_dtl_cd      VARCHAR(100)    NOT NULL,
    item_lclas_cd   VARCHAR(2)      NOT NULL,
    item_mclas_cd   VARCHAR(2)      NOT NULL,
    item_sclas_cd   VARCHAR(2)      NOT NULL,
    item_dtl_cd     VARCHAR(2)      NOT NULL,
    item_lclas_nm   VARCHAR(100),
    item_mclas_nm   VARCHAR(100),
    item_sclas_nm   VARCHAR(100),
    item_dtl_nm     VARCHAR(100),
    prod_val        NUMERIC(30,13),
    dlmn_eno        VARCHAR(9),
    dl_tm           TIMESTAMP,
    PRIMARY KEY (std_date, org_code, con_sep_clcd, ncr_stress_no, port_no,
                 obj_dtl_cd, item_lclas_cd, item_mclas_cd, item_sclas_cd, item_dtl_cd)
);
"""

COLUMN_COMMENTS = {
    "std_date":     "기준일자",
    "org_code":     "사무소코드",
    "con_sep_clcd": "연결별도구분코드",
    "ncr_stress_no":"NCR스트레스번호",
    "port_no":      "포트폴리오번호",
    "obj_dtl_cd":   "대상상세코드",
    "item_lclas_cd":"항목대분류코드",
    "item_mclas_cd":"항목중분류코드",
    "item_sclas_cd":"항목소분류코드",
    "item_dtl_cd":  "항목상세분류코드",
    "item_lclas_nm":"항목대분류명",
    "item_mclas_nm":"항목중분류명",
    "item_sclas_nm":"항목소분류명",
    "item_dtl_nm":  "항목상세분류명",
    "prod_val":     "산출값",
    "dlmn_eno":     "처리자",
    "dl_tm":        "처리일시",
}

if __name__ == "__main__":
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()

    cur.execute(DDL)
    cur.execute("COMMENT ON TABLE td_irncr IS 'NCR 산출 데이터'")
    for col, cmt in COLUMN_COMMENTS.items():
        cur.execute(f"COMMENT ON COLUMN td_irncr.{col} IS %s", (cmt,))

    conn.commit()

    cur.execute(
        "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='td_irncr'"
    )
    print(f"td_irncr {cur.fetchone()[0]} columns created")
    conn.close()
