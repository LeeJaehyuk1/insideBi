import { Suspense } from "react";
import { DashboardEditorClient } from "./DashboardEditorClient";

export default function NewDashboardPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-64 rounded-xl bg-muted" />}>
      <DashboardEditorClient />
    </Suspense>
  );
}
