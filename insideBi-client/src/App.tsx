import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { RoleProvider } from "@/context/RoleContext";
import { AiChatProvider } from "@/context/AiChatContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LoginPage from "@/pages/LoginPage";

const MetaHome = lazy(() => import("@/components/home/MetaHome").then((module) => ({ default: module.MetaHome })));
const DashboardsPage = lazy(() => import("@/pages/DashboardsPage"));
const DashboardEditorClient = lazy(() =>
  import("@/components/builder/DashboardEditorClient").then((module) => ({ default: module.DashboardEditorClient })),
);
const QuestionsPage = lazy(() => import("@/pages/QuestionsPage"));
const QuestionDetailPage = lazy(() => import("@/pages/QuestionDetailPage"));
const SqlEditorPage = lazy(() => import("@/pages/SqlEditorPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const ReportDetailPage = lazy(() => import("@/pages/ReportDetailPage"));

function PageLoader() {
  return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading...</div>;
}

export default function App() {
  return (
    <RoleProvider>
      <AiChatProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<DashboardLayout />}>
              <Route path="/" element={<MetaHome />} />

              <Route path="/credit-risk" element={<Navigate to="/questions" replace />} />
              <Route path="/market-risk" element={<Navigate to="/questions" replace />} />
              <Route path="/liquidity-risk" element={<Navigate to="/questions" replace />} />
              <Route path="/ncr-risk" element={<Navigate to="/questions" replace />} />

              <Route path="/dashboards" element={<DashboardsPage />} />
              <Route path="/dashboards/new" element={<DashboardEditorClient />} />

              <Route path="/questions" element={<QuestionsPage />} />
              <Route path="/questions/pick" element={<Navigate to="/questions/new" replace />} />
              <Route path="/questions/nocode" element={<Navigate to="/questions/new" replace />} />
              <Route path="/questions/new" element={<SqlEditorPage />} />
              <Route path="/questions/:id" element={<QuestionDetailPage />} />

              <Route path="/browse" element={<Navigate to="/questions/new" replace />} />
              <Route path="/browse/:dbId" element={<Navigate to="/questions/new" replace />} />
              <Route path="/browse/:dbId/:tableId" element={<Navigate to="/questions/new" replace />} />
              <Route path="/collections" element={<Navigate to="/questions" replace />} />
              <Route path="/collections/:id" element={<Navigate to="/questions" replace />} />

              <Route path="/admin" element={<AdminPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/reports/:id" element={<ReportDetailPage />} />
              <Route path="/builder" element={<Navigate to="/dashboards/new" replace />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </AiChatProvider>
    </RoleProvider>
  );
}
