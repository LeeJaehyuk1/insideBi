"use client";

import { Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  const handlePrint = () => window.print();

  const handlePdfSave = () => {
    // 인쇄 대화상자에서 "PDF로 저장" 선택을 안내하기 위해 title을 잠시 변경
    const original = document.title;
    document.title = `InsightBi_보고서_${new Date().toISOString().slice(0, 10)}`;
    window.print();
    // 인쇄 대화상자가 닫히면 title 복원
    setTimeout(() => { document.title = original; }, 1000);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="h-4 w-4 mr-1" />
        인쇄
      </Button>
      <Button variant="outline" size="sm" onClick={handlePdfSave}>
        <Download className="h-4 w-4 mr-1" />
        PDF 저장
      </Button>
    </div>
  );
}
