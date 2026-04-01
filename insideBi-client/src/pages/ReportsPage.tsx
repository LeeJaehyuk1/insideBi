
import * as React from "react";
import { ReportListTable } from "@/components/reports/ReportListTable";
import { reports as mockReports, ReportMeta } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckCircle, Edit } from "lucide-react";

function useAllReports() {
  const [all, setAll] = React.useState<ReportMeta[]>(mockReports);

  React.useEffect(() => {
    const stored: ReportMeta[] = JSON.parse(localStorage.getItem("insightbi_reports") || "[]");
    if (stored.length > 0) setAll([...stored, ...mockReports]);
  }, []);

  return all;
}

export default function ReportsPage() {
  const all = useAllReports();

  const published = all.filter((r) => r.status === "published").length;
  const approved = all.filter((r) => r.status === "approved").length;
  const inProgress = all.filter((r) => r.status === "draft" || r.status === "review").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">보고서</h1>
        <p className="text-muted-foreground text-sm mt-1">경영진 보고서 목록 및 관리</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "공개 보고서", value: published, icon: FileText, color: "text-green-600" },
          { label: "승인 완료", value: approved, icon: CheckCircle, color: "text-blue-600" },
          { label: "작성/검토 중", value: inProgress, icon: Edit, color: "text-yellow-600" },
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
