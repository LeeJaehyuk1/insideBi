# InsightBi 마이그레이션 문서

## 개요

| 항목 | 내용 |
|---|---|
| 작업일 | 2026-04-01 |
| 목적 | Next.js 14 → React (Vite) + Spring Boot 마이그레이션 |
| 상태 | 빌드 완료, 서버 실행 확인, 런타임 React 버전 충돌 이슈 미해결 |

---

## 아키텍처 변경

### Before
```
Next.js 14 (App Router)
  ├── 프론트엔드 (React 컴포넌트)
  ├── 백엔드 API Routes (/api/*)
  └── PostgreSQL 직접 연결 (pg 라이브러리)

FastAPI (Python) - AI 백엔드 (포트 8000)
```

### After
```
insideBi-client/   ← Vite + React 18 SPA (포트 5173)
insideBi-server/   ← Spring Boot 3.3.5 REST API (포트 8080)
ai-backend/        ← FastAPI (Python) AI 백엔드 (포트 8000, 변경 없음)
```

---

## Phase 1 — Spring Boot 백엔드 (`insideBi-server/`)

### 디렉토리 구조
```
insideBi-server/
├── pom.xml
└── src/main/
    ├── java/com/insidebi/
    │   ├── InsideBiApplication.java
    │   ├── config/
    │   │   ├── AppConfig.java          # RestTemplate, 설정값 주입
    │   │   └── CorsConfig.java         # CORS 설정 (localhost:5173 허용)
    │   ├── controller/
    │   │   ├── QueryController.java    # DB 직접 접근 API
    │   │   ├── AiProxyController.java  # AI 백엔드 프록시
    │   │   └── AdminProxyController.java # 관리자 API + 인증
    │   ├── service/
    │   │   ├── QueryService.java       # SQL 실행, 컬럼 조회
    │   │   ├── AiProxyService.java     # HTTP 프록시 로직
    │   │   └── RateLimiterService.java # 슬라이딩 윈도우 rate limit
    │   └── dto/
    │       ├── DbQueryRequest.java
    │       ├── DbQueryResponse.java
    │       └── ColumnInfo.java
    └── resources/
        ├── application.yml             # 기본 설정
        └── application-dev.yml        # 로컬 개발 설정
```

### API 엔드포인트 매핑

| Next.js API Route | Spring Boot Controller | 설명 |
|---|---|---|
| `POST /api/db-query` | `QueryController` | SELECT 전용 쿼리 실행 |
| `GET /api/db-columns` | `QueryController` | 테이블 컬럼 메타데이터 |
| `POST /api/ask` | `AiProxyController` | AI 질의 (rate limit: 10/min) |
| `GET /api/briefing` | `AiProxyController` | AI 브리핑 |
| `POST /api/narrative` | `AiProxyController` | AI 내러티브 |
| `GET/POST/DELETE /api/chat-history` | `AiProxyController` | 채팅 히스토리 |
| `GET/POST /api/dashboards` | `AiProxyController` | 대시보드 CRUD |
| `DELETE /api/dashboards/{name}` | `AiProxyController` | 대시보드 삭제 |
| `GET/POST/DELETE /api/my-dashboard` | `AiProxyController` | 개인 대시보드 |
| `GET/POST /api/reports` | `AiProxyController` | 보고서 CRUD |
| `GET/PATCH/DELETE /api/reports/{id}` | `AiProxyController` | 보고서 상세 |
| `POST /api/admin/login` | `AdminProxyController` | 관리자 로그인 |
| `GET /api/admin/training` | `AdminProxyController` | 훈련 데이터 조회 |
| `POST /api/admin/training` | `AdminProxyController` | 훈련 데이터 추가 |
| `POST /api/admin/training-delete` | `AdminProxyController` | 훈련 데이터 삭제 |
| `GET/POST /api/admin/feedback*` | `AdminProxyController` | 피드백 관리 |
| `POST /api/admin/ddl-sync` | `AdminProxyController` | DDL 동기화 |
| `GET /api/admin/monitoring` | `AdminProxyController` | 시스템 모니터링 |
| `POST /api/admin/retrain-all` | `AdminProxyController` | 전체 재훈련 |

### 설정 (application-dev.yml)
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/insidebi
    username: postgres
    password: postgres
app:
  ai-backend-url: http://localhost:8000
  admin-password: "1"
  cors-allowed-origins: http://localhost:5173
```

---

## Phase 2 — React 프론트엔드 (`insideBi-client/`)

### 디렉토리 구조
```
insideBi-client/
├── vite.config.ts          # @/ 경로 별칭, /api → :8080 프록시
├── tailwind.config.js      # 기존 테마 그대로 이식
├── tsconfig.app.json       # 경로 별칭, strict 완화
├── .env                    # VITE_API_URL, VITE_AI_API_URL
└── src/
    ├── main.tsx            # BrowserRouter + ThemeProvider
    ├── App.tsx             # React Router v6 전체 라우팅
    ├── index.css           # Tailwind + CSS 변수 (기존 globals.css 이식)
    ├── pages/              # 20개 페이지 컴포넌트 (신규)
    ├── components/         # 기존 컴포넌트 그대로 복사
    ├── hooks/              # 기존 훅 그대로 복사
    ├── lib/                # 기존 유틸/mock 데이터 그대로 복사
    ├── types/              # 기존 타입 정의 그대로 복사
    └── context/            # 기존 Context 그대로 복사
