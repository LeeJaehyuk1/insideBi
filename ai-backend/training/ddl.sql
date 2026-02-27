-- insideBi SQLite 스키마
-- 모든 amount 단위: 억원 (KRW 100 million)

-- NPL 추이 (월별 부실여신 비율)
CREATE TABLE IF NOT EXISTS npl_trend (
    month       TEXT PRIMARY KEY, -- 기준월 (YYYY-MM)
    npl         REAL,             -- NPL 비율 (%)
    substandard REAL,             -- 고정이하여신 비율 (%)
    doubtful    REAL,             -- 회의여신 비율 (%)
    loss        REAL              -- 추정손실 비율 (%)
);

-- 신용등급별 익스포저
CREATE TABLE IF NOT EXISTS credit_grades (
    grade  TEXT PRIMARY KEY, -- 신용등급 (AAA~CCC이하)
    amount REAL,             -- 익스포저 금액 (억원)
    count  INTEGER,          -- 차주 수
    pct    REAL              -- 비중 (%)
);

-- 업종별 익스포저
CREATE TABLE IF NOT EXISTS sector_exposure (
    sector TEXT PRIMARY KEY, -- 업종명
    amount REAL,             -- 익스포저 금액 (억원)
    pct    REAL,             -- 비중 (%)
    pd     REAL              -- 부도율 PD (%)
);

-- 업종별 집중도 (버블차트용)
CREATE TABLE IF NOT EXISTS concentration (
    name TEXT PRIMARY KEY, -- 업종명
    x    REAL,             -- PD (%)
    y    REAL,             -- 비중 (%)
    z    REAL              -- 익스포저 (조원)
);

-- NPL 요약 (스칼라)
CREATE TABLE IF NOT EXISTS npl_summary (
    total_loan       REAL, -- 총여신 (억원)
    npl_amount       REAL, -- 부실여신 (억원)
    npl_ratio        REAL, -- NPL 비율 (%)
    substandard      REAL, -- 고정 (억원)
    doubtful         REAL, -- 회의 (억원)
    loss             REAL, -- 추정손실 (억원)
    provision_amount REAL, -- 충당금 (억원)
    provision_ratio  REAL, -- 충당금 적립률 (%)
    net_npl          REAL  -- 순 NPL 비율 (%)
);

-- PD/LGD/EAD 요약 (스칼라)
CREATE TABLE IF NOT EXISTS pd_lgd_ead (
    pd              REAL, -- 평균부도율 PD (%)
    lgd             REAL, -- 평균손실률 LGD (%)
    ead             REAL, -- 부도시익스포저 EAD (억원)
    expected_loss   REAL, -- 기대손실 EL (억원)
    unexpected_loss REAL, -- 비기대손실 UL (억원)
    rwa             REAL  -- 위험가중자산 RWA (억원)
);

-- VaR 일별 시계열 (~250 거래일)
CREATE TABLE IF NOT EXISTS var_trend (
    date  TEXT PRIMARY KEY, -- 거래일 (YYYY-MM-DD)
    var   REAL,             -- VaR (억원)
    pnl   REAL,             -- 일별 손익 P&L (억원)
    limit REAL              -- VaR 한도 (억원)
);

-- 스트레스 테스트 시나리오
CREATE TABLE IF NOT EXISTS stress_scenarios (
    name           TEXT PRIMARY KEY, -- 시나리오명
    credit_loss    REAL,             -- 신용손실 (억원)
    market_loss    REAL,             -- 시장손실 (억원)
    liquidity_loss REAL,             -- 유동성손실 (억원)
    total          REAL,             -- 총 손실 (억원)
    bis_after      REAL              -- 시나리오 후 BIS 비율 (%)
);

-- 리스크 민감도
CREATE TABLE IF NOT EXISTS sensitivity (
    factor    TEXT PRIMARY KEY, -- 리스크 요인명
    value     REAL,             -- 민감도 지수 (0~100)
    full_mark REAL              -- 최대값 (항상 100)
);

-- VaR 요약 (스칼라)
CREATE TABLE IF NOT EXISTS var_summary (
    current         REAL,    -- 현재 VaR (억원)
    limit_val       REAL,    -- VaR 한도 (억원)
    utilization     REAL,    -- 한도 사용률 (%)
    avg_last20      REAL,    -- 최근 20일 평균 VaR (억원)
    max_last20      REAL,    -- 최근 20일 최대 VaR (억원)
    breach_count30d INTEGER, -- 최근 30일 한도 초과 횟수
    delta           REAL,    -- 델타 (억원)
    gamma           REAL,    -- 감마
    vega            REAL,    -- 베가
    rho             REAL     -- 로
);

-- LCR/NSFR 월별 추이
CREATE TABLE IF NOT EXISTS lcr_nsfr_trend (
    month   TEXT PRIMARY KEY, -- 기준월 (YYYY-MM)
    lcr     REAL,             -- 유동성커버리지비율 LCR (%)
    nsfr    REAL,             -- 순안정자금조달비율 NSFR (%)
    hqla    REAL,             -- 고유동성자산 HQLA (억원)
    outflow REAL              -- 순현금유출 (억원)
);

-- 만기갭 (자산-부채 만기별)
CREATE TABLE IF NOT EXISTS maturity_gap (
    bucket      TEXT PRIMARY KEY, -- 만기 구간
    assets      REAL,             -- 자산 (억원)
    liabilities REAL,             -- 부채 (억원)
    gap         REAL              -- 갭 = 자산 - 부채 (억원)
);

-- 유동성 버퍼 (월별 전망)
CREATE TABLE IF NOT EXISTS liquidity_buffer (
    date      TEXT PRIMARY KEY, -- 기준월 (YYYY-MM)
    available REAL,             -- 가용 유동성 (억원)
    required  REAL,             -- 필요 유동성 (억원)
    stress    REAL              -- 스트레스 시나리오 필요량 (억원)
);

-- 조달 구조
CREATE TABLE IF NOT EXISTS funding_structure (
    source    TEXT PRIMARY KEY, -- 조달 원천
    amount    REAL,             -- 금액 (억원)
    pct       REAL,             -- 비중 (%)
    stability TEXT              -- 안정성 (high/medium/low)
);

-- LCR 요약 (스칼라)
CREATE TABLE IF NOT EXISTS lcr_gauge (
    lcr            REAL, -- LCR (%)
    nsfr           REAL, -- NSFR (%)
    hqla           REAL, -- HQLA (억원)
    net_outflow    REAL, -- 순현금유출 (억원)
    level1         REAL, -- 레벨1 자산 (억원)
    level2a        REAL, -- 레벨2A 자산 (억원)
    level2b        REAL, -- 레벨2B 자산 (억원)
    lcr_threshold  REAL, -- LCR 규제 최소 (%)
    nsfr_threshold REAL  -- NSFR 규제 최소 (%)
);
