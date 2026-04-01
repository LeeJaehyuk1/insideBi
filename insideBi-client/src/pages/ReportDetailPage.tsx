import { useParams, Link, Navigate } from "react-router-dom";
import { getReportById, reports } from "@/lib/mock-data";
import { PrintableReport } from "@/components/reports/PrintableReport";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/reports/PrintButton";

const typeLabel: Record<string, string> = {
  credit: "신용리스크",
  market: "시장리스크",
  liquidity: "유동성리스크",
  ncr: "NCR",
  integrated: "통합리스크",
};
const typeColor: Record<string, string> = {
  credit: "bg-blue-100 text-blue-700",
  market: "bg-amber-100 text-amber-700",
  liquidity: "bg-green-100 text-green-700",
  ncr: "bg-purple-100 text-purple-700",
  integrated: "bg-rose-100 text-rose-700",
};

export default function ReportDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const report = getReportById(id);

  if (!report) return <Navigate to="/reports" replace />;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/reports">
              <ArrowLeft className="h-4 w-4 mr-1" />
              목록
            </Link>
          </Button>
          <Badge className={typeColor[report.type] ?? "bg-gray-100 text-gray-700"}>
            {typeLabel[report.type] ?? report.type}
          </Badge>
        </div>
        <PrintButton />
      </div>

      <PrintableReport report={report} />
    </div>
  );
}
