
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReportMeta } from "@/lib/mock-data";

const typeOptions: { value: ReportMeta["type"]; label: string }[] = [
  { value: "monthly", label: "월간" },
  { value: "quarterly", label: "분기" },
  { value: "annual", label: "연간" },
  { value: "stress", label: "스트레스 테스트" },
  { value: "regulatory", label: "규제 제출용" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (report: ReportMeta) => void;
}

export function ReportCreateDialog({ open, onClose, onCreated }: Props) {
  const [type, setType] = React.useState<ReportMeta["type"]>("monthly");
  const [period, setPeriod] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [author, setAuthor] = React.useState("리스크관리부");
  const [saving, setSaving] = React.useState(false);

  const handleCreate = async () => {
    if (!period.trim()) return;
    setSaving(true);
    const typeName = typeOptions.find((o) => o.value === type)?.label ?? "";
    const id = `RPT-USR-${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);
    const newReport: ReportMeta = {
      id,
      title: title.trim() || `${period} ${typeName} 보고서`,
      type,
      period: period.trim(),
      createdAt: today,
      author: author.trim() || "리스크관리부",
      status: "draft",
      pages: 0,
      summary: `${period} ${typeName} 보고서 초안`,
    };

    // 서버에 저장 (실패 시 localStorage 폴백)
    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReport),
      });
    } catch {
      const stored: ReportMeta[] = JSON.parse(localStorage.getItem("insightbi_reports") || "[]");
      stored.unshift(newReport);
      localStorage.setItem("insightbi_reports", JSON.stringify(stored));
    }

    onCreated(newReport);
    setType("monthly");
    setPeriod("");
    setTitle("");
    setAuthor("리스크관리부");
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>새 보고서 생성</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="rpt-type">보고서 유형</Label>
            <Select value={type} onValueChange={(v) => setType(v as ReportMeta["type"])}>
              <SelectTrigger id="rpt-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                {typeOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rpt-period">기간 <span className="text-destructive">*</span></Label>
            <Input
              id="rpt-period"
              placeholder="예: 2026년 3월"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rpt-title">제목 (비워두면 자동 생성)</Label>
            <Input
              id="rpt-title"
              placeholder="예: 2026년 3월 종합 리스크 보고서"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rpt-author">작성 부서</Label>
            <Input
              id="rpt-author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleCreate} disabled={!period.trim() || saving}>
            {saving ? "저장 중..." : "생성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
