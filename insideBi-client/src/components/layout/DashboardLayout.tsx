import * as React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { TopNav } from "@/components/layout/TopNav";
import { AiPanel } from "@/components/ai/AiPanel";
import { AiPanelProvider } from "@/context/AiPanelContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useRole } from "@/context/RoleContext";
import { recordVisit } from "@/hooks/useRecentlyViewed";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, hydrated } = useRole();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!hydrated) return;
    if (!isLoggedIn) navigate("/login", { replace: true });
  }, [hydrated, isLoggedIn, navigate]);

  if (!hydrated || !isLoggedIn) return null;
  return <>{children}</>;
}

export default function DashboardLayout() {
  const location = useLocation();
  const [aiOpen, setAiOpen] = React.useState(false);
  const [defaultQuestion, setDefaultQuestion] = React.useState<string | undefined>();

  React.useEffect(() => {
    recordVisit(location.pathname);
  }, [location.pathname]);

  const openWithQuestion = React.useCallback((question: string) => {
    setDefaultQuestion(question);
    setAiOpen(true);
  }, []);

  const openPanel = React.useCallback(() => {
    setDefaultQuestion(undefined);
    setAiOpen(true);
  }, []);

  const contextValue = React.useMemo(
    () => ({ openWithQuestion, open: openPanel }),
    [openWithQuestion, openPanel]
  );

  return (
    <AuthGuard>
      <AiPanelProvider value={contextValue}>
        <div className="flex flex-col min-h-screen">
          <TopNav onAiOpen={openPanel} />
          <main className="flex-1 overflow-y-auto bg-background p-6">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>
          <AiPanel
            open={aiOpen}
            onOpenChange={(open) => {
              setAiOpen(open);
              if (!open) setDefaultQuestion(undefined);
            }}
            defaultQuestion={defaultQuestion}
          />
        </div>
      </AiPanelProvider>
    </AuthGuard>
  );
}
