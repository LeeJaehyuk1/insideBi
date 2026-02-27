"use client";

import * as React from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { AiPanel } from "@/components/ai/AiPanel";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [aiOpen, setAiOpen] = React.useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:flex">
        <AppSidebar onAiOpen={() => setAiOpen(true)} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onAiOpen={() => setAiOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {children}
        </main>
      </div>

      {/* AI 분석 패널 */}
      <AiPanel open={aiOpen} onOpenChange={setAiOpen} />
    </div>
  );
}
