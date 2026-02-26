"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, Download, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { reports, ReportMeta } from "@/lib/mock-data";

const typeLabel: Record<ReportMeta["type"], string> = {
  monthly: "월간",
  quarterly: "분기",
  annual: "연간",
  stress: "스트레스",
  regulatory: "규제",
};

const statusLabel: Record<ReportMeta["status"], { label: string; variant: "default" | "secondary" | "outline" }> = {
  draft: { label: "초안", variant: "secondary" },
  review: { label: "검토중", variant: "secondary" },
  approved: { label: "승인", variant: "default" },
  published: { label: "공개", variant: "default" },
};

export function ReportListTable() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">보고서 목록</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">보고서명</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">유형</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">기간</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">작성일</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">상태</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">작업</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const status = statusLabel[r.status];
                return (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs font-medium">{r.title}</p>
                          <p className="text-xs text-muted-foreground">{r.summary.slice(0, 40)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className="text-xs">{typeLabel[r.type]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.period}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.createdAt}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                          <Link href={`/reports/${r.id}`}><Eye className="h-3.5 w-3.5" /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
