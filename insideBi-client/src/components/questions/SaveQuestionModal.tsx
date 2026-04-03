import * as React from "react";
import { X } from "lucide-react";
import type { FilterParam } from "@/types/query";

const OPERATOR_LABEL: Record<string, string> = {
  eq: "is",
  neq: "is not",
  contains: "contains",
  not_contains: "not contains",
  starts: "starts with",
  ends: "ends with",
  empty: "is empty",
  not_empty: "is not empty",
  gte: ">=",
  lte: "<=",
};

function buildAutoName(tableLabel: string, filters: FilterParam[], columnLabels: Record<string, string>): string {
  if (!filters.length) return tableLabel;
  const parts = filters.slice(0, 2).map((filter) => {
    const column = columnLabels[filter.column] ?? filter.column;
    const operator = OPERATOR_LABEL[filter.operator] ?? filter.operator;
    const value = filter.operator === "empty" || filter.operator === "not_empty" ? "" : ` ${filter.value}`;
    return `${column} ${operator}${value}`;
  });
  return `${tableLabel}: ${parts.join(", ")}`;
}

interface SaveQuestionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (title: string, description: string) => void;
  tableLabel: string;
  filters: FilterParam[];
  columnLabels: Record<string, string>;
}

export function SaveQuestionModal({
  open,
  onClose,
  onSave,
  tableLabel,
  filters,
  columnLabels,
}: SaveQuestionModalProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setName(buildAutoName(tableLabel, filters, columnLabels));
    setDescription("");
  }, [open, tableLabel, filters, columnLabels]);

  if (!open) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), description);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between px-6 pb-5 pt-6">
          <h2 className="text-xl font-bold text-foreground">Save Question</h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-6 pb-6">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Name</label>
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && name.trim()) handleSave();
              }}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional description"
              rows={3}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
