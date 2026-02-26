import { notFound } from "next/navigation";
import { getReportById, reports } from "@/lib/mock-data";
import { PrintableReport } from "@/components/reports/PrintableReport";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PrintButton } from "./PrintButton";

export function generateStaticParams() {
  return reports.map((report) => ({ id: report.id }));
}

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

export default function ReportDetailPage({ params }: PageProps) {
  const report = getReportById(params.id);
  if (!report) notFound();

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/reports">
              <ArrowLeft className="h-4 w-4 mr-1" />
              목록으로
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{typeLabel[report.type]}</Badge>
            <Badge variant={report.status === "published" ? "default" : "secondary"}>
              {statusLabel[report.status]}
            </Badge>
          </div>
        </div>
        <PrintButton />
      </div>

      {/* Printable content */}
      <div className="bg-card rounded-xl border p-8">
        <PrintableReport report={report} />
      </div>
    </div>
  );
}
