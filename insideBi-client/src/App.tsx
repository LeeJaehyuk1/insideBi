import { Routes, Route, Navigate } from "react-router-dom";
import { RoleProvider } from "@/context/RoleContext";
import { AiChatProvider } from "@/context/AiChatContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LoginPage from "@/pages/LoginPage";

// Lazy-loaded pages
import { lazy, Suspense } from "react";

const MetaHome = lazy(() =>
  import("@/components/home/MetaHome").then((m) => ({ default: m.MetaHome }))
);
const CreditRiskPage = lazy(() => import("@/pages/CreditRiskPage"));
const MarketRiskPage = lazy(() => import("@/pages/MarketRiskPage"));
const LiquidityRiskPage = lazy(() => import("@/pages/LiquidityRiskPage"));
const NcrRiskPage = lazy(() => import("@/pages/NcrRiskPage"));
const DashboardsPage = lazy(() => import("@/pages/DashboardsPage"));
const DashboardEditorClient = lazy(() =>
  import("@/components/builder/DashboardEditorClient").then((m) => ({
    default: m.DashboardEditorClient,
  }))
);
const QuestionsPage = lazy(() => import("@/pages/QuestionsPage"));
const QuestionDetailPage = lazy(() => import("@/pages/QuestionDetailPage"));
const NoCodeBuilderPage = lazy(() => import("@/pages/NoCodeBuilderPage"));
const SqlEditorPage = lazy(() => import("@/pages/SqlEditorPage"));
const BrowsePage = lazy(() => import("@/pages/BrowsePage"));
const BrowseDbPage = lazy(() => import("@/pages/BrowseDbPage"));
const BrowseTablePage = lazy(() => import("@/pages/BrowseTablePage"));
const CollectionsPage = lazy(() => import("@/pages/CollectionsPage"));
const CollectionDetailPage = lazy(() => import("@/pages/CollectionDetailPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const ReportDetailPage = lazy(() => import("@/pages/ReportDetailPage"));
const BuilderPage = lazy(() => import("@/pages/BuilderPage"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
      로딩 중...
    </div>
  );
}

export default function App() {
  return (
    <RoleProvider>
      <AiChatProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* 공개 라우트 */}
            <Route path="/login" element={<LoginPage />} />

            {/* 보호된 라우트 (TopNav + Layout) */}
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<MetaHome />} />

              {/* 리스크 관리 */}
              <Route path="/credit-risk" element={<CreditRiskPage />} />
              <Route path="/market-risk" element={<MarketRiskPage />} />
              <Route path="/liquidity-risk" element={<LiquidityRiskPage />} />
              <Route path="/ncr-risk" element={<NcrRiskPage />} />

              {/* 대시보드 */}
              <Route path="/dashboards" element={<DashboardsPage />} />
              <Route path="/dashboards/new" element={<DashboardEditorClient />} />

              {/* 질문 */}
              <Route path="/questions" element={<QuestionsPage />} />
              <Route path="/questions/pick" element={<NoCodeBuilderPage />} />
              <Route path="/questions/nocode" element={<NoCodeBuilderPage />} />
              <Route path="/questions/new" element={<SqlEditorPage />} />
              <Route path="/questions/:id" element={<QuestionDetailPage />} />

              {/* 탐색 */}
              <Route path="/browse" element={<BrowsePage />} />
              <Route path="/browse/:dbId" element={<BrowseDbPage />} />
              <Route path="/browse/:dbId/:tableId" element={<BrowseTablePage />} />

              {/* 컬렉션 */}
              <Route path="/collections" element={<CollectionsPage />} />
              <Route path="/collections/:id" element={<CollectionDetailPage />} />

              {/* 관리자 */}
              <Route path="/admin" element={<AdminPage />} />

              {/* 보고서 */}
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/reports/:id" element={<ReportDetailPage />} />

              {/* 빌더 */}
              <Route path="/builder" element={<BuilderPage />} />

              {/* 없는 경로 → 홈 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </AiChatProvider>
    </RoleProvider>
  );
}
