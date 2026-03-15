"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { TopNav } from "@/components/layout/TopNav";
import { AiPanel } from "@/components/ai/AiPanel";
import { AiPanelProvider } from "@/context/AiPanelContext";
import { AiChatProvider } from "@/context/AiChatContext";
import { RoleProvider, useRole } from "@/context/RoleContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { recordVisit } from "@/hooks/useRecentlyViewed";

/** 미로그인 시 /login으로 리다이렉트 — hydrated 이후에 판단 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, hydrated } = useRole();
  const router = useRouter();

  React.useEffect(() => {
    if (!hydrated) return; // localStorage 복원 완료 전에는 판단 보류
    if (!isLoggedIn) {
      router.replace("/login");
    }
  }, [hydrated, isLoggedIn, router]);

  // 복원 전이거나 미로그인 상태면 아무것도 렌더링하지 않음
  if (!hydrated || !isLoggedIn) return null;
  return <>{children}</>;
}

function DashboardInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [aiOpen, setAiOpen] = React.useState(false);
  const [defaultQuestion, setDefaultQuestion] = React.useState<string | undefined>();

  React.useEffect(() => {
    recordVisit(pathname);
  }, [pathname]);

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
    <AiChatProvider>
    <AiPanelProvider value={contextValue}>
      <div className="flex flex-col min-h-screen">
        <TopNav onAiOpen={openPanel} />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <ErrorBoundary>
            {children}
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
    </AiChatProvider>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <AuthGuard>
        <DashboardInner>{children}</DashboardInner>
      </AuthGuard>
    </RoleProvider>
  );
}
