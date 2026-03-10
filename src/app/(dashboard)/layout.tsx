"use client";

import * as React from "react";
import { TopNav } from "@/components/layout/TopNav";
import { AiPanel } from "@/components/ai/AiPanel";
import { AiPanelProvider } from "@/context/AiPanelContext";
import { AiChatProvider } from "@/context/AiChatContext";
import { RoleProvider } from "@/context/RoleContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [aiOpen, setAiOpen] = React.useState(false);
  const [defaultQuestion, setDefaultQuestion] = React.useState<string | undefined>();

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
    <RoleProvider>
    <AiChatProvider>
    <AiPanelProvider value={contextValue}>
      <div className="flex flex-col min-h-screen">
        {/* Metabase-style top navigation */}
        <TopNav onAiOpen={openPanel} />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>

        {/* AI 분석 패널 */}
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
    </RoleProvider>
  );
}
