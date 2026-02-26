import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface BaseChartWrapperProps {
  title: string;
  height?: number;
  loading?: boolean;
  className?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  useResponsive?: boolean;
}

export function BaseChartWrapper({
  title,
  height = 300,
  loading = false,
  className,
  action,
  children,
  useResponsive = true,
}: BaseChartWrapperProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {action && <div>{action}</div>}
      </CardHeader>
      <CardContent className="p-0 pb-4 px-2">
        {loading ? (
          <div className="px-4" style={{ height }}>
            <Skeleton className="w-full h-full rounded-lg" />
          </div>
        ) : useResponsive ? (
          <ResponsiveContainer width="100%" height={height}>
            {children as React.ReactElement}
          </ResponsiveContainer>
        ) : (
          <div style={{ height }} className="overflow-hidden">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
