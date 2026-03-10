import { notFound } from "next/navigation";
import { getReportById, reports, ReportMeta } from "@/lib/mock-data";
import { PrintableReport } from "@/components/reports/PrintableReport";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PrintButton } from "./PrintButton";

export function generateStaticParams() {
  return reports.map((report) => ({ id: report.id }));
}

export const dynamicParams = true;

interface PageProps {
  params: { id: string };
}

const typeLabel: Record<string, string> = {
  monthly: "월간", quarterly: "분기", annual: "연간",
  stress: "스트레스", regulatory: "규제",
};

const statusLabel: Record<string, string> = {
  draft: "초안", review: "검토중", approved: "승인", published: "공개",
};

async function fetchUserReport(id: string): Promise<ReportMeta | null> {
  const backend = process.env.AI_BACKEND_URL ?? "http://localhost:8000";
  try {
    const res = await fetch(`${backend}/api/reports/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.report ?? null;
  } catch {
    return null;
  }
}

export default async function ReportDetailPage({ params }: PageProps) {
  let report: ReportMeta | undefined | null = getReportById(params.id);

  if (!report && params.id.startsWith("RPT-USR-")) {
    report = await fetchUserReport(params.id);
  }

  if (!report) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/reports"><ArrowLeft className="h-4 w-4 mr-1" />목록으로</Link>
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{typeLabel[report.type] ?? report.type}</Badge>
            <Badge variant={report.status === "published" ? "default" : "secondary"}>
              {statusLabel[report.status] ?? report.status}
            </Badge>
          </div>
        </div>
        <PrintButton />
      </div>

      <div className="bg-card rounded-xl border p-8">
        <PrintableReport report={report} />
      </div>
    </div>
  );
}
