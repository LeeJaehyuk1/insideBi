
import * as React from "react";
import {
    Database, FileSpreadsheet, X, ChevronRight, Upload,
    CheckCircle2, AlertCircle, Code2, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DatasetMeta } from "@/types/builder";
import { ChartType } from "@/types/builder";

/** 카테고리 옵션 */
const CATEGORY_OPTIONS = [
    { value: "credit", label: "신용리스크", color: "text-orange-500" },
    { value: "market", label: "시장리스크", color: "text-blue-500" },
    { value: "liquidity", label: "유동성리스크", color: "text-teal-500" },
    { value: "custom", label: "사용자 정의", color: "text-purple-500" },
] as const;

type SourceType = "sql" | "excel";
type CategoryValue = (typeof CATEGORY_OPTIONS)[number]["value"];

const DEFAULT_COMPATIBLE: ChartType[] = ["table", "bar", "line", "area", "pie"];

interface AddDataCatalogModalProps {
    open: boolean;
    onClose: () => void;
    onAdd: (dataset: DatasetMeta, sourceType: SourceType, query?: string, excelData?: ParsedExcelData) => void;
}

export interface ParsedExcelData {
    fileName: string;
    columns: string[];
    rows: Record<string, string | number>[];
}

/* ────────────────────────────────────────────────────────── */
/*  Simple Excel / CSV parser (browser-side, no dependency)  */
/* ────────────────────────────────────────────────────────── */
async function parseExcelFile(file: File): Promise<ParsedExcelData> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split(/\r?\n/).filter((l) => l.trim());
                if (lines.length < 2) throw new Error("데이터가 부족합니다");
                const sep = lines[0].includes("\t") ? "\t" : ",";
                const columns = lines[0].split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
                const rows: Record<string, string | number>[] = [];
                for (let i = 1; i < Math.min(lines.length, 201); i++) {
                    const vals = lines[i].split(sep).map((v) => v.trim().replace(/^"|"$/g, ""));
                    const row: Record<string, string | number> = {};
                    columns.forEach((col, idx) => {
                        const raw = vals[idx] ?? "";
                        row[col] = isNaN(Number(raw)) || raw === "" ? raw : Number(raw);
                    });
                    rows.push(row);
                }
                resolve({ fileName: file.name, columns, rows });
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error("파일 읽기 실패"));
        reader.readAsText(file, "utf-8");
    });
}

