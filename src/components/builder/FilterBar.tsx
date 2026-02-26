"use client";

import * as React from "react";
import { CalendarDays, Building2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface FilterState {
    dateRange: "1m" | "3m" | "6m" | "12m" | "ytd";
    department: "all" | "retail" | "corporate" | "treasury" | "ib";
}

export const DEFAULT_FILTER: FilterState = {
    dateRange: "12m",
    department: "all",
};

const DATE_RANGE_OPTIONS: { value: FilterState["dateRange"]; label: string }[] = [
    { value: "1m", label: "최근 1개월" },
    { value: "3m", label: "최근 3개월" },
    { value: "6m", label: "최근 6개월" },
    { value: "12m", label: "최근 12개월" },
    { value: "ytd", label: "올해(YTD)" },
];

const DEPT_OPTIONS: { value: FilterState["department"]; label: string }[] = [
    { value: "all", label: "전체 부서" },
    { value: "retail", label: "소매금융" },
    { value: "corporate", label: "기업금융" },
    { value: "treasury", label: "자금운용" },
    { value: "ib", label: "투자은행" },
];

interface FilterBarProps {
    filter: FilterState;
    onChange: (next: FilterState) => void;
    widgetCount: number;
}

export function FilterBar({ filter, onChange, widgetCount }: FilterBarProps) {
    const isDefault =
        filter.dateRange === DEFAULT_FILTER.dateRange &&
        filter.department === DEFAULT_FILTER.department;

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {/* Badge */}
            <span className="text-[10px] font-medium text-muted-foreground border rounded-md px-2 py-1 bg-muted/30">
                글로벌 필터
            </span>

            {/* Date Range */}
            <div className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Select
                    value={filter.dateRange}
                    onValueChange={(v) =>
                        onChange({ ...filter, dateRange: v as FilterState["dateRange"] })
                    }
                >
                    <SelectTrigger className="h-7 w-32 text-xs border-dashed">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {DATE_RANGE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value} className="text-xs">
                                {o.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Department */}
            <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Select
                    value={filter.department}
                    onValueChange={(v) =>
                        onChange({ ...filter, department: v as FilterState["department"] })
                    }
                >
                    <SelectTrigger className="h-7 w-28 text-xs border-dashed">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {DEPT_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value} className="text-xs">
                                {o.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Reset */}
            {!isDefault && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                    onClick={() => onChange(DEFAULT_FILTER)}
                >
                    <RefreshCw className="h-3 w-3" />
                    초기화
                </Button>
            )}

            {/* Divider + widget count */}
            <span className="text-muted-foreground text-xs ml-auto">
                {widgetCount}개 위젯에 적용
            </span>
        </div>
    );
}