```

### 주요 변환 작업

| Next.js | React (Vite) |
|---|---|
| `"use client"` 지시어 | 제거 (모두 클라이언트) |
| `import Link from "next/link"` | `import { Link } from "react-router-dom"` |
| `<Link href="...">` | `<Link to="...">` |
| `useRouter()` + `router.push()` | `useNavigate()` + `navigate()` |
| `usePathname()` | `useLocation().pathname` |
| `useSearchParams()` (Next.js) | `const [searchParams] = useSearchParams()` (react-router) |
| `{ params }` props (page.tsx) | `useParams()` 훅 |
| `notFound()` | `<Navigate to="..." replace />` |
| `next/dynamic` | `React.lazy` / 직접 import |
| `import Image from "next/image"` | 일반 `<img>` |
| 서버 컴포넌트 (DB 직접 접근) | `useEffect` + API 호출 |
| App Router (`app/` 폴더) | React Router v6 (`<Routes>`) |

### 라우팅 구조
```tsx
<Routes>
  <Route path="/login" element={<LoginPage />} />         // 공개
  <Route element={<DashboardLayout />}>                   // 보호 (AuthGuard)
    <Route path="/" element={<MetaHome />} />
    <Route path="/credit-risk" ... />
    <Route path="/market-risk" ... />
    <Route path="/liquidity-risk" ... />
    <Route path="/ncr-risk" ... />
    <Route path="/dashboards" element={<DashboardsPage />} />
    <Route path="/dashboards/new" element={<DashboardEditorClient />} />
    <Route path="/questions" ... />
    <Route path="/questions/new" ... />
    <Route path="/questions/nocode" ... />
    <Route path="/questions/:id" ... />
    <Route path="/browse" ... />
    <Route path="/browse/:dbId" ... />
    <Route path="/browse/:dbId/:tableId" ... />
    <Route path="/collections" ... />
    <Route path="/collections/:id" ... />
    <Route path="/admin" ... />
    <Route path="/reports" ... />
    <Route path="/reports/:id" ... />
    <Route path="/builder" ... />
  </Route>
</Routes>
```

### 설치된 의존성
```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "react-router-dom": "^6",
    "axios": "latest",
    "tailwindcss": "^3",
    "recharts": "^2",
    "@dnd-kit/core": "latest",
    "@dnd-kit/sortable": "latest",
    "react-grid-layout": "^2",
    "lucide-react": "latest",
    "next-themes": "latest",
    "date-fns": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest",
    "class-variance-authority": "latest",
    "@radix-ui/react-*": "latest (9개 패키지)"
  }
}
```

---

## 실행 방법

### 환경 요구사항
- Java 17 (Microsoft OpenJDK 17.0.18 설치됨: `C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot`)
- Maven 3.9.x (설치됨: `C:\maven\apache-maven-3.9.14`)
- Node.js 18+

### Spring Boot 실행
```bash
# JAVA_HOME 설정 필요 (bash 환경)
export JAVA_HOME="/c/Program Files/Microsoft/jdk-17.0.18.8-hotspot"
export PATH="$JAVA_HOME/bin:/c/maven/apache-maven-3.9.14/bin:$PATH"

cd D:\insideBi\insideBi-server
mvn spring-boot:run -Dspring-boot.run.profiles=dev
# → http://localhost:8080
```

### Vite 프론트엔드 실행
```bash
cd D:\insideBi\insideBi-client
npm run dev
# → http://localhost:5173
```

### AI 백엔드 실행 (기존 그대로)
```bash
cd D:\insideBi\ai-backend
python main.py
# → http://localhost:8000
```

---

## 환경변수

### Spring Boot (`application-dev.yml`)
```yaml
DATABASE_URL: jdbc:postgresql://localhost:5432/insidebi
AI_BACKEND_URL: http://localhost:8000
ADMIN_PASSWORD: "1"
CORS_ORIGINS: http://localhost:5173
```

### Vite (`.env`)
```env
VITE_API_URL=           # 비워두면 상대경로 (/api → 프록시로 :8080 전달)
VITE_AI_API_URL=http://localhost:8000
```

---

## 미해결 이슈

### 1. React 버전 충돌 (런타임)
- **증상**: `Error: A React Element from an older version of React was rendered`
- **원인**: `Progress` 컴포넌트에서 react 버전 충돌 (중복 설치 의심)
- **해결 방법 후보**:
  ```bash
  npm dedupe
  # 또는
  npm ls react  # 중복 확인 후 해당 패키지 버전 맞춤
  ```

### 2. AI 백엔드 미실행 시 에러
- **증상**: Spring Boot 로그에 `Connection refused: connect` (포트 8000)
- **원인**: FastAPI 서버가 꺼져 있을 때 프록시 호출 실패
- **영향**: AI 관련 기능만 503 응답, 나머지 기능 정상

---

## 기술 스택 최종

| 레이어 | 기술 | 버전 | 포트 |
|---|---|---|---|
| 프론트엔드 | Vite + React + TypeScript | React 18 | 5173 |
| UI 라이브러리 | Tailwind CSS + shadcn/ui (Radix UI) | Tailwind 3 | - |
| 차트 | Recharts | 2.x | - |
| 백엔드 | Spring Boot (Tomcat 내장) | 3.3.5 | 8080 |
| ORM/DB | Spring JDBC Template | - | - |
| DB | PostgreSQL | - | 5432 |
| AI 백엔드 | FastAPI + Vanna + Ollama | - | 8000 |
