"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    ChevronDown,
    Play,
    AlignLeft,
    Download,
    RefreshCw,
    X,
    Database,
    Table,
    ChevronRight,
    Terminal,
    Save,
    ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { dataCatalog, categoryMeta, CATEGORY_ORDER } from "@/lib/data-catalog";

/* ─────────────────────────────────────────────
   데이터베이스 정의
───────────────────────────────────────────── */
const DATABASES = [
    { id: "insightbi", label: "InsightBi DB" },
    { id: "sample", label: "Sample Database" },
];

/* 데이터베이스 → 테이블 목록 */
const DB_SCHEMA: Record<
    string,
    {
        models: { name: string; count: number }[];
        tables: string[];
    }
> = {
    insightbi: {
        models: [
            { name: "리스크 대시보드", count: 4 },
        ],
        tables: [
            "npl_trend",
            "credit_grades",
            "sector_exposure",
            "concentration",
            "npl_summary",
            "pd_lgd_ead",
            "var_trend",
            "stress_scenarios",
            "sensitivity",
            "var_summary",
            "lcr_nsfr_trend",
            "maturity_gap",
            "liquidity_buffer",
            "funding_structure",
            "lcr_gauge",
            "td_irncr",
            "td_irpos",
            "td_irriskcr",
            "td_irriskmr",
        ],
    },
    sample: {
        models: [
            { name: "Orders + People", count: 1 },
        ],
        tables: [
            "ACCOUNTS",
            "ANALYTIC_EVENTS",
            "FEEDBACK",
            "INVOICES",
            "ORDERS",
            "PEOPLE",
            "PRODUCTS",
            "REVIEWS",
        ],
    },
};

/* ─────────────────────────────────────────────
   SQL 하이라이팅 (간단 span 방식)
───────────────────────────────────────────── */
const SQL_KEYWORDS = [
    "SELECT", "FROM", "WHERE", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "ON", "GROUP BY",
    "ORDER BY", "HAVING", "LIMIT", "OFFSET", "INSERT", "UPDATE", "DELETE", "CREATE", "DROP",
    "ALTER", "AS", "AND", "OR", "NOT", "IN", "IS", "NULL", "COUNT", "SUM", "AVG", "MIN", "MAX",
    "DISTINCT", "CASE", "WHEN", "THEN", "ELSE", "END", "BETWEEN", "LIKE", "EXISTS", "WITH",
    "UNION", "ALL", "TOP", "SET", "INTO",
];

/* ─────────────────────────────────────────────
   저장 모달
───────────────────────────────────────────── */
function SaveModal({
    open,
    onClose,
    onSave,
}: {
    open: boolean;
    onClose: () => void;
    onSave: (title: string) => void;
}) {
    const [title, setTitle] = React.useState("");

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-foreground">질문 저장</h2>
                    <button
                        onClick={onClose}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">제목</label>
                    <input
                        autoFocus
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && title.trim()) onSave(title.trim());
                        }}
                        placeholder="질문 제목을 입력하세요"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={() => { if (title.trim()) onSave(title.trim()); }}
                        disabled={!title.trim()}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        저장
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   결과 테이블
───────────────────────────────────────────── */
interface QueryResult {
    columns: string[];
    rows: (string | number | null)[][];
    rowCount: number;
    duration: number;
}

