"use client";

import { Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <Printer className="h-4 w-4 mr-1" />
        인쇄
      </Button>
      <Button variant="outline" size="sm">
        <Download className="h-4 w-4 mr-1" />
        다운로드
      </Button>
    </div>
  );
}
