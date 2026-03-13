# Metabase 스타일 구현 계획

## Phase 1 — 필터 기능 개선 ✅
- [x] `StringFilterPicker` — contains / starts / ends / is empty
- [x] `NumberFilterPicker` — = / ≠ / ≥ / ≤ / between (범위 입력)
- [x] `DateFilterPicker` — 날짜 범위 선택 (from~to)
- [x] `FilterPanel` — 결과 상단 pill 바 (클릭 시 수정 팝오버)
- [x] `between` 연산자 DB 쿼리 지원 (BETWEEN ... AND ...)

## Phase 2 — 요약/집계 기능 개선 ✅
- [x] `AggregateStep` — COUNT / SUM / AVG / MIN / MAX pill, 복수 집계 지원
- [x] `AggPickerPopover` — 집계함수 + 대상 컬럼 선택 팝오버
- [x] `BreakoutStep` — GROUP BY 컬럼 pill, 복수 선택
- [x] `BreakoutPickerPopover` — 컬럼 검색 + 선택 팝오버
- [x] `applyAggregations` — 복수 집계 + 복합 GROUP BY 지원
- [ ] `SummarizeSidebar` — 결과 화면 우측 집계 수정 패널 (Phase 3에서 통합)

## Phase 3 — 시각화 기능 개선 ✅
- [x] `ChartTypeSelector` — 데이터 shape 기반 추천/더보기 차트 분류
- [x] `ChartSettingsSidebar` — X/Y축, 색상(프리셋+커스텀), 레이블, 범례 설정
- [x] `VizSettings` — xKey/yKey/color/showLabels/showLegend/xLabel/yLabel
- [x] KPI 차트 타입 지원 (단일 숫자 카드)
- [x] 차트 전환 시 설정 자동 마이그레이션 (kpi/pie 전환 처리)
- [x] `ResultChart` — 설정값 반영 (색상, 레이블, 범례, 축 레이블)

## Phase 4 — SQL 에디터 시각화 연동 (신규) ✅
- [x] `SqlEditor` 내 하드코딩된 자체 차트 설정 패널 제거
- [x] NoCodeBuilder의 `VizPickerPanel`, `VizSettingsPanel` 공통 모듈로 export 및 연동
- [x] `QueryResult` 데이터를 NoCodeBuilder의 설정 패널 규격에 맞게 변환
- [x] 차트/테이블 토글 및 설정 사이드바(`vizPanelMode`) UI를 NoCodeBuilder 결과 뷰와 동일하게 동기화

---

## 진행 현황
- [x] 실제 PostgreSQL DB 연동 (`/api/db-query`, `/api/db-columns`)
- [x] 실행된 쿼리 표시 패널
