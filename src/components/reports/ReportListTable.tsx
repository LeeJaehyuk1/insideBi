"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, Download, Eye, Search, Plus, ChevronUp, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { reports as mockReports, ReportMeta } from "@/lib/mock-data";
import { ReportCreateDialog } from "./ReportCreateDialog";

const typeLabel: Record<ReportMeta["type"], string> = {
  monthly: "월간",
  quarterly: "분기",
  annual: "연간",
  stress: "스트레스",
  regulatory: "규제",
};

const statusConfig: Record<ReportMeta["status"], { label: string; variant: "default" | "secondary" | "outline" }> = {
  draft: { label: "초안", variant: "secondary" },
  review: { label: "검토중", variant: "secondary" },
  approved: { label: "승인", variant: "default" },
  published: { label: "공개", variant: "default" },
};

type SortKey = "createdAt" | "title";

const TYPE_FILTERS = ["all", "monthly", "quarterly", "annual", "stress", "regulatory"] as const;
const STATUS_FILTERS = ["all", "draft", "review", "approved", "published"] as const;

export function ReportListTable() {
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<(typeof TYPE_FILTERS)[number]>("all");
  const [statusFilter, setStatusFilter] = React.useState<(typeof STATUS_FILTERS)[number]>("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("createdAt");
  const [sortAsc, setSortAsc] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [localReports, setLocalReports] = React.useState<ReportMeta[]>([]);

  React.useEffect(() => {
    const stored: ReportMeta[] = JSON.parse(localStorage.getItem("insightbi_reports") || "[]");
    setLocalReports(stored);
  }, []);

  const allReports = React.useMemo(
    () => [...localReports, ...mockReports],
    [localReports]
  );

  const filtered = React.useMemo(() => {
    let list = allReports;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) => r.title.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q) || r.period.includes(q)
      );
    }
    if (typeFilter !== "all") list = list.filter((r) => r.type === typeFilter);
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    return [...list].sort((a, b) => {
      const cmp =
        sortKey === "createdAt"
          ? a.createdAt.localeCompare(b.createdAt)
          : a.title.localeCompare(b.title);
      return sortAsc ? cmp : -cmp;
    });
  }, [allReports, search, typeFilter, statusFilter, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const handleCreated = (r: ReportMeta) => setLocalReports((prev) => [r, ...prev]);

  const isLocal = (id: string) => id.startsWith("RPT-USR-");

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return null;
    return sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-3">
            <CardTitle className="text-sm font-semibold">
              보고서 목록
              <span className="ml-2 text-xs font-normal text-muted-foreground">({filtered.length}건)</span>
            </CardTitle>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              새 보고서
            </Button>
          </div>

          {/* 검색 */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="pl-8 h-8 text-sm"
              placeholder="보고서명, 기간, 요약 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* 유형 필터 */}
          <div className="flex flex-wrap gap-1 mb-1.5">
            {TYPE_FILTERS.map((t) => (
              <Badge
                key={t}
                variant={typeFilter === t ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => setTypeFilter(t)}
              >
                {t === "all" ? "전체 유형" : typeLabel[t as ReportMeta["type"]]}
              </Badge>
            ))}
          </div>

          {/* 상태 필터 */}
          <div className="flex flex-wrap gap-1">
            {STATUS_FILTERS.map((s) => (
              <Badge
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => setStatusFilter(s)}
              >
                {s === "all" ? "전체 상태" : statusConfig[s as ReportMeta["status"]].label}
              </Badge>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none"
                    onClick={() => handleSort("title")}
                  >
                    <span className="flex items-center gap-1">
                      보고서명 <SortIcon k="title" />
                    </span>
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">유형</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">기간</th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none"
                    onClick={() => handleSort("createdAt")}
                  >
                    <span className="flex items-center gap-1">
                      작성일 <SortIcon k="createdAt" />
                    </span>
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">상태</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">작업</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                )}
                {filtered.map((r) => {
                  const status = statusConfig[r.status];
                  const local = isLocal(r.id);
                  return (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-xs font-medium">{r.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {r.summary.length > 42 ? r.summary.slice(0, 42) + "…" : r.summary}
                            </p>
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
                        {local ? (
                          <p className="text-center text-xs text-muted-foreground">편집 준비 중</p>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" asChild title="보기">
                              <Link href={`/reports/${r.id}`}>
                                <Eye className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="인쇄/PDF"
                              onClick={() => {
                                const w = window.open(`/reports/${r.id}`, "_blank");
                                if (w) w.onload = () => w.print();
                              }}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ReportCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}
