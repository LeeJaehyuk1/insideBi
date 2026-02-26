"use client";

import * as React from "react";
import { X, TableProperties, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetConfig } from "@/types/builder";
import { ColumnMeta } from "@/types/dataset";
import { getDatasetSchema } from "@/lib/dataset-schemas";
import { useDataset } from "@/hooks/useDataset";
import { Button } from "@/components/ui/button";

type SortDir = "asc" | "desc" | null;

function formatCell(value: unknown, colType: string): string {
    if (value === null || value === undefined) return "—";
    const v = value as number | string;
    if (colType === "currency" && typeof v === "number") {
        return `${v.toLocaleString("ko-KR")}억`;
    }
    if (colType === "percent" && typeof v === "number") {
        return `${v.toFixed(2)}%`;
    }
    if (colType === "number" && typeof v === "number") {
        return v.toLocaleString("ko-KR");
    }
    return String(v);
}

interface DrilldownTableProps {
    widget: WidgetConfig;
    onClose: () => void;
}

export function DrilldownTable({ widget, onClose }: DrilldownTableProps) {
    const schema = getDatasetSchema(widget.datasetId);
    const { data, isLoading } = useDataset({
        datasetId: widget.datasetId,
        ...(widget.queryParams ?? {}),
    });

    const [sortKey, setSortKey] = React.useState<string | null>(null);
    const [sortDir, setSortDir] = React.useState<SortDir>(null);
    const [page, setPage] = React.useState(0);
    const PAGE_SIZE = 10;

    const columns: ColumnMeta[] = schema?.columns ?? [];

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"));
            if (sortDir === "desc") setSortKey(null);
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
        setPage(0);
    };

    const sorted = React.useMemo(() => {
        if (!sortKey || !sortDir) return data;
        return [...data].sort((a, b) => {
            const av = a[sortKey];
            const bv = b[sortKey];
            if (typeof av === "number" && typeof bv === "number") {
                return sortDir === "asc" ? av - bv : bv - av;
            }
            return sortDir === "asc"
                ? String(av).localeCompare(String(bv), "ko")
                : String(bv).localeCompare(String(av), "ko");
        });
    }, [data, sortKey, sortDir]);

    const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
    const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    return (
        <div className="mt-3 rounded-xl border bg-background shadow-sm overflow-hidden animate-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-2.5">
                <TableProperties className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold">{widget.title}</span>
                    <span className="ml-2 text-[10px] text-muted-foreground">
                        Drill-down · 전체 {data.length}건
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={onClose}
                >
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>

            {/* Table body */}
            {isLoading ? (
                <div className="flex items-center justify-center h-24 text-xs text-muted-foreground animate-pulse">
                    데이터 로딩 중...
                </div>
            ) : data.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
                    데이터가 없습니다
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b bg-muted/20">
                                    {columns.map((col) => (
                                        <th
                                            key={col.key}
                                            className={cn(
                                                "px-3 py-2 font-medium text-muted-foreground cursor-pointer select-none whitespace-nowrap",
                                                col.role === "measure" ? "text-right" : "text-left",
                                                "hover:bg-muted/40 transition-colors"
                                            )}
                                            onClick={() => handleSort(col.key)}
                                        >
                                            <span className="inline-flex items-center gap-1">
                                                {col.label}
                                                {col.unit && (
                                                    <span className="text-[9px] opacity-60">
                                                        ({col.unit})
                                                    </span>
                                                )}
                                                {sortKey === col.key ? (
                                                    sortDir === "asc" ? (
                                                        <ChevronUp className="h-3 w-3 text-primary" />
                                                    ) : (
                                                        <ChevronDown className="h-3 w-3 text-primary" />
                                                    )
                                                ) : (
                                                    <ChevronUp className="h-3 w-3 opacity-20" />
                                                )}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paged.map((row, ri) => (
                                    <tr
                                        key={ri}
                                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                                    >
                                        {columns.map((col) => {
                                            const val = row[col.key];
                                            const isNegative =
                                                typeof val === "number" && val < 0;
                                            return (
                                                <td
                                                    key={col.key}
                                                    className={cn(
                                                        "px-3 py-2 tabular-nums whitespace-nowrap",
                                                        col.role === "measure"
                                                            ? "text-right"
                                                            : "text-left",
                                                        isNegative && "text-red-500 dark:text-red-400"
                                                    )}
                                                >
                                                    {formatCell(val, col.type)}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t px-4 py-2 bg-muted/10">
                            <span className="text-[10px] text-muted-foreground">
                                {page * PAGE_SIZE + 1}–
                                {Math.min((page + 1) * PAGE_SIZE, sorted.length)} / {sorted.length}건
                            </span>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    disabled={page === 0}
                                    onClick={() => setPage((p) => p - 1)}
                                >
                                    이전
                                </Button>
                                <span className="text-[10px] text-muted-foreground px-1">
                                    {page + 1} / {totalPages}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    disabled={page >= totalPages - 1}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    다음
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
