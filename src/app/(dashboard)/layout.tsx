"use client";

import * as React from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { AiPanel } from "@/components/ai/AiPanel";
import { AiPanelProvider } from "@/context/AiPanelContext";

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
    <AiPanelProvider value={contextValue}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar - hidden on mobile */}
        <div className="hidden md:flex">
          <AppSidebar onAiOpen={openPanel} />
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar onAiOpen={openPanel} />
          <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
            {children}
          </main>
        </div>

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
  );
}
