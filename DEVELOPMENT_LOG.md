# InsightBi 개발 작업 로그

> **프로젝트**: 금융 리스크관리 BI 솔루션 (Metabase 스타일)
> **스택**: Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Recharts
> **저장소**: https://github.com/LeeJaehyuk1/insideBi.git
> **최종 업데이트**: 2026-03-16

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [전체 라우트 구조](#2-전체-라우트-구조)
3. [단계별 작업 내역](#3-단계별-작업-내역)
4. [주요 컴포넌트 설명](#4-주요-컴포넌트-설명)
5. [데이터 레이어](#5-데이터-레이어)
6. [알려진 이슈 및 해결 내역](#6-알려진-이슈-및-해결-내역)

---

## 1. 프로젝트 개요

InsightBi는 금융 리스크관리 데이터를 시각화하는 BI(Business Intelligence) 대시보드 솔루션입니다.
Metabase의 UX/UI 패턴을 참고하여 설계되었으며, 다음 4가지 핵심 기능을 제공합니다.

| 기능 | 설명 |
|------|------|
| **질문 만들기** | NoCode 빌더 또는 SQL 에디터로 데이터 조회 |
| **대시보드** | 탭별 위젯 배치 및 저장 |
| **컬렉션** | 저장된 질문/대시보드 폴더 관리 |
| **탐색(Browse)** | DB → 테이블 → 상세 데이터 탐색 |

---

## 2. 전체 라우트 구조

```
/                          → MetaHome (AI 검색 + 주요 리스크 지표 + 즐겨찾기 + 최근방문)
/login                     → 로그인 페이지
/credit-risk               → 신용리스크 대시보드
/market-risk               → 시장리스크 대시보드
/liquidity-risk            → 유동성리스크 대시보드
/ncr-risk                  → NCR 리스크 대시보드
/questions                 → 저장된 질문 목록
/questions/pick            → Metabase 스타일 테이블 피커 모달
/questions/new             → SQL 에디터
/questions/nocode          → NoCode 비주얼 쿼리 빌더
/questions/[id]            → 질문 상세 (NotebookEditor)
/dashboards                → 대시보드 목록 (DashboardGallery)
/dashboards/new            → 대시보드 에디터 (탭별 독립 위젯)
/builder                   → 워크스페이스 (DnD 빌더)
/browse                    → DB 목록
/browse/[dbId]             → 테이블 목록
/browse/[dbId]/[tableId]   → 테이블 상세 (풀스크린)
/collections               → 우리의 분석 (사이드바 + 테이블 뷰)
/collections/[id]          → 하위 컬렉션
/admin                     → AI 설정
/reports                   → 보고서 목록
/reports/[id]              → 보고서 상세 + PDF 출력
```

---

## 3. 단계별 작업 내역

### Phase 0 · 초기 설계 및 기반 구축

- Next.js 14 App Router 프로젝트 초기화
- Tailwind CSS + shadcn/ui 컴포넌트 수동 셋업
- 4대 리스크(신용/시장/유동성/NCR) 페이지 구현
- Recharts 기반 기본 차트 컴포넌트 구성
- `src/lib/dataset-registry.ts` — 15개 mock 데이터셋 정의
- `src/lib/dataset-schemas/index.ts` — DatasetSchema 15종

---

### Phase 1 · Metabase 스타일 전면 리디자인

**커밋**: `a833150`, `b7b8031`

- **TopNav** 재설계: 홈 / 리스크관리 드롭다운 / 탐색 / 컬렉션 / 새로만들기 드롭다운
- **MetaHome** 구현: AI 자연어 검색, 주요 리스크 KPI, 빠른 시작, 즐겨찾기, 최근 방문
- **DashboardGallery** (`/dashboards`): 카드 그리드 레이아웃
- **CollectionSidebar** + **CollectionTableView** 구현
- **Browse** 페이지 3단계 구조: DB 목록 → 테이블 목록 → 테이블 상세

---

### Phase 2 · 질문 만들기 기능 구현

**커밋**: `6fc0fc8`, `b4e9b21`, `f7cb37e`, `6c24368`

#### SQL 에디터 (`/questions/new`)
- Monaco 스타일 SQL 입력창
- 실행 결과 테이블 미리보기
- 시각화 패널: 차트 타입 선택 + X/Y 축 설정

#### NoCode 빌더 (`/questions/nocode`)
- 상단바: `railway / TableName ℹ️` + SQL 보기 + 저장
- 테이블 pill 버튼 → `TablePickerModal`
- `FilterPicker`: 2단계 팝오버 (컬럼 선택 → 조건 설정)
- 연산자 10종: 같음, 같지않음, 포함, 포함하지않음, 시작함, 끝남, 비어있음, 비어있지않음, ≥, ≤
- `isDbTableId()` 자동 감지로 실제 DB 테이블 ID 처리

#### 테이블 피커 (`/questions/pick`)
- DB 목록 + 테이블 목록 + 최근 항목 탭 구조
- `TablePickerModal` 팝업 형태로도 사용 가능

---

### Phase 3 · 대시보드 에디터 구현

**커밋**: `c8a979c`, `49919c5`, `2a080f0`, `acd15ae`, `3b36109`

#### DashboardEditorClient (`/dashboards/new`)
- **탭 시스템**: 탭별 독립 위젯 상태 (`tabWidgets: Record<tabId, DashWidget[]>`)
- **우측 패널**: 저장된 질문 / 컬렉션 / 데이터 카탈로그 → 위젯 추가
- **위젯 카드**: 차트 타입 변경 드롭다운 + 삭제 버튼 + 호버 액션
- **저장**: `tabData` 포함하여 `useDashboardLibrary`에 저장, 재오픈 시 복원
- **취소/저장** 버튼 (우측 상단)

---

### Phase 4 · 저장 및 컬렉션 연동

**커밋**: `b143128`, `3374e3d`, `1daed26`, `bc957d8`

#### SaveQuestionModal
- 이름 자동 생성 + 비고 + 저장 위치 + 탭 선택 (질문/대시보드)
- `CollectionDashboardPicker` 내장: 찾아보기 (왼쪽 컬렉션 트리 + 오른쪽 항목 목록)

#### useCollectionFolders
- localStorage key: `insightbi_collection_folders_v2`
- `load()` 시 mock 폴더 병합 (신규 폴더 보장)
- `addEntry(folderId, entry)` — 컬렉션에 항목 저장
- Mock 폴더: ROOT_ID(`our-analytics`), PERSONAL_ID(`personal`)

#### useSavedQuestions
- localStorage key: `insightbi_questions_v1`
- `saveQuestion()`, `updateQuestion()`, `deleteQuestion()`

---

### Phase 5 · 시각화 고도화

**커밋**: `3f7c39e`, `a9144c0`

#### ChartSettingsSidebar (VizSettings)
```typescript
interface VizSettings {
  xKey: string;   // X축 컬럼
  yKey: string;   // Y축 컬럼
  color: string;
  showLabels: boolean;
  showLegend: boolean;
  yLabel: string;
  xLabel: string;
}
```

#### SavedQuestion에 vizSettings 저장
- `src/types/question.ts`: `vizSettings?: VizSettings` 추가
- `NoCodeBuilder`, `SqlEditor`, `NotebookEditor` 모두 `vizSettings` 저장/로드

#### WidgetRenderer 차트 개선
- `scatter` 차트 케이스 추가 (ScatterChart + Cell)
- `waterfall`, `bullet` 차트 렌더러 구현
- `GenericChart`: line/area/bar/pie 통합 렌더러

#### NotebookEditor ResultChart 재구현
- vizSettings의 xKey/yKey 적용
- kpi/line/area/bar/pie 각각 올바른 컴포넌트로 분기 렌더링
- color/showLabels/showLegend 적용

---

### Phase 6 · 인증 시스템 구현

**커밋**: `3272fed`

#### RoleContext 확장
```typescript
// 내장 계정
admin  / admin123  → 관리자
editor / edit123   → 편집자
viewer / view123   → 뷰어

// 추가된 상태
isLoggedIn: boolean
hydrated: boolean      // localStorage 복원 완료 여부
login(username, password): boolean
logout(): void
```
- 세션 키: `insightbi_session_v1`

#### 로그인 페이지 (`/login`)
- 아이디/비밀번호 입력 폼
- 데모 계정 표시
- 자체 RoleProvider로 감싸기 (layout 제외)
- 성공 시 `router.push("/")`

#### AuthGuard
- `(dashboard)/layout.tsx`에 삽입
- `hydrated` true가 된 후에만 `isLoggedIn` 검사 → 로그인 안 된 경우 `/login`으로 이동
- hydration 전에는 화면 렌더링 차단 (빈 화면 → 깜빡임 없음)

---

### Phase 7 · KRI 알림 시스템

**커밋**: `3272fed`

#### useAlerts 훅 (`src/hooks/useAlerts.ts`)
- 읽음 상태 관리: localStorage key `insightbi_alerts_read_v1`
- `alerts`, `unreadCount`, `markRead()`, `markAllRead()` 제공

#### TopNav 알림 패널
- 벨 아이콘 클릭 → 드롭다운 알림 목록
- 읽음/안읽음 상태 표시
- "모두 읽음" 버튼
- 로그아웃 버튼 (LogOut 아이콘)

---

### Phase 8 · PDF 내보내기

**커밋**: `3272fed`

- `PrintButton.tsx`: 클릭 시 `document.title`을 날짜 포함 파일명으로 변경 후 `window.print()`
- `globals.css` 인쇄 스타일 추가:
  ```css
  @page { size: A4 portrait; margin: 20mm 15mm; }
  .bg-card, table { break-inside: avoid; }
  ```

---

### Phase 9 · 컬렉션 저장 동기화 버그 수정

**커밋**: `3272fed`

#### 문제
`addEntry` → `setFolders` (비동기) → `router.push` 실행 시, 다음 페이지 렌더링 전에 state 업데이트가 완료되지 않아 저장된 항목이 보이지 않는 문제.

#### 해결
`addEntry`를 React state 대신 localStorage 직접 읽기/쓰기로 재구현 (동기 처리):
```typescript
const addEntry = React.useCallback((folderId, entry) => {
  const current = load();          // localStorage 직접 읽기
  const next = current.map(...);
  save(next);                      // localStorage 직접 쓰기
  setFolders(next);                // UI 동기화
}, []);
```

---

### Phase 10 · useDashboardLibrary 서버 덮어쓰기 버그 수정

#### 문제
앱 마운트 시 `/api/dashboards` 응답이 빈 배열(`[]`)일 때 localStorage의 기존 대시보드가 삭제되는 문제.

#### 해결
서버 응답이 비어있으면 localStorage 데이터 유지:
```typescript
const finalLib = serverLib.length > 0 ? serverLib : local;
```

---

### Phase 11 · 대시보드 위젯 차트/저장 버그 수정 (최신)

#### 버그 1: 차트 타입 질문이 표(table)로 표시되는 문제

**원인 분석**
- `DashWidget` → `toWidgetConfig()` 변환 시 `axisMapping`이 전달되지 않았음
- `CustomDatasetRenderer`는 `axisMapping.y.length > 0` 조건을 만족해야 차트 렌더링
- 조건 불만족 → table fallback으로 항상 표 출력

**수정 내용**

1. `DashWidget` 인터페이스에 `vizSettings`, `axisMapping` 추가
2. `handleAddWidget`에서 `vizSettings`의 xKey/yKey로 `axisMapping` 즉시 파생
3. `toWidgetConfig`에서 `axisMapping`을 `WidgetConfig`에 포함
4. 저장된 질문 클릭 시 `q.vizSettings` 전달
5. `CustomDatasetRenderer`에 자동 파생 fallback 추가 — axisMapping 없어도 데이터 컬럼 타입 분석으로 X(문자열)/Y(숫자) 자동 감지

#### 버그 2: 대시보드 저장 후 잘못된 페이지로 이동

**원인**
- `getFolder("our-analytics")`가 빈 folders state를 참조 → `undefined` 반환
- 결과: 항상 `/dashboards`로 이동

**수정 내용**
```typescript
if (!collectionId || collectionId === "our-analytics") {
  router.push(collectionId ? "/collections" : "/dashboards");
} else {
  router.push(`/collections/${collectionId}`);
}
```

#### 추가 개선
- 우측 패널 컬렉션 섹션: mock `collections` → `useCollectionFolders` 실제 데이터로 교체
- 대시보드 복원 시 `axisMapping` 보존 (재오픈해도 차트 유지)

---

## 4. 주요 컴포넌트 설명

### 레이아웃

| 파일 | 역할 |
|------|------|
| `src/components/layout/TopNav.tsx` | 상단 네비게이션 (메뉴 + 알림 + 로그아웃) |
| `src/app/(dashboard)/layout.tsx` | RoleProvider + AuthGuard + AiPanelProvider |
| `src/app/login/page.tsx` | 로그인 페이지 |

### 질문 만들기

| 파일 | 역할 |
|------|------|
| `src/components/questions/NoCodeBuilder.tsx` | 비주얼 쿼리 빌더 |
| `src/components/questions/SqlEditor.tsx` | SQL 에디터 + 시각화 |
| `src/components/questions/NotebookEditor.tsx` | 저장된 질문 상세/편집 |
| `src/components/questions/FilterPicker.tsx` | 2단계 필터 팝오버 |
| `src/components/questions/SaveQuestionModal.tsx` | 저장 모달 |
| `src/components/questions/ChartSettingsSidebar.tsx` | 차트 설정 사이드바 (VizSettings) |
| `src/components/questions/TablePickerModal.tsx` | 테이블 선택 팝업 |

### 대시보드

| 파일 | 역할 |
|------|------|
| `src/app/(dashboard)/dashboards/new/DashboardEditorClient.tsx` | 대시보드 에디터 (탭 + 위젯) |
| `src/components/builder/WidgetRenderer.tsx` | 위젯 차트 렌더러 |

### 컬렉션

| 파일 | 역할 |
|------|------|
| `src/components/collections/CollectionSidebar.tsx` | 컬렉션 사이드바 |
| `src/components/collections/CollectionTableView.tsx` | 컬렉션 항목 테이블 |
| `src/components/collections/CollectionDashboardPicker.tsx` | 2패널 찾아보기 피커 |

---

## 5. 데이터 레이어

### Hooks

| 훅 | localStorage 키 | 역할 |
|----|----------------|------|
| `useSavedQuestions` | `insightbi_questions_v1` | 질문 CRUD |
| `useCollectionFolders` | `insightbi_collection_folders_v2` | 컬렉션 폴더 CRUD |
| `useDashboardLibrary` | `insightbi_dashboards_v1` | 대시보드 저장/불러오기 |
| `useAlerts` | `insightbi_alerts_read_v1` | KRI 알림 읽음 상태 |
| `RoleContext` | `insightbi_session_v1` | 로그인 세션 |

### API 라우트

| 엔드포인트 | 메서드 | 역할 |
|-----------|-------|------|
| `/api/dashboards` | GET, POST | 대시보드 목록/저장 |
| `/api/dashboards/[name]` | DELETE | 대시보드 삭제 |
| `/api/ask` | POST | AI 자연어 질의 프록시 |
| `/api/briefing` | GET | AI 브리핑 |
| `/api/narrative` | POST | AI 내러티브 |

### Mock 데이터

- `src/lib/db-catalog.ts` — DB/테이블 정의 + td_ir* mock 데이터
- `src/lib/dataset-registry.ts` — 15개 데이터셋
- `src/lib/mock-data/collection-folders.ts` — 초기 컬렉션 폴더 구조

---

## 6. 알려진 이슈 및 해결 내역

| # | 이슈 | 상태 | 해결 방법 |
|---|------|------|----------|
| 1 | 컬렉션 저장 후 항목 미표시 | ✅ 해결 | `addEntry` 동기 localStorage 처리 |
| 2 | 로그인 후 바로 /login으로 튕김 | ✅ 해결 | `hydrated` 플래그로 AuthGuard 타이밍 제어 |
| 3 | 서버 빈 응답이 localStorage 덮어씀 | ✅ 해결 | 서버 응답 비어있으면 local 유지 |
| 4 | x/y축 설정이 저장 안 됨 | ✅ 해결 | `vizSettings`를 `SavedQuestion`에 포함 |
| 5 | 차트 타입 질문이 대시보드에서 표로 표시 | ✅ 해결 | `axisMapping` 파생 후 WidgetConfig 전달 + 자동 감지 fallback |
| 6 | 대시보드 저장 후 잘못된 페이지로 이동 | ✅ 해결 | `our-analytics` → `/collections` 직접 라우팅 |
| 7 | TypeScript `Set<string>` downlevelIteration 오류 | ✅ 해결 | `[...ids]` → `Array.from(ids)` |

---

## AI 백엔드

- **위치**: `ai-backend/main.py`
- **스택**: FastAPI + Vanna + Ollama + ChromaDB
- **엔드포인트**: `/api/ask`, `/api/feedback`, `/api/briefing`, `/api/narrative`
- **필수 환경변수**: `ADMIN_PASSWORD`, `DATABASE_URL`
