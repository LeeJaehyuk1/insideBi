"""
migrate.py – mock-data 값을 SQLite insidebi.db 로 마이그레이션
실행: python db/migrate.py
"""
import sqlite3
import os
import random
from datetime import date, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "insidebi.db")


def generate_var_series():
    """250 거래일치 VaR 시계열 생성 (market-risk.ts와 동일 로직)"""
    rows = []
    today = date(2026, 2, 26)
    var_ = 1150.0
    limit = 1500
    random.seed(42)  # 재현성
    for i in range(249, -1, -1):
        d = today - timedelta(days=i)
        if d.weekday() >= 5:  # 주말 제외
            continue
        var_ += (random.random() - 0.48) * 40
        var_ = max(800, min(1480, var_))
        pnl = (random.random() - 0.45) * 400 - 50
        rows.append((d.isoformat(), round(var_), round(pnl), limit))
    return rows


def migrate(conn: sqlite3.Connection):
    cur = conn.cursor()

    # ── 1. npl_trend ─────────────────────────────────────────
    cur.execute("DROP TABLE IF EXISTS npl_trend")
    cur.execute("""
        CREATE TABLE npl_trend (
            month       TEXT PRIMARY KEY,
            npl         REAL,
            substandard REAL,
            doubtful    REAL,
            loss        REAL
        )
    """)
    npl_rows = [
        ("2025-03", 1.52, 0.92, 0.41, 0.19),
        ("2025-04", 1.55, 0.94, 0.42, 0.19),
        ("2025-05", 1.58, 0.95, 0.43, 0.20),
        ("2025-06", 1.61, 0.97, 0.44, 0.20),
        ("2025-07", 1.64, 0.98, 0.45, 0.21),
        ("2025-08", 1.67, 1.00, 0.45, 0.22),
        ("2025-09", 1.70, 1.02, 0.46, 0.22),
        ("2025-10", 1.72, 1.03, 0.47, 0.22),
        ("2025-11", 1.75, 1.05, 0.47, 0.23),
        ("2025-12", 1.78, 1.07, 0.48, 0.23),
        ("2026-01", 1.80, 1.08, 0.48, 0.24),
        ("2026-02", 1.82, 1.09, 0.49, 0.24),
    ]
    cur.executemany("INSERT INTO npl_trend VALUES (?,?,?,?,?)", npl_rows)

    # ── 2. credit_grades ──────────────────────────────────────
    cur.execute("DROP TABLE IF EXISTS credit_grades")
    cur.execute("""
        CREATE TABLE credit_grades (
            grade  TEXT PRIMARY KEY,
            amount REAL,
            count  INTEGER,
            pct    REAL
        )
    """)
    grade_rows = [
        ("AAA",    24580, 328,   13.3),
        ("AA",     38920, 612,   21.0),
        ("A",      45230, 1842,  24.4),
        ("BBB",    32180, 4231,  17.4),
        ("BB",     25640, 8562,  13.8),
        ("B",      13280, 12840,  7.2),
        ("CCC이하",  5590, 6218,   3.0),
    ]
    cur.executemany("INSERT INTO credit_grades VALUES (?,?,?,?)", grade_rows)

    # ── 3. sector_exposure ────────────────────────────────────
    cur.execute("DROP TABLE IF EXISTS sector_exposure")
    cur.execute("""
        CREATE TABLE sector_exposure (
            sector TEXT PRIMARY KEY,
            amount REAL,
            pct    REAL,
            pd     REAL
        )
    """)
    sector_rows = [
        ("제조업",      42850, 23.1, 1.12),
        ("부동산",      38920, 21.0, 2.31),
        ("도소매",      24680, 13.3, 1.85),
        ("금융서비스",   22140, 11.9, 0.48),
        ("건설업",      18560, 10.0, 2.67),
        ("IT/통신",     15230,  8.2, 0.92),
        ("운수/물류",   12840,  6.9, 1.43),
        ("기타",        10200,  5.5, 1.78),
    ]
    cur.executemany("INSERT INTO sector_exposure VALUES (?,?,?,?)", sector_rows)

    # ── 4. concentration ──────────────────────────────────────
    cur.execute("DROP TABLE IF EXISTS concentration")
    cur.execute("""
        CREATE TABLE concentration (
            name TEXT PRIMARY KEY,
            x    REAL,
            y    REAL,
            z    REAL
        )
    """)
    conc_rows = [
        ("제조업",    1.12, 23.1, 42.85),
        ("부동산",    2.31, 21.0, 38.92),
        ("도소매",    1.85, 13.3, 24.68),
        ("금융서비스", 0.48, 11.9, 22.14),
        ("건설업",    2.67, 10.0, 18.56),
        ("IT/통신",   0.92,  8.2, 15.23),
        ("운수/물류", 1.43,  6.9, 12.84),
        ("기타",      1.78,  5.5, 10.20),
    ]
    cur.executemany("INSERT INTO concentration VALUES (?,?,?,?)", conc_rows)

    # ── 5. npl_summary (scalar) ───────────────────────────────
    cur.execute("DROP TABLE IF EXISTS npl_summary")
    cur.execute("""
        CREATE TABLE npl_summary (
            total_loan       REAL,
            npl_amount       REAL,
            npl_ratio        REAL,
            substandard      REAL,
            doubtful         REAL,
            loss             REAL,
            provision_amount REAL,
            provision_ratio  REAL,
            net_npl          REAL
        )
    """)
    cur.execute("INSERT INTO npl_summary VALUES (?,?,?,?,?,?,?,?,?)",
                (185420, 3375, 1.82, 2019, 907, 449, 2940, 87.1, 0.24))

    # ── 6. pd_lgd_ead (scalar) ───────────────────────────────
    cur.execute("DROP TABLE IF EXISTS pd_lgd_ead")
    cur.execute("""
        CREATE TABLE pd_lgd_ead (
            pd               REAL,
            lgd              REAL,
            ead              REAL,
            expected_loss    REAL,
            unexpected_loss  REAL,
            rwa              REAL
        )
    """)
    cur.execute("INSERT INTO pd_lgd_ead VALUES (?,?,?,?,?,?)",
                (1.24, 42.3, 185420, 972, 3240, 98350))

    # ── 7. var_trend ─────────────────────────────────────────
    cur.execute("DROP TABLE IF EXISTS var_trend")
    cur.execute("""
        CREATE TABLE var_trend (
            date      TEXT PRIMARY KEY,
            var       REAL,
            pnl       REAL,
            var_limit REAL
        )
    """)
    cur.executemany("INSERT INTO var_trend VALUES (?,?,?,?)", generate_var_series())

    # ── 8. stress_scenarios ──────────────────────────────────
    cur.execute("DROP TABLE IF EXISTS stress_scenarios")
    cur.execute("""
        CREATE TABLE stress_scenarios (
            name          TEXT PRIMARY KEY,
            credit_loss   REAL,
            market_loss   REAL,
            liquidity_loss REAL,
            total         REAL,
            bis_after     REAL
        )
    """)
    stress_rows = [
        ("글로벌 금융위기(2008년 유형)",  8420, 4850, 1200, 14470, 11.8),
        ("코로나19(2020년 유형)",         5680, 6320,  980, 12980, 12.4),
        ("금리 급등(+300bp)",             2340, 8960,  450, 11750, 12.8),
        ("부동산 폭락(-30%)",             9840, 2180,  680, 12700, 12.5),
        ("환율 급등(+20%)",               1250, 5640,  320,  7210, 13.9),
        ("복합 위기 시나리오",           12480, 9230, 2100, 23810,  9.2),
    ]
    cur.executemany("INSERT INTO stress_scenarios VALUES (?,?,?,?,?,?)", stress_rows)

    # ── 9. sensitivity ───────────────────────────────────────
    cur.execute("DROP TABLE IF EXISTS sensitivity")
    cur.execute("""
        CREATE TABLE sensitivity (
            factor    TEXT PRIMARY KEY,
            value     REAL,
            full_mark REAL
        )
    """)
    sens_rows = [
        ("금리리스크",   85, 100),
        ("환율리스크",   72, 100),
        ("주식리스크",   58, 100),
        ("신용스프레드", 67, 100),
        ("원자재리스크", 34, 100),
        ("변동성리스크", 61, 100),
    ]
    cur.executemany("INSERT INTO sensitivity VALUES (?,?,?)", sens_rows)

    # ── 10. var_summary (scalar) ─────────────────────────────
    cur.execute("DROP TABLE IF EXISTS var_summary")
    cur.execute("""
        CREATE TABLE var_summary (
            current        REAL,
            limit_val      REAL,
            utilization    REAL,
            avg_last20     REAL,
            max_last20     REAL,
            breach_count30d INTEGER,
            delta          REAL,
            gamma          REAL,
            vega           REAL,
            rho            REAL
        )
    """)
    cur.execute("INSERT INTO var_summary VALUES (?,?,?,?,?,?,?,?,?,?)",
                (1250, 1500, 83.3, 1198, 1385, 0, 680, -42, 890, 125))

    # ── 11. lcr_nsfr_trend ───────────────────────────────────
    cur.execute("DROP TABLE IF EXISTS lcr_nsfr_trend")
    cur.execute("""
        CREATE TABLE lcr_nsfr_trend (
            month   TEXT PRIMARY KEY,
            lcr     REAL,
            nsfr    REAL,
            hqla    REAL,
            outflow REAL
        )
    """)
    lcr_rows = [
        ("2025-03", 158.2, 124.5, 48200, 30470),
        ("2025-04", 155.8, 123.2, 47800, 30680),
        ("2025-05", 153.4, 122.8, 47350, 30870),
        ("2025-06", 151.2, 122.1, 46980, 31070),
        ("2025-07", 149.8, 121.4, 46720, 31190),
        ("2025-08", 148.3, 120.8, 46340, 31250),
        ("2025-09", 147.1, 120.3, 46120, 31360),
        ("2025-10", 145.9, 119.8, 45840, 31420),
        ("2025-11", 144.5, 119.2, 45560, 31510),
        ("2025-12", 143.8, 118.9, 45280, 31490),
        ("2026-01", 143.1, 118.9, 45120, 31530),
        ("2026-02", 142.3, 118.7, 44980, 31610),
    ]
    cur.executemany("INSERT INTO lcr_nsfr_trend VALUES (?,?,?,?,?)", lcr_rows)

    # ── 12. maturity_gap ─────────────────────────────────────
    cur.execute("DROP TABLE IF EXISTS maturity_gap")
    cur.execute("""
        CREATE TABLE maturity_gap (
            bucket      TEXT PRIMARY KEY,
            assets      REAL,
            liabilities REAL,
            gap         REAL
        )
    """)
    gap_rows = [
        ("1일이내",   18420, 22840, -4420),
        ("1주이내",   12680, 18340, -5660),
        ("1개월이내", 24850, 28920, -4070),
        ("3개월이내", 32480, 29840,  2640),
        ("6개월이내", 28640, 24180,  4460),
        ("1년이내",   35920, 28460,  7460),
        ("1년초과",   98420, 99630, -1210),
    ]
    cur.executemany("INSERT INTO maturity_gap VALUES (?,?,?,?)", gap_rows)

    # ── 13. liquidity_buffer ─────────────────────────────────
    cur.execute("DROP TABLE IF EXISTS liquidity_buffer")
    cur.execute("""
        CREATE TABLE liquidity_buffer (
            date      TEXT PRIMARY KEY,
            available REAL,
            required  REAL,
            stress    REAL
        )
    """)
    buf_rows = [
        ("2026-02", 44980, 31610, 52840),
        ("2026-03", 43200, 32100, 53200),
        ("2026-04", 42800, 32400, 53600),
        ("2026-05", 42500, 32600, 54100),
        ("2026-06", 41800, 33000, 54500),
    ]
    cur.executemany("INSERT INTO liquidity_buffer VALUES (?,?,?,?)", buf_rows)

    # ── 14. funding_structure ────────────────────────────────
    cur.execute("DROP TABLE IF EXISTS funding_structure")
    cur.execute("""
        CREATE TABLE funding_structure (
            source    TEXT PRIMARY KEY,
            amount    REAL,
            pct       REAL,
            stability TEXT
        )
    """)
    fund_rows = [
        ("원화예금", 142580, 48.2, "high"),
        ("외화예금",  28420,  9.6, "medium"),
        ("발행채권",  48640, 16.4, "high"),
        ("콜머니",    8920,  3.0, "low"),
        ("RP매도",   15680,  5.3, "low"),
        ("자기자본",  28480,  9.6, "high"),
        ("기타",      23280,  7.9, "medium"),
    ]
    cur.executemany("INSERT INTO funding_structure VALUES (?,?,?,?)", fund_rows)

    # ── 15. lcr_gauge (scalar) ───────────────────────────────
    cur.execute("DROP TABLE IF EXISTS lcr_gauge")
    cur.execute("""
        CREATE TABLE lcr_gauge (
            lcr           REAL,
            nsfr          REAL,
            hqla          REAL,
            net_outflow   REAL,
            level1        REAL,
            level2a       REAL,
            level2b       REAL,
            lcr_threshold REAL,
            nsfr_threshold REAL
        )
    """)
    cur.execute("INSERT INTO lcr_gauge VALUES (?,?,?,?,?,?,?,?,?)",
                (142.3, 118.7, 44980, 31610, 38420, 4820, 1740, 100, 100))

    conn.commit()
    print(f"[migrate] DB 생성 완료 → {DB_PATH}")
    tables = cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
    for t in tables:
        cnt = cur.execute(f"SELECT COUNT(*) FROM {t[0]}").fetchone()[0]
        print(f"  {t[0]:25s} {cnt} rows")


if __name__ == "__main__":
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    migrate(conn)
    conn.close()
