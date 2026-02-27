# insideBi 비즈니스 도메인 용어집

## 데이터베이스 개요
- insideBi는 금융기관의 리스크관리 BI 솔루션입니다.
- 기준일: 2026년 2월 27일
- 모든 금액 단위: 억원 (KRW 100 million = 1억원)

## 핵심 리스크 지표 (KRI)

### 신용리스크 (Credit Risk)
- **NPL (Non-Performing Loan, 부실여신비율)**: 총여신 대비 부실채권(고정이하여신) 비율. 낮을수록 건전. 현재 1.82%. 경보기준: 주의 1.5%, 경고 2.0%, 위험 3.0%
- **PD (Probability of Default, 부도율)**: 차주가 부도날 확률. 현재 평균 1.24%
- **LGD (Loss Given Default, 부도시손실률)**: 부도 발생 시 회수되지 않는 비율. 현재 42.3%
- **EAD (Exposure at Default, 부도시익스포저)**: 부도 발생 시 노출 금액. 현재 185,420억원
- **EL (Expected Loss, 기대손실)**: PD × LGD × EAD. 현재 972억원
- **UL (Unexpected Loss, 비기대손실)**: 통계적 손실 변동성. 현재 3,240억원
- **RWA (Risk-Weighted Assets, 위험가중자산)**: 자본 적정성 계산 기준. 현재 98,350억원
- **충당금 적립률**: 부실여신 대비 충당금 비율. 현재 87.1%
- **net_npl (순 NPL 비율)**: 충당금 차감 후 NPL 비율. 현재 0.24%

### 시장리스크 (Market Risk)
- **VaR (Value at Risk, 최대손실추정치)**: 99% 신뢰수준, 1영업일 기준 최대 예상 손실. VaR 한도는 1,500억원. 현재 1,250억원 (한도 대비 83.3%)
- **PnL (Profit and Loss, 일별 손익)**: 당일 거래 손익. var_trend 테이블의 pnl 컬럼
- **스트레스 테스트**: 극단적 시나리오 하의 손실 추정. stress_scenarios 테이블
- **그리스 (Greeks)**: 파생상품 민감도 지표 (delta=680억, gamma=-42, vega=890, rho=125)

### 유동성리스크 (Liquidity Risk)
- **LCR (Liquidity Coverage Ratio, 유동성커버리지비율)**: 30일간 순현금유출 대비 고유동성자산(HQLA) 비율. 규제 최소 100%. 현재 142.3%
- **NSFR (Net Stable Funding Ratio, 순안정자금조달비율)**: 1년 이상 안정적 자금조달 비율. 규제 최소 100%. 현재 118.7%
- **HQLA (High-Quality Liquid Assets, 고유동성자산)**: 즉시 현금화 가능 자산. 현재 44,980억원
- **만기갭 (Maturity Gap)**: 자산과 부채의 만기 불일치. 음수(-)는 부채 초과 = 유동성 위험
- **유동성 버퍼**: 가용 유동성(available)이 필요 유동성(required)을 충분히 상회해야 건전
- **조달 구조 안정성**: high(고정예금/채권) > medium(외화예금) > low(콜머니/RP)

### BIS 자기자본비율
- **BIS 비율**: 위험가중자산 대비 자기자본 비율. 규제 최소 8%, 권고 12%
- stress_scenarios 테이블의 bis_after: 시나리오 발생 후 예상 BIS 비율

## 테이블별 설명

| 테이블명 | 설명 | 주요 컬럼 |
|---|---|---|
| npl_trend | NPL 월별 추이 (12개월) | month, npl, substandard, doubtful, loss |
| credit_grades | 신용등급별 익스포저 (7등급) | grade, amount, pct, count |
| sector_exposure | 업종별 익스포저 (8개 업종) | sector, amount, pct, pd |
| concentration | 집중도 분석 (버블차트) | name, x(PD), y(비중%), z(익스포저 조원) |
| npl_summary | NPL 현황 요약 (1행) | total_loan, npl_ratio, provision_ratio |
| pd_lgd_ead | 신용리스크 파라미터 (1행) | pd, lgd, ead, expected_loss, rwa |
| var_trend | VaR 일별 시계열 (~170행) | date, var, pnl, limit |
| stress_scenarios | 스트레스 시나리오 (6개) | name, credit_loss, market_loss, total, bis_after |
| sensitivity | 리스크 민감도 (6개 요인) | factor, value |
| var_summary | VaR 현황 요약 (1행) | current, limit_val, utilization, breach_count30d |
| lcr_nsfr_trend | LCR/NSFR 월별 추이 (12개월) | month, lcr, nsfr, hqla, outflow |
| maturity_gap | 만기갭 분석 (7개 구간) | bucket, assets, liabilities, gap |
| liquidity_buffer | 유동성 버퍼 전망 (5개월) | date, available, required, stress |
| funding_structure | 조달 구조 (7개 원천) | source, amount, pct, stability |
| lcr_gauge | LCR 현황 요약 (1행) | lcr, nsfr, hqla, lcr_threshold |

## 자주 사용하는 쿼리 패턴

- "추이/트렌드" → ORDER BY month 또는 ORDER BY date
- "TOP N" → ORDER BY [컬럼] DESC LIMIT N
- "현재/최신" → ORDER BY month DESC LIMIT 1 또는 스칼라 테이블 직접 조회
- "초과한 날" → WHERE [컬럼] > [기준값]
- "평균" → AVG([컬럼])
- "비중" → pct 컬럼 직접 사용 (이미 % 값)
