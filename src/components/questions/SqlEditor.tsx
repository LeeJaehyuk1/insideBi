"use client";

import * as React from "react";
import Link from "next/link";
import {
    ChevronDown, Play, AlignLeft, Download, RefreshCw, X,
    Database, Table, ChevronRight, Terminal, Save, ExternalLink,
    BarChart2, LineChart, PieChart, Activity, Hash, Grid,
    Layers, TrendingUp, CircleDot, GitBranch, Crosshair, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    BarChart, Bar, LineChart as RLineChart, Line,
    PieChart as RPieChart, Pie, Cell,
    AreaChart, Area, RadarChart, Radar, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis,
    ScatterChart, Scatter as RScatter,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer,
} from "recharts";
import { VizPickerPanel, VizSettingsPanel } from "./NoCodeBuilder";
import { DEFAULT_VIZ_SETTINGS } from "./ChartSettingsSidebar";
import type { VizSettings } from "./ChartSettingsSidebar";
import { SaveQuestionModal } from "./SaveQuestionModal";
import { useSavedQuestions } from "@/hooks/useSavedQuestions";
import { useCollectionFolders } from "@/hooks/useCollectionFolders";
import type { FolderEntry } from "@/lib/mock-data/collection-folders";
import type { ColumnMeta } from "@/types/dataset";
import type { ChartType } from "@/types/builder";

/* ─────────────────────────────────────────
   색상 팔레트
───────────────────────────────────────── */
const CHART_COLORS = [
    "#509EE3", "#4CAF50", "#FF9800", "#9C27B0",
    "#E91E63", "#00BCD4", "#FF5722", "#607D8B",
];

/* ── 기존 자체 ChartType 정의 제거 (NoCodeBuilder와 동일한 타입 사용) ── */

/* ─────────────────────────────────────────
   DB 정의
───────────────────────────────────────── */
const DATABASES = [
    { id: "insightbi", label: "InsightBi DB" },
    { id: "sample", label: "Sample Database" },
];

const DB_SCHEMA: Record<string, { models: { name: string; count: number }[]; tables: string[] }> = {
    insightbi: {
        models: [{ name: "리스크 대시보드", count: 4 }],
        tables: [
            "td_irncr", "td_irpos", "td_irriskcr", "td_irriskmr",
            "td_dmaqfx", "td_dmaqindex", "td_dmaqvol",
        ],
    },
    sample: {
        models: [{ name: "Orders + People", count: 1 }],
        tables: ["ACCOUNTS", "ANALYTIC_EVENTS", "FEEDBACK", "INVOICES", "ORDERS", "PEOPLE", "PRODUCTS", "REVIEWS"],
    },
};

/* ─────────────────────────────────────────
   QueryResult 타입
───────────────────────────────────────── */
interface QueryResult {
    columns: string[];
    rows: (string | number | null)[][];
    rowCount: number;
    duration: number;
}

/* SaveModal 제거 — SaveQuestionModal로 대체 */

