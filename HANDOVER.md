# InsightBi 프로젝트 인수인계 문서

> 작성일: 2026-03-13
> 목적: 다른 AI가 작업을 이어받을 수 있도록 현재 상태를 정리

---

## 프로젝트 기본 정보

- **프레임워크**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Recharts
- **DB**: PostgreSQL (localhost:5432/insidebi), 연결 라이브러리: `pg`
- **Dev 서버**: `npm run dev` (포트 3000~3003 순차 할당)
- **패키지명**: `insight-bi`
- **Git remote**: https://github.com/LeeJaehyuk1/insideBi.git

---

## 현재 작업 상태 (이번 세션에서 완료된 내용)

### 완료된 Phase 1~3 (Metabase 스타일 구현)
- **Phase 1**: 필터 기능 — StringFilterPicker / NumberFilterPicker / DateFilterPicker / between 연산자 / FilterPanel pill 바
- **Phase 2**: 요약 기능 — 복수 집계(AggPickerPopover) / 복수 GROUP BY(BreakoutPickerPopover) / applyAggregations
- **Phase 3**: 시각화 — ChartTypeSelector / ChartSettingsSidebar / VizSettings

### 이번 세션에서 완료된 주요 내역
- **NoCodeBuilder 수정 (결과 뷰 및 컴포넌트 마이그레이션 방화)**: 
  - 결과 화면에 `FilterPanel` 연동 (`src/components/questions/FilterPanel.tsx` 사용) 완료
  - `VizSettingsPanel` 하단에 `<Button onClick={onDone}>완료</Button>` 추가로 `VizPickerPanel`과 UX 통일
  - `ChartTypeSelector` 내 `Set` 이터레이션 관련 TypeScript 빌드 에러 (`Array.from(new Set(...))` 방식으로) 조치 완료
- **Phase 4: SQL 에디터(SqlEditor) 시각화 연동 (Metabase 스타일)**
  - 기존 자체 개발된 차트 선택기(`ChartTypePanel`) 폐기
  - `NoCodeBuilder`의 기능들(`VizPickerPanel`, `VizSettingsPanel`)을 `export`하여 `SqlEditor`에서 수입해 사용
  - 쿼리 실행 결과(`QueryResult`)를 NoCodeBuilder 규격에 맞는 Data format으로 매핑
  - `ResultChart`를 통한 공통 렌더링 도입

---

### 새로 추가된 파일들
```
src/components/questions/ChartTypeSelector.tsx   (새 파일)
src/components/questions/ChartSettingsSidebar.tsx (새 파일)
src/components/questions/FilterPanel.tsx          (새 파일)
src/lib/db.ts                                     (새 파일 - PostgreSQL pool)
src/app/api/db-query/route.ts                     (새 파일)
src/app/api/db-columns/route.ts                   (새 파일)
METABASE_IMPLEMENTATION.md                        (진행 현황 추적)
```

### 수정된 주요 파일들
- `src/components/questions/NoCodeBuilder.tsx` — 대규모 리팩터링 (이번 세션 핵심)
- `src/components/questions/FilterPicker.tsx` — 타입별 필터 피커
- `src/lib/query-engine.ts` — 실제 PostgreSQL 쿼리 실행
- `src/lib/table-columns.ts` — getColumnsForTableAsync 추가
- `src/types/query.ts` — between 연산자, value2 필드 추가

---

## NoCodeBuilder.tsx 현재 구현 상태

### 새로 추가된 상태 변수
```typescript
type EditMode = "builder" | "result";
type VizPanelMode = "none" | "picker" | "settings";
type ResultDisplayMode = "table" | "chart";

const [editMode, setEditMode] = React.useState<EditMode>("builder");
const [vizPanelMode, setVizPanelMode] = React.useState<VizPanelMode>("none");
const [resultDisplayMode, setResultDisplayMode] = React.useState<ResultDisplayMode>("table");
```

### 렌더링 분기 로직
```
showTablePicker && !hasTable → TablePickerModal (초기 테이블 선택)
hasResult && editMode === "result" → 결과 뷰 (풀스크린)
else → 빌더 뷰
```

### 결과 뷰 레이아웃
```
<div style={{ height: "calc(100vh - 56px)" }}>  // TopNav가 h-14(56px)
  <TopToolbar />       // 필터, Σ요약, 편집기, 저장 버튼
  <div className="flex flex-1 min-h-0">
    {vizPanelMode !== "none" && <LeftPanel width="260px" />}  // picker 또는 settings
    <MainContent />    // ResultTable 또는 ResultChart
  </div>
  <BottomBar />        // 시각화 버튼 + 표/차트 토글 + n행
</div>
```

### 새로 추가된 인라인 컴포넌트
- `VizPickerPanel` — 차트 타입 선택 그리드 + 완료 버튼
- `VizSettingsPanel` — 차트 설정 (표시/축/데이터 탭)

---

## 확인이 필요한 이슈 / TODO

### 1. TypeScript 기존 에러
```
src/components/questions/ChartTypeSelector.tsx(49,14): error TS2802:
Type 'Set<ChartType>' can only be iterated through when using '--downlevelIteration'
```
- `getSensibleCharts` 함수에서 `[...new Set(sensible)]` 사용
- `tsconfig.json`에 `"downlevelIteration": true` 추가하거나 `Array.from(new Set(sensible))` 으로 변경

### 2. NoCodeBuilder 결과 뷰 검증 필요
이번 세션에서 작성한 코드가 실제로 UI에서 제대로 동작하는지 아직 브라우저에서 확인하지 못했음.
- 결과 뷰 높이 (`calc(100vh - 56px)`) - TopNav h-14 기준
- 차트 타입 클릭 시 picker → settings 전환 흐름
- 완료 버튼으로 패널 닫기
- 편집기 버튼으로 빌더 뷰 복귀

### 3. FilterPanel 미사용
`FilterPanel` 컴포넌트가 import에서 제거됨 (결과 뷰에서 제거). 필요하면 결과 뷰 상단 필터 영역에 다시 추가 가능.

---

## 개발 환경 설정

### 환경변수 (.env.local)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/insidebi
```

### 개발 서버 시작
```bash
cd D:\insideBi
npm run dev
```

### 기존 Node 프로세스 종료 (포트 충돌 시)
```powershell
Get-Process -Name node | Stop-Process -Force
```

---

## 주요 라우트

| 경로 | 설명 |
|------|------|
| `/questions/nocode` | NoCodeBuilder (이번 작업 핵심) |
| `/questions/nocode?dataset={tableId}` | 특정 테이블로 NoCodeBuilder 오픈 |
| `/browse` | DB 목록 |
| `/browse/{dbId}/{tableId}` | 테이블 상세 |
| `/collections` | 컬렉션 목록 |
| `/dashboards` | 대시보드 목록 |

---

## localStorage 키

| 키 | 용도 |
|----|------|
| `insightbi_questions_v1` | 저장된 질문 목록 |
| `insightbi_dashboards_v1` | 대시보드 목록 |
| `insightbi_collection_folders_v2` | 컬렉션 폴더 |

---

## 참고 파일

- `METABASE_IMPLEMENTATION.md` — Phase 1~3 진행 현황
- `src/components/questions/NoCodeBuilder.tsx` — 핵심 파일 (약 900줄)
- `src/components/questions/ChartTypeSelector.tsx` — CHART_DEFS export (VizPickerPanel에서 사용)
- `src/components/questions/ChartSettingsSidebar.tsx` — VizSettings 타입 export
