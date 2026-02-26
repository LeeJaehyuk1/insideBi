import { ReportListTable } from "@/components/reports/ReportListTable";
import { reports } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckCircle, Clock, Edit } from "lucide-react";

const statusCounts = {
  published: reports.filter((r) => r.status === "published").length,
  approved: reports.filter((r) => r.status === "approved").length,
  draft: reports.filter((r) => r.status === "draft" || r.status === "review").length,
};

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">보고서</h1>
        <p className="text-muted-foreground text-sm mt-1">경영진 보고서 목록 및 관리</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "공개 보고서", value: statusCounts.published, icon: FileText, color: "text-green-600" },
          { label: "승인 완료", value: statusCounts.approved, icon: CheckCircle, color: "text-blue-600" },
          { label: "작성/검토 중", value: statusCounts.draft, icon: Edit, color: "text-yellow-600" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <item.icon className={`h-6 w-6 ${item.color}`} />
              <div>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ReportListTable />
    </div>
  );
}