/* ─────────────────────────────────────────
   결과 테이블
───────────────────────────────────────── */
function ResultTable({ result }: { result: QueryResult }) {
    return (
        <div className="overflow-auto h-full">
            <table className="w-full text-xs border-collapse">
                <thead>
                    <tr className="bg-muted/50 sticky top-0 z-10">
                        {result.columns.map((col) => (
                            <th key={col} className="px-4 py-2.5 text-left font-semibold text-foreground border-b border-border whitespace-nowrap">
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {result.rows.map((row, ri) => (
                        <tr key={ri} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            {row.map((cell, ci) => (
                                <td key={ci} className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                                    {cell === null ? <span className="text-muted-foreground/40 italic">null</span> : String(cell)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* ─────────────────────────────────────────
   차트 렌더러 (Metabase 스타일 설정 지원 - 간단화 구현)
───────────────────────────────────────── */
function ChartRenderer({ result, chartType, settings }: { result: QueryResult; chartType: ChartType; settings: VizSettings }) {
    // 데이터 변환: rows → [{col0: v, col1: v, ...}]
    const data = result.rows.map((row) => {
        const obj: Record<string, string | number | null> = {};
        result.columns.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
    });

    const [labelKey] = result.columns;
    const valueKeys = result.columns.slice(1).filter((c) => {
        return data.some((d) => typeof d[c] === "number");
    });
    if (valueKeys.length === 0) valueKeys.push(result.columns[1] ?? result.columns[0]);

    const rx = settings.xKey || labelKey;
    const ry = settings.yKey || valueKeys[0];
    const color = settings.color || "#509EE3";

    const TICK_STYLE = { fontSize: 11, fill: "var(--muted-foreground)" };

    /* 숫자 카드 (KPI) */
    if (chartType === "kpi") {
        const val = data[0]?.[ry];
        return (
            <div className="flex flex-col items-center justify-center h-full gap-2">
                <p className="text-4xl font-bold" style={{ color }}>
                    {typeof val === "number" ? val.toLocaleString() : String(val ?? "—")}
                </p>
                <p className="text-sm text-muted-foreground">{ry}</p>
            </div>
        );
    }

    /* 파이 */
    if (chartType === "pie") {
        const pieData = data.map((d) => ({
            name: String(d[rx]),
            value: Number(d[ry] ?? 0),
        }));
        return (
            <ResponsiveContainer width="100%" height="100%">
                <RPieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={settings.showLabels ? undefined : false} labelLine={settings.showLabels}>
                        {pieData.map((_, i) => <Cell key={i} fill={i === 0 ? color : CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => v.toLocaleString()} />
                    {settings.showLegend && <Legend />}
                </RPieChart>
            </ResponsiveContainer>
        );
    }

    /* 면적 */
    if (chartType === "area") {
        return (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey={rx} tick={TICK_STYLE} label={settings.xLabel ? { value: settings.xLabel, position: "insideBottom", offset: -4, fontSize: 11 } : undefined} />
                    <YAxis tick={TICK_STYLE} label={settings.yLabel ? { value: settings.yLabel, angle: -90, position: "insideLeft", fontSize: 11 } : undefined} />
                    <Tooltip />
                    {settings.showLegend && <Legend />}
                    <Area type="monotone" dataKey={ry} stroke={color} fill={`${color}20`} strokeWidth={2} />
                </AreaChart>
            </ResponsiveContainer>
        );
    }

    /* 선 */
    if (chartType === "line") {
        return (
            <ResponsiveContainer width="100%" height="100%">
                <RLineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey={rx} tick={TICK_STYLE} label={settings.xLabel ? { value: settings.xLabel, position: "insideBottom", offset: -4, fontSize: 11 } : undefined} />
                    <YAxis tick={TICK_STYLE} label={settings.yLabel ? { value: settings.yLabel, angle: -90, position: "insideLeft", fontSize: 11 } : undefined} />
                    <Tooltip />
                    {settings.showLegend && <Legend />}
                    <Line type="monotone" dataKey={ry} stroke={color} strokeWidth={2} dot={settings.showLabels} />
                </RLineChart>
            </ResponsiveContainer>
        );
    }



    /* 기본: 바 차트 */
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey={rx} tick={TICK_STYLE} label={settings.xLabel ? { value: settings.xLabel, position: "insideBottom", offset: -4, fontSize: 11 } : undefined} />
                <YAxis tick={TICK_STYLE} label={settings.yLabel ? { value: settings.yLabel, angle: -90, position: "insideLeft", fontSize: 11 } : undefined} />
                <Tooltip />
                {settings.showLegend && <Legend />}
                <Bar dataKey={ry} fill={color} radius={[3, 3, 0, 0]} label={settings.showLabels ? { position: "top", fontSize: 10 } : false} />
            </BarChart>
        </ResponsiveContainer>
    );
}

/* (ChartTypePanel 삭제 - VizPickerPanel로 대체) */

/* ─────────────────────────────────────────
   스키마 패널 (우측)
───────────────────────────────────────── */
function SchemaPanel({ dbId, onClose, onTableClick }: {
    dbId: string; onClose: () => void; onTableClick: (t: string) => void;
}) {
    const schema = DB_SCHEMA[dbId] ?? DB_SCHEMA["sample"];
    const [openModels, setOpenModels] = React.useState(true);
    const [openTables, setOpenTables] = React.useState(true);
    const db = DATABASES.find((d) => d.id === dbId) ?? DATABASES[0];

    return (
        <div className="flex flex-col h-full w-64 border-l border-border bg-card shrink-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground truncate">{db.label}</span>
                </div>
                <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted transition-colors">
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
                <button onClick={() => setOpenModels((p) => !p)}
                    className="flex items-center gap-2 w-full px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", openModels && "rotate-90")} />
                    <span>{schema.models.length} 모델</span>
                </button>
                {openModels && schema.models.map((m) => (
                    <button key={m.name} className="flex items-center gap-2 w-full px-6 py-1.5 text-sm text-primary hover:bg-muted/50 transition-colors text-left">
                        <div className="h-2 w-2 rounded-sm bg-primary/60 shrink-0" />
                        {m.name} #{m.count}
                    </button>
                ))}
                <button onClick={() => setOpenTables((p) => !p)}
                    className="flex items-center gap-2 w-full px-4 py-1.5 mt-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", openTables && "rotate-90")} />
                    <span>{schema.tables.length} 테이블</span>
                </button>
                {openTables && schema.tables.map((t) => (
                    <button key={t} onClick={() => onTableClick(t)}
                        className="flex items-center gap-2 w-full px-6 py-1.5 text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors text-left group">
                        <Table className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                        <span className="font-mono text-xs truncate">{t}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   메인 SQL 에디터
───────────────────────────────────────── */
export function SqlEditor() {
    const { saveQuestion } = useSavedQuestions();
    const { addEntry } = useCollectionFolders();
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const [savedDest, setSavedDest] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!savedDest) return;
        const t = setTimeout(() => setSavedDest(null), 5000);
        return () => clearTimeout(t);
    }, [savedDest]);

    const [dbId, setDbId] = React.useState("insightbi");
    const [sql, setSql] = React.useState("SELECT * FROM TABLE_NAME");
    const [dbDropOpen, setDbDropOpen] = React.useState(false);
    const [schemaOpen, setSchemaOpen] = React.useState(true);
    const [result, setResult] = React.useState<QueryResult | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [saveOpen, setSaveOpen] = React.useState(false);
    const [lineCount, setLineCount] = React.useState(1);

    // 시각화 관련 (Metabase 스타일)
    const [vizPanelMode, setVizPanelMode] = React.useState<"none" | "picker" | "settings">("none");
    const [resultDisplayMode, setResultDisplayMode] = React.useState<"table" | "chart">("table");
    const [chartType, setChartType] = React.useState<ChartType>("bar");
    const [vizSettings, setVizSettings] = React.useState<VizSettings>(DEFAULT_VIZ_SETTINGS);

    const dbDropRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dbDropRef.current && !dbDropRef.current.contains(e.target as Node)) setDbDropOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    React.useEffect(() => { setLineCount(sql.split("\n").length); }, [sql]);

    const handleFormat = () => {
        setSql(
            sql
                .replace(/\bSELECT\b/gi, "SELECT").replace(/\bFROM\b/gi, "\nFROM")
                .replace(/\bWHERE\b/gi, "\nWHERE").replace(/\bLEFT JOIN\b/gi, "\nLEFT JOIN")
                .replace(/\bINNER JOIN\b/gi, "\nINNER JOIN").replace(/\bJOIN\b/gi, "\nJOIN")
                .replace(/\bGROUP BY\b/gi, "\nGROUP BY").replace(/\bORDER BY\b/gi, "\nORDER BY")
                .replace(/\bHAVING\b/gi, "\nHAVING").replace(/\bLIMIT\b/gi, "\nLIMIT").trim()
        );
    };

    const handleRun = async () => {
        if (!sql.trim() || sql.trim() === "SELECT * FROM TABLE_NAME") {
            setError("실행할 SQL을 입력하세요."); return;
        }
        setLoading(true); setError(null); setResult(null);
        await new Promise((r) => setTimeout(r, 700));
        setLoading(false);

        const q = sql.toLowerCase();
        if (q.includes("ncr")) {
            setResult({
                columns: ["기준일", "ncr_ratio", "net_capital", "total_risk"],
                rows: [
                    ["2024-10", 183.2, 2780000, 1517000],
                    ["2024-11", 187.4, 2850000, 1520000],
                    ["2024-12", 192.1, 2940000, 1530000],
                    ["2025-01", 189.8, 2910000, 1534000],
                    ["2025-02", 195.3, 3020000, 1547000],
                    ["2025-03", 198.7, 3100000, 1560000],
                ],
                rowCount: 6, duration: 42,
            });
        } else if (q.includes("var")) {
            setResult({
                columns: ["trade_date", "var_99", "var_95", "actual_loss"],
                rows: [
                    ["03-01", 234.5, 156.3, 89.2],
                    ["03-02", 241.8, 161.2, 102.4],
                    ["03-03", 228.6, 152.4, 78.9],
                    ["03-04", 256.3, 170.9, 134.5],
                    ["03-05", 249.1, 166.1, 120.3],
                    ["03-06", 261.4, 174.3, 140.7],
                ],
                rowCount: 6, duration: 38,
            });
        } else if (q.includes("sector") || q.includes("exposure")) {
            setResult({
                columns: ["sector", "exposure"],
                rows: [
                    ["제조업", 8420], ["금융업", 6230], ["건설업", 4180],
                    ["유통업", 3560], ["IT", 2980], ["부동산", 2450],
                    ["서비스", 1870], ["기타", 1340],
                ],
                rowCount: 8, duration: 29,
            });
        } else if (q.includes("credit") || q.includes("npl")) {
            setResult({
                columns: ["월", "npl_ratio", "pd", "lgd"],
                rows: [
                    ["2024-10", 1.82, 2.14, 41.3],
                    ["2024-11", 1.89, 2.21, 41.8],
                    ["2024-12", 1.95, 2.18, 42.1],
                    ["2025-01", 1.91, 2.09, 41.6],
                    ["2025-02", 1.87, 2.05, 41.2],
                    ["2025-03", 1.84, 2.01, 40.8],
                ],
                rowCount: 6, duration: 33,
            });
        } else {
            setResult({
                columns: ["category", "value", "prev_value"],
                rows: [
                    ["신용리스크", 324, 298],
                    ["시장리스크", 187, 203],
                    ["유동성리스크", 241, 219],
                    ["NCR리스크", 198, 191],
                ],
                rowCount: 4, duration: 31,
            });
        }
        setResultDisplayMode("table");
        setVizPanelMode("none");
    };

    const handleTableClick = (table: string) => {
        setSql(`SELECT *\nFROM ${table}\nLIMIT 100`);
        textareaRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const s = e.currentTarget.selectionStart, en = e.currentTarget.selectionEnd;
            const v = sql.substring(0, s) + "  " + sql.substring(en);
            setSql(v);
            setTimeout(() => textareaRef.current?.setSelectionRange(s + 2, s + 2));
        }
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleRun();
    };

    const handleConfirmSave = (title: string, _desc: string, targetColId: string) => {
        const datasetId = `sql:${dbId}`;
        const saved = saveQuestion({ title, datasetId, sql, filters: [], chartType, vizSettings });
        const finalColId = targetColId || "our-analytics";
        const entry: FolderEntry = {
            id: `q-${saved.id}`, type: "question", name: title,
            lastEditor: "나",
            lastModified: new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }),
            href: `/questions/${saved.id}`,
        };
        addEntry(finalColId, entry);
        setSaveOpen(false);
        const dest = finalColId === "our-analytics" ? "/collections" : `/collections/${finalColId}`;
        setSavedDest(dest);
    };

    const selectedDb = DATABASES.find((d) => d.id === dbId) ?? DATABASES[0];
    const RESULT_HEIGHT = 280;

    return (
        <div className="flex flex-col h-full bg-background">

            {/* ── 타이틀 바 ── */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-border bg-card shrink-0">
                <h1 className="text-sm font-semibold text-foreground">새 질문</h1>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted border border-border transition-colors">
                        <ExternalLink className="h-3.5 w-3.5" />공유
                    </button>
                    <button onClick={() => setSaveOpen(true)}
                        className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                        <Save className="h-3.5 w-3.5" />저장
                    </button>
                </div>
            </div>

            {/* ── 본문 ── */}
            <div className="flex flex-1 min-h-0">
                {/* 에디터 + 결과 */}
                <div className="flex flex-col flex-1 min-w-0">

                    {/* 툴바 */}
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card shrink-0">
                        {/* DB 드롭다운 */}
                        <div ref={dbDropRef} className="relative">
                            <button onClick={() => setDbDropOpen((p) => !p)}
                                className="flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors min-w-[160px]">
                                <Database className="h-3.5 w-3.5 text-primary" />
                                <span className="flex-1 text-left text-xs">{selectedDb.label}</span>
                                <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", dbDropOpen && "rotate-180")} />
                            </button>
                            {dbDropOpen && (
                                <div className="absolute top-full left-0 mt-1 z-50 w-52 rounded-xl border border-border bg-card shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
                                    <div className="px-3 py-2 border-b border-border">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">데이터베이스 선택</p>
                                    </div>
                                    <div className="p-1.5 space-y-0.5">
                                        {DATABASES.map((db) => (
                                            <button key={db.id} onClick={() => { setDbId(db.id); setDbDropOpen(false); }}
                                                className={cn("flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm text-left transition-colors",
                                                    dbId === db.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground")}>
                                                <Database className="h-3.5 w-3.5 shrink-0" />{db.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="h-5 w-px bg-border" />

                        <button onClick={handleFormat} title="SQL 포맷"
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <AlignLeft className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setSchemaOpen((p) => !p)} title="스키마 브라우저"
                            className={cn("flex h-8 w-8 items-center justify-center rounded-md border border-border transition-colors",
                                schemaOpen ? "bg-primary/10 text-primary border-primary/30" : "text-muted-foreground hover:bg-muted")}>
                            <Table className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => { setResult(null); setError(null); setResultDisplayMode("table"); setVizPanelMode("none"); }} title="결과 지우기"
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <RefreshCw className="h-3.5 w-3.5" />
                        </button>

                        <div className="flex-1" />
                        <span className="text-[11px] text-muted-foreground hidden md:block">Ctrl + Enter 로 실행</span>
                        <button onClick={handleRun} disabled={loading}
                            className={cn("flex h-8 items-center gap-2 rounded-md px-4 text-sm font-semibold transition-all",
                                loading ? "bg-primary/60 text-white cursor-not-allowed" : "bg-primary text-white hover:bg-primary/90 shadow-sm hover:shadow")}>
                            {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                            {loading ? "실행 중..." : "실행"}
                        </button>
                    </div>

                    {/* SQL 에디터 본체 */}
                    <div className="flex flex-1 min-h-0 overflow-hidden">
                        <div className="select-none border-r border-border bg-muted/20 px-3 py-4 text-right font-mono text-xs text-muted-foreground/60 shrink-0" style={{ minWidth: "3rem" }}>
                            {Array.from({ length: lineCount }, (_, i) => (
                                <div key={i} className="leading-6">{i + 1}</div>
                            ))}
                        </div>
                        <div className="relative flex-1 min-w-0">
                            <textarea
                                ref={textareaRef} value={sql}
                                onChange={(e) => setSql(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="SELECT * FROM table_name"
                                spellCheck={false}
                                className="absolute inset-0 w-full h-full resize-none bg-transparent font-mono text-sm text-foreground px-4 py-4 outline-none leading-6 placeholder:text-muted-foreground/40 selection:bg-primary/20"
                            />
                        </div>
                    </div>

                    {/* ── 결과 영역 ── */}
                    <div className="border-t border-border flex flex-col shrink-0" style={{ height: `${RESULT_HEIGHT}px` }}>
                        {error ? (
                            <div className="flex flex-col items-center justify-center flex-1 gap-2 text-destructive">
                                <Terminal className="h-6 w-6 opacity-60" />
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        ) : loading ? (
                            <div className="flex flex-col items-center justify-center flex-1 gap-3">
                                <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                                <p className="text-sm text-muted-foreground">쿼리 실행 중…</p>
                            </div>
                        ) : result ? (
                            <>
                                {/* 결과 본문: 시각화 패널 + 차트/테이블 */}
                                <div className="flex flex-1 min-h-0 bg-background">
                                    {/* 시각화 모드일 때 좌측 차트 설정/타입 패널 */}
                                    {vizPanelMode !== "none" && (
                                        <div className="w-[260px] shrink-0 border-r border-border bg-card flex flex-col overflow-hidden">
                                            {vizPanelMode === "picker" && (
                                                <VizPickerPanel
                                                    selected={chartType}
                                                    onSelect={(type) => {
                                                        setChartType(type);
                                                        if (type === "table") {
                                                            setResultDisplayMode("table");
                                                            setVizPanelMode("none");
                                                        } else {
                                                            setResultDisplayMode("chart");
                                                            setVizPanelMode("settings");
                                                        }
                                                    }}
                                                    onDone={() => setVizPanelMode("none")}
                                                />
                                            )}
                                            {vizPanelMode === "settings" && (
                                                <VizSettingsPanel
                                                    chartType={chartType}
                                                    settings={vizSettings}
                                                    onSettingsChange={(s) => setVizSettings((p) => ({ ...p, ...s }))}
                                                    columns={result.columns.map(k => ({ key: k, label: k, type: "string", role: "dimension", aggregatable: true, filterable: true }))}
                                                    data={result.rows.map((row) => {
                                                        const obj: Record<string, unknown> = {};
                                                        result.columns.forEach((col, i) => { obj[col] = row[i]; });
                                                        return obj;
                                                    })}
                                                    xKey={result.columns[0]}
                                                    yKey={result.columns[1] ?? result.columns[0]}
                                                    onBack={() => setVizPanelMode("picker")}
                                                    onDone={() => setVizPanelMode("none")}
                                                />
                                            )}
                                        </div>
                                    )}

                                    {/* 결과 표시 영역 */}
                                    <div className="flex-1 min-w-0 overflow-hidden p-2">
                                        {resultDisplayMode === "table" ? (
                                            <ResultTable result={result} />
                                        ) : (
                                            <div className="h-full w-full">
                                                <ChartRenderer result={result} chartType={chartType} settings={vizSettings} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 결과 하단 바 */}
                                <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/20 shrink-0">
                                    {/* 좌측: 시각화 버튼 + 표/차트 토글 */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setVizPanelMode((p) => p === "none" ? "picker" : "none")}
                                            className={cn(
                                                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                                                vizPanelMode !== "none"
                                                    ? "bg-primary text-white"
                                                    : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border"
                                            )}
                                        >
                                            <BarChart2 className="h-3.5 w-3.5" />
                                            시각화
                                        </button>

                                        <div className="flex items-center border border-border rounded-lg overflow-hidden">
                                            <button
                                                onClick={() => setResultDisplayMode("table")}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors",
                                                    resultDisplayMode === "table"
                                                        ? "bg-primary text-white"
                                                        : "text-muted-foreground hover:bg-muted"
                                                )}
                                                title="표"
                                            >
                                                <Grid className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setResultDisplayMode("chart");
                                                    if (chartType === "table") setChartType("bar");
                                                }}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors",
                                                    resultDisplayMode === "chart"
                                                        ? "bg-primary text-white"
                                                        : "text-muted-foreground hover:bg-muted"
                                                )}
                                                title="차트"
                                            >
                                                <BarChart2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* 우측: CSV + 행수/시간 */}
                                    <div className="flex items-center gap-3">
                                        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                            <Download className="h-3 w-3" />CSV
                                        </button>
                                        <span className="text-xs text-muted-foreground">
                                            최대 2,000행 표시 중 · {result.rowCount}행 · {result.duration}ms
                                        </span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* 빈 상태 */
                            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground select-none">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
                                    <Terminal className="h-5 w-5 opacity-50" />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-sm">
                                        코드를 실행하려면 실행 버튼을 클릭하거나{" "}
                                        <kbd className="inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-mono">Ctrl</kbd>
                                        {" "}+{" "}
                                        <kbd className="inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-mono">Enter</kbd>
                                        를 입력하세요.
                                    </p>
                                    <p className="text-xs text-muted-foreground/70">결과가 표시되는 위치</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 스키마 패널 */}
                {schemaOpen && (
                    <SchemaPanel dbId={dbId} onClose={() => setSchemaOpen(false)} onTableClick={handleTableClick} />
                )}
            </div>

            <SaveQuestionModal
                open={saveOpen}
                onClose={() => setSaveOpen(false)}
                onSave={handleConfirmSave}
                tableLabel={`SQL — ${DATABASES.find((d) => d.id === dbId)?.label ?? dbId}`}
                filters={[]}
                columnLabels={Object.fromEntries(
                    (result?.columns ?? []).map((c) => [c, c])
                )}
            />
            {savedDest && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-medium animate-in slide-in-from-bottom-4 duration-300 whitespace-nowrap">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>저장됐습니다</span>
                    <Link href={savedDest} className="font-semibold text-emerald-300 hover:text-emerald-200 underline underline-offset-2 ml-1">컬렉션에서 보기</Link>
                    <button onClick={() => setSavedDest(null)} className="ml-2 text-white/40 hover:text-white transition-colors"><X className="h-3.5 w-3.5" /></button>
                </div>
            )}
        </div>
    );
}