/* ═══════════════════════════════════════════════════════════ */
export function AddDataCatalogModal({ open, onClose, onAdd }: AddDataCatalogModalProps) {
    /* ── form state ── */
    const [step, setStep] = React.useState<1 | 2>(1);
    const [title, setTitle] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [category, setCategory] = React.useState<CategoryValue>("custom");
    const [sourceType, setSourceType] = React.useState<SourceType>("sql");

    /* SQL */
    const [query, setQuery] = React.useState("");

    /* Excel */
    const [file, setFile] = React.useState<File | null>(null);
    const [parsedData, setParsedData] = React.useState<ParsedExcelData | null>(null);
    const [parseError, setParseError] = React.useState<string | null>(null);
    const [parsing, setParsing] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    /* ── reset on close ── */
    React.useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setStep(1);
                setTitle("");
                setDescription("");
                setCategory("custom");
                setSourceType("sql");
                setQuery("");
                setFile(null);
                setParsedData(null);
                setParseError(null);
            }, 250);
        }
    }, [open]);

    /* ── file drop / select ── */
    const handleFileChange = async (f: File) => {
        setFile(f);
        setParsedData(null);
        setParseError(null);
        setParsing(true);
        try {
            const data = await parseExcelFile(f);
            setParsedData(data);
        } catch (err) {
            setParseError((err as Error).message);
        } finally {
            setParsing(false);
        }
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f) handleFileChange(f);
    };

    /* ── validation ── */
    const step1Valid = title.trim().length > 0;
    const step2Valid =
        sourceType === "sql"
            ? query.trim().length > 0
            : parsedData !== null;

    /* ── submit ── */
    const handleSubmit = () => {
        const catOpt = CATEGORY_OPTIONS.find((c) => c.value === category)!;
        const newDataset: DatasetMeta = {
            id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            label: title.trim(),
            category: category as DatasetMeta["category"],
            categoryLabel: catOpt.label,
            description: description.trim() || `사용자 정의 데이터셋 (${sourceType === "sql" ? "SQL" : "Excel"})`,
            compatibleCharts: DEFAULT_COMPATIBLE,
            defaultChart: "table",
        };
        onAdd(newDataset, sourceType, sourceType === "sql" ? query : undefined, parsedData ?? undefined);
        onClose();
    };

    /* ── drag state for drop zone ── */
    const [dragOver, setDragOver] = React.useState(false);

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    className={cn(
                        "pointer-events-auto w-full max-w-lg rounded-2xl border bg-background shadow-2xl",
                        "animate-in zoom-in-95 slide-in-from-bottom-4 duration-200"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* ── Header ── */}
                    <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                            <Database className="h-4.5 w-4.5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold">새 데이터셋 추가</p>
                            <p className="text-xs text-muted-foreground">
                                {step === 1 ? "기본 정보 입력" : "데이터 소스 설정"}
                            </p>
                        </div>
                        {/* Step indicator */}
                        <div className="flex items-center gap-1.5 mr-2">
                            {[1, 2].map((s) => (
                                <div
                                    key={s}
                                    className={cn(
                                        "h-1.5 rounded-full transition-all duration-300",
                                        s === step ? "w-6 bg-primary" : s < step ? "w-3 bg-primary/40" : "w-3 bg-muted"
                                    )}
                                />
                            ))}
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-1 hover:bg-muted transition-colors text-muted-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* ── Body ── */}
                    <div className="px-6 py-5 space-y-5">

                        {/* ════ STEP 1 ════ */}
                        {step === 1 && (
                            <>
                                {/* 제목 */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        데이터셋 제목 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        autoFocus
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="예: 2024년 분기별 NPL 현황"
                                        className={cn(
                                            "w-full rounded-lg border bg-muted/30 px-3 py-2 text-sm outline-none",
                                            "focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50",
                                            "transition-all duration-150"
                                        )}
                                    />
                                </div>

                                {/* 설명 */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        설명 <span className="text-muted-foreground/50">(선택)</span>
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="데이터셋에 대한 간략한 설명"
                                        rows={2}
                                        className={cn(
                                            "w-full rounded-lg border bg-muted/30 px-3 py-2 text-sm outline-none resize-none",
                                            "focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50",
                                            "transition-all duration-150"
                                        )}
                                    />
                                </div>

                                {/* 카테고리 */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        카테고리
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {CATEGORY_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setCategory(opt.value)}
                                                className={cn(
                                                    "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm text-left transition-all duration-150",
                                                    category === opt.value
                                                        ? "border-primary bg-primary/8 text-primary font-medium"
                                                        : "hover:bg-muted/60 text-foreground"
                                                )}
                                            >
                                                <span className={cn("h-2 w-2 rounded-full flex-shrink-0 bg-current", opt.color)} />
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 소스 타입 */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        데이터 소스 유형
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* SQL */}
                                        <button
                                            onClick={() => setSourceType("sql")}
                                            className={cn(
                                                "flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 transition-all duration-150",
                                                sourceType === "sql"
                                                    ? "border-primary bg-primary/8"
                                                    : "border-border hover:border-primary/40 hover:bg-muted/40"
                                            )}
                                        >
                                            <Code2 className={cn("h-7 w-7", sourceType === "sql" ? "text-primary" : "text-muted-foreground")} />
                                            <div className="text-center">
                                                <p className={cn("text-xs font-semibold", sourceType === "sql" ? "text-primary" : "")}>SQL 쿼리</p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">직접 쿼리 입력</p>
                                            </div>
                                        </button>

                                        {/* Excel */}
                                        <button
                                            onClick={() => setSourceType("excel")}
                                            className={cn(
                                                "flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 transition-all duration-150",
                                                sourceType === "excel"
                                                    ? "border-primary bg-primary/8"
                                                    : "border-border hover:border-primary/40 hover:bg-muted/40"
                                            )}
                                        >
                                            <FileSpreadsheet className={cn("h-7 w-7", sourceType === "excel" ? "text-primary" : "text-muted-foreground")} />
                                            <div className="text-center">
                                                <p className={cn("text-xs font-semibold", sourceType === "excel" ? "text-primary" : "")}>Excel / CSV</p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">파일 업로드</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ════ STEP 2 ════ */}
                        {step === 2 && (
                            <>
                                {/* Summary bar */}
                                <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold truncate">{title}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {CATEGORY_OPTIONS.find((c) => c.value === category)?.label} ·{" "}
                                            {sourceType === "sql" ? "SQL 쿼리" : "Excel/CSV"}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setStep(1)}
                                        className="text-[10px] text-primary hover:underline shrink-0"
                                    >
                                        수정
                                    </button>
                                </div>

                                {/* ── SQL 쿼리 입력 ── */}
                                {sourceType === "sql" && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                            SQL 쿼리 <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative rounded-xl border bg-zinc-950 dark:bg-zinc-900 overflow-hidden">
                                            {/* Toolbar */}
                                            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/8">
                                                <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                                                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                                                <div className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
                                                <span className="ml-2 text-[10px] text-white/30 font-mono">query.sql</span>
                                            </div>
                                            <textarea
                                                autoFocus
                                                value={query}
                                                onChange={(e) => setQuery(e.target.value)}
                                                placeholder={"SELECT\n  column1,\n  column2\nFROM your_table\nWHERE condition = 'value'"}
                                                rows={9}
                                                spellCheck={false}
                                                className={cn(
                                                    "w-full bg-transparent px-4 py-3 text-xs font-mono text-green-300",
                                                    "outline-none resize-none placeholder:text-white/20 leading-relaxed"
                                                )}
                                            />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">
                                            💡 쿼리는 저장되며 실제 DB 연결 시 사용됩니다
                                        </p>
                                    </div>
                                )}

                                {/* ── 엑셀 업로드 ── */}
                                {sourceType === "excel" && (
                                    <div className="space-y-3">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                            파일 업로드 <span className="text-red-500">*</span>
                                        </label>

                                        {/* Drop zone */}
                                        <div
                                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                            onDragLeave={() => setDragOver(false)}
                                            onDrop={(e) => { setDragOver(false); onDrop(e); }}
                                            onClick={() => fileInputRef.current?.click()}
                                            className={cn(
                                                "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-8 cursor-pointer transition-all duration-150",
                                                dragOver
                                                    ? "border-primary bg-primary/10 scale-[1.01]"
                                                    : file
                                                        ? "border-green-500/40 bg-green-500/5"
                                                        : "border-border hover:border-primary/40 hover:bg-muted/30"
                                            )}
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".csv,.xlsx,.xls,.tsv"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const f = e.target.files?.[0];
                                                    if (f) handleFileChange(f);
                                                }}
                                            />

                                            {parsing ? (
                                                <>
                                                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                                    <p className="text-xs text-muted-foreground">파일 분석 중...</p>
                                                </>
                                            ) : parsedData ? (
                                                <>
                                                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                                                    <div className="text-center">
                                                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                                                            {parsedData.fileName}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {parsedData.columns.length}개 컬럼 · {parsedData.rows.length}개 행 로드됨
                                                        </p>
                                                    </div>
                                                </>
                                            ) : parseError ? (
                                                <>
                                                    <AlertCircle className="h-8 w-8 text-red-500" />
                                                    <div className="text-center">
                                                        <p className="text-xs font-semibold text-red-500">파싱 오류</p>
                                                        <p className="text-[10px] text-muted-foreground mt-1">{parseError}</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className={cn("h-8 w-8 transition-colors", dragOver ? "text-primary" : "text-muted-foreground")} />
                                                    <div className="text-center">
                                                        <p className="text-sm font-medium">파일을 드래그하거나 클릭하여 선택</p>
                                                        <p className="text-xs text-muted-foreground mt-1">.csv, .xlsx, .xls, .tsv 지원</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Column preview */}
                                        {parsedData && (
                                            <div className="rounded-lg border bg-muted/20 overflow-hidden">
                                                <div className="px-3 py-2 border-b bg-muted/40">
                                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                                        컬럼 미리보기
                                                    </p>
                                                </div>
                                                <div className="p-3 flex flex-wrap gap-1.5">
                                                    {parsedData.columns.map((col) => (
                                                        <span
                                                            key={col}
                                                            className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-medium text-primary"
                                                        >
                                                            {col}
                                                        </span>
                                                    ))}
                                                </div>
                                                {/* Data preview rows */}
                                                <div className="border-t overflow-x-auto max-h-36">
                                                    <table className="w-full text-[10px]">
                                                        <tbody>
                                                            {parsedData.rows.slice(0, 3).map((row, ri) => (
                                                                <tr key={ri} className={ri % 2 === 0 ? "bg-muted/10" : ""}>
                                                                    {parsedData.columns.map((col) => (
                                                                        <td key={col} className="px-3 py-1 border-r last:border-r-0 text-muted-foreground truncate max-w-[120px]">
                                                                            {String(row[col] ?? "")}
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Re-upload */}
                                        {(parsedData || parseError) && (
                                            <button
                                                onClick={() => { setFile(null); setParsedData(null); setParseError(null); fileInputRef.current?.click(); }}
                                                className="text-[10px] text-primary hover:underline"
                                            >
                                                다른 파일 선택
                                            </button>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* ── Footer ── */}
                    <div className="flex items-center justify-between gap-3 px-6 pb-5 pt-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={step === 1 ? onClose : () => setStep(1)}
                        >
                            {step === 1 ? "취소" : "이전"}
                        </Button>

                        <div className="flex gap-2">
                            {step === 1 ? (
                                <Button
                                    size="sm"
                                    disabled={!step1Valid}
                                    onClick={() => setStep(2)}
                                    className="gap-1.5"
                                >
                                    다음
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    disabled={!step2Valid}
                                    onClick={handleSubmit}
                                    className="gap-1.5"
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    데이터셋 추가
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