function ResultTable({ result }: { result: QueryResult }) {
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30 shrink-0">
                <span className="text-xs text-muted-foreground">
                    {result.rowCount}행 · {result.duration}ms
                </span>
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Download className="h-3 w-3" />
                    CSV 내보내기
                </button>
            </div>
            <div className="overflow-auto flex-1">
                <table className="w-full text-xs border-collapse">
                    <thead>
                        <tr className="bg-muted/50 sticky top-0">
                            {result.columns.map((col) => (
                                <th
                                    key={col}
                                    className="px-4 py-2 text-left font-semibold text-foreground border-b border-border whitespace-nowrap"
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {result.rows.map((row, ri) => (
                            <tr
                                key={ri}
                                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                            >
                                {row.map((cell, ci) => (
                                    <td
                                        key={ci}
                                        className="px-4 py-2 text-muted-foreground whitespace-nowrap"
                                    >
                                        {cell === null ? (
                                            <span className="text-muted-foreground/40 italic">null</span>
                                        ) : (
                                            String(cell)
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   스키마 패널 (우측)
───────────────────────────────────────────── */
function SchemaPanel({
    dbId,
    onClose,
    onTableClick,
}: {
    dbId: string;
    onClose: () => void;
    onTableClick: (table: string) => void;
}) {
    const schema = DB_SCHEMA[dbId] ?? DB_SCHEMA["sample"];
    const [openModels, setOpenModels] = React.useState(true);
    const [openTables, setOpenTables] = React.useState(true);
    const db = DATABASES.find((d) => d.id === dbId) ?? DATABASES[0];

    return (
        <div className="flex flex-col h-full w-72 border-l border-border bg-card shrink-0">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground truncate">{db.label}</span>
                </div>
                <button
                    onClick={onClose}
                    className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
                {/* 모델 섹션 */}
                <button
                    onClick={() => setOpenModels((p) => !p)}
                    className="flex items-center gap-2 w-full px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ChevronRight
                        className={cn("h-3.5 w-3.5 transition-transform", openModels && "rotate-90")}
                    />
                    <span>{schema.models.length} 모델</span>
                </button>
                {openModels &&
                    schema.models.map((m) => (
                        <button
                            key={m.name}
                            className="flex items-center gap-2 w-full px-6 py-1.5 text-sm text-primary hover:bg-muted/50 transition-colors text-left"
                        >
                            <div className="h-2 w-2 rounded-sm bg-primary/60 shrink-0" />
                            {m.name} #{m.count}
                        </button>
                    ))}

                {/* 테이블 섹션 */}
                <button
                    onClick={() => setOpenTables((p) => !p)}
                    className="flex items-center gap-2 w-full px-4 py-1.5 mt-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ChevronRight
                        className={cn("h-3.5 w-3.5 transition-transform", openTables && "rotate-90")}
                    />
                    <span>{schema.tables.length} 테이블</span>
                </button>
                {openTables &&
                    schema.tables.map((t) => (
                        <button
                            key={t}
                            onClick={() => onTableClick(t)}
                            className="flex items-center gap-2 w-full px-6 py-1.5 text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors text-left group"
                        >
                            <Table className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                            <span className="font-mono text-xs">{t}</span>
                        </button>
                    ))}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   메인 SQL 에디터
───────────────────────────────────────────── */
export function SqlEditor() {
    const router = useRouter();
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // 상태
    const [dbId, setDbId] = React.useState("insightbi");
    const [sql, setSql] = React.useState("SELECT * FROM TABLE_NAME");
    const [dbDropOpen, setDbDropOpen] = React.useState(false);
    const [schemaOpen, setSchemaOpen] = React.useState(true);
    const [result, setResult] = React.useState<QueryResult | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [saveOpen, setSaveOpen] = React.useState(false);
    const [lineCount, setLineCount] = React.useState(1);

    const dbDropRef = React.useRef<HTMLDivElement>(null);

    // db 드롭다운 외부 클릭 닫기
    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dbDropRef.current && !dbDropRef.current.contains(e.target as Node))
                setDbDropOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // 줄 수 계산
    React.useEffect(() => {
        setLineCount(sql.split("\n").length);
    }, [sql]);

    // SQL 포맷
    const handleFormat = () => {
        const formatted = sql
            .replace(/\bSELECT\b/gi, "SELECT")
            .replace(/\bFROM\b/gi, "\nFROM")
            .replace(/\bWHERE\b/gi, "\nWHERE")
            .replace(/\bJOIN\b/gi, "\nJOIN")
            .replace(/\bLEFT JOIN\b/gi, "\nLEFT JOIN")
            .replace(/\bINNER JOIN\b/gi, "\nINNER JOIN")
            .replace(/\bGROUP BY\b/gi, "\nGROUP BY")
            .replace(/\bORDER BY\b/gi, "\nORDER BY")
            .replace(/\bHAVING\b/gi, "\nHAVING")
            .replace(/\bLIMIT\b/gi, "\nLIMIT")
            .trim();
        setSql(formatted);
    };

    // SQL 실행 (목 데이터)
    const handleRun = async () => {
        if (!sql.trim() || sql.trim() === "SELECT * FROM TABLE_NAME") {
            setError("실행할 SQL을 입력하세요.");
            return;
        }
        setLoading(true);
        setError(null);
        setResult(null);
        await new Promise((r) => setTimeout(r, 800));
        setLoading(false);

        // 간단한 목 결과
        const isNCR = sql.toLowerCase().includes("ncr");
        const isVar = sql.toLowerCase().includes("var");

        if (isNCR) {
            setResult({
                columns: ["기준일", "ncr_ratio", "net_capital", "total_risk"],
                rows: [
                    ["2025-01", 187.4, 2850000, 1520000],
                    ["2025-02", 192.1, 2940000, 1530000],
                    ["2025-03", 189.8, 2910000, 1534000],
                    ["2025-04", 195.3, 3020000, 1547000],
                    ["2025-05", 198.7, 3100000, 1560000],
                ],
                rowCount: 5,
                duration: 42,
            });
        } else if (isVar) {
            setResult({
                columns: ["trade_date", "var_99", "var_95", "actual_loss"],
                rows: [
                    ["2025-03-01", 234.5, 156.3, 89.2],
                    ["2025-03-02", 241.8, 161.2, 102.4],
                    ["2025-03-03", 228.6, 152.4, 78.9],
                    ["2025-03-04", 256.3, 170.9, 134.5],
                    ["2025-03-05", 249.1, 166.1, 120.3],
                ],
                rowCount: 5,
                duration: 38,
            });
        } else {
            setResult({
                columns: ["id", "category", "value", "updated_at"],
                rows: [
                    [1, "신용리스크", "3.24%", "2025-03-10"],
                    [2, "시장리스크", "234.5억", "2025-03-10"],
                    [3, "유동성리스크", "187.4%", "2025-03-10"],
                    [4, "NCR리스크", "198.7%", "2025-03-10"],
                ],
                rowCount: 4,
                duration: 31,
            });
        }
    };

    // 테이블 클릭 → SQL에 삽입
    const handleTableClick = (table: string) => {
        setSql(`SELECT *\nFROM ${table}\nLIMIT 100`);
        textareaRef.current?.focus();
    };

    // Tab 키 처리
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const start = e.currentTarget.selectionStart;
            const end = e.currentTarget.selectionEnd;
            const newVal = sql.substring(0, start) + "  " + sql.substring(end);
            setSql(newVal);
            setTimeout(() => {
                textareaRef.current?.setSelectionRange(start + 2, start + 2);
            });
        }
        // Ctrl+Enter → 실행
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            handleRun();
        }
    };

    // 저장
    const handleSave = (title: string) => {
        const saved = JSON.parse(
            localStorage.getItem("insightbi_sql_questions_v1") || "[]"
        );
        saved.unshift({
            id: Date.now().toString(),
            title,
            sql,
            dbId,
            savedAt: new Date().toISOString(),
        });
        localStorage.setItem("insightbi_sql_questions_v1", JSON.stringify(saved));
        setSaveOpen(false);
        router.push("/questions");
    };

    const selectedDb = DATABASES.find((d) => d.id === dbId) ?? DATABASES[0];

    return (
        <div className="flex flex-col h-full bg-background">
            {/* ── 최상단 타이틀 바 ── */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-border bg-card shrink-0">
                <h1 className="text-sm font-semibold text-foreground">새 질문</h1>
                <div className="flex items-center gap-2">
                    <button
                        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted border border-border transition-colors"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        공유
                    </button>
                    <button
                        onClick={() => setSaveOpen(true)}
                        className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        <Save className="h-3.5 w-3.5" />
                        저장
                    </button>
                </div>
            </div>

            {/* ── 본문: 에디터 영역 + 스키마 패널 ── */}
            <div className="flex flex-1 min-h-0">
                {/* 에디터 + 결과 영역 */}
                <div className="flex flex-col flex-1 min-w-0">
                    {/* 에디터 툴바 */}
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card shrink-0">
                        {/* DB 선택 드롭다운 */}
                        <div ref={dbDropRef} className="relative">
                            <button
                                onClick={() => setDbDropOpen((p) => !p)}
                                className="flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors min-w-[160px]"
                            >
                                <Database className="h-3.5 w-3.5 text-primary" />
                                <span className="flex-1 text-left text-xs">{selectedDb.label}</span>
                                <ChevronDown
                                    className={cn(
                                        "h-3.5 w-3.5 text-muted-foreground transition-transform",
                                        dbDropOpen && "rotate-180"
                                    )}
                                />
                            </button>
                            {dbDropOpen && (
                                <div className="absolute top-full left-0 mt-1 z-50 w-52 rounded-xl border border-border bg-card shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
                                    <div className="px-3 py-2 border-b border-border">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                                            데이터베이스 선택
                                        </p>
                                    </div>
                                    <div className="p-1.5 space-y-0.5">
                                        {DATABASES.map((db) => (
                                            <button
                                                key={db.id}
                                                onClick={() => {
                                                    setDbId(db.id);
                                                    setDbDropOpen(false);
                                                }}
                                                className={cn(
                                                    "flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm text-left transition-colors",
                                                    dbId === db.id
                                                        ? "bg-primary/10 text-primary font-medium"
                                                        : "hover:bg-muted text-foreground"
                                                )}
                                            >
                                                <Database className="h-3.5 w-3.5 shrink-0" />
                                                {db.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 구분 */}
                        <div className="h-5 w-px bg-border" />

                        {/* 포맷 버튼 */}
                        <button
                            onClick={handleFormat}
                            title="SQL 포맷 (Ctrl+Shift+F)"
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                            <AlignLeft className="h-3.5 w-3.5" />
                        </button>

                        {/* 스키마 패널 토글 */}
                        <button
                            onClick={() => setSchemaOpen((p) => !p)}
                            title="스키마 브라우저"
                            className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-md border border-border transition-colors",
                                schemaOpen
                                    ? "bg-primary/10 text-primary border-primary/30"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                        >
                            <Table className="h-3.5 w-3.5" />
                        </button>

                        {/* 새로고침 */}
                        <button
                            onClick={() => { setResult(null); setError(null); }}
                            title="결과 지우기"
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                        </button>

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* 힌트 */}
                        <span className="text-[11px] text-muted-foreground hidden md:block">
                            Ctrl + Enter 로 실행
                        </span>

                        {/* 실행 버튼 */}
                        <button
                            onClick={handleRun}
                            disabled={loading}
                            className={cn(
                                "flex h-8 items-center gap-2 rounded-md px-4 text-sm font-semibold transition-all",
                                loading
                                    ? "bg-primary/60 text-white cursor-not-allowed"
                                    : "bg-primary text-white hover:bg-primary/90 shadow-sm hover:shadow"
                            )}
                        >
                            {loading ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Play className="h-3.5 w-3.5" />
                            )}
                            {loading ? "실행 중..." : "실행"}
                        </button>
                    </div>

                    {/* SQL 에디터 본체 */}
                    <div className="flex flex-1 min-h-0 overflow-hidden">
                        {/* 좌측 줄번호 */}
                        <div className="select-none border-r border-border bg-muted/20 px-3 py-4 text-right font-mono text-xs text-muted-foreground/60 shrink-0 overflow-hidden"
                            style={{ minWidth: "3rem" }}>
                            {Array.from({ length: lineCount }, (_, i) => (
                                <div key={i} className="leading-6">{i + 1}</div>
                            ))}
                        </div>

                        {/* textarea 에디터 */}
                        <div className="relative flex-1 min-w-0">
                            <textarea
                                ref={textareaRef}
                                value={sql}
                                onChange={(e) => setSql(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="SELECT * FROM table_name"
                                spellCheck={false}
                                className={cn(
                                    "absolute inset-0 w-full h-full resize-none",
                                    "bg-transparent font-mono text-sm text-foreground",
                                    "px-4 py-4 outline-none leading-6",
                                    "placeholder:text-muted-foreground/40",
                                    "selection:bg-primary/20"
                                )}
                            />
                        </div>
                    </div>

                    {/* ── 결과 영역 ── */}
                    <div className="border-t border-border bg-card" style={{ height: "220px" }}>
                        {error ? (
                            <div className="flex flex-col items-center justify-center h-full gap-2 text-destructive">
                                <Terminal className="h-6 w-6 opacity-60" />
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        ) : loading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3">
                                <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                                <p className="text-sm text-muted-foreground">쿼리 실행 중…</p>
                            </div>
                        ) : result ? (
                            <ResultTable result={result} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground select-none">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
                                    <Terminal className="h-5 w-5 opacity-50" />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-sm">
                                        코드를 실행하려면 실행 버튼을 클릭하거나{" "}
                                        <kbd className="inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-mono">
                                            Ctrl
                                        </kbd>{" "}
                                        +{" "}
                                        <kbd className="inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-mono">
                                            Enter
                                        </kbd>
                                        를 입력하시시요.
                                    </p>
                                    <p className="text-xs text-muted-foreground/70">결과가 표시되는 위치</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── 스키마 패널 (우측) ── */}
                {schemaOpen && (
                    <SchemaPanel
                        dbId={dbId}
                        onClose={() => setSchemaOpen(false)}
                        onTableClick={handleTableClick}
                    />
                )}
            </div>

            {/* 저장 모달 */}
            <SaveModal
                open={saveOpen}
                onClose={() => setSaveOpen(false)}
                onSave={handleSave}
            />
        </div>
    );
}
