import * as React from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  BarChart3,
  Database,
  Play,
  Save,
  Table2,
  FileCode2,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Hash,
  Check,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { apiFetch } from "@/lib/api-client";
import { useSavedQuestions } from "@/hooks/useSavedQuestions";
import type { QueryParamDefinition, QueryParamType, SavedQuestion, VisualizationConfig } from "@/types/question";
import { SaveQuestionModal } from "./SaveQuestionModal";

type ColumnType = "string" | "number" | "date" | "boolean" | "unknown";
type ResultRow = Record<string, unknown>;

interface QueryColumn {
  name: string;
  dataType: ColumnType;
}

interface QueryExecutionResult {
  columns: QueryColumn[];
  rows: ResultRow[];
  rowCount: number;
  durationMs: number;
  executedSql: string;
}

const CHART_COLORS = ["#2563eb", "#16a34a", "#f97316", "#dc2626", "#7c3aed", "#0891b2"];

function inferColumnType(value: unknown): ColumnType {
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "string") {
    if (!Number.isNaN(Date.parse(value))) return "date";
    return "string";
  }
  return "unknown";
}

function buildResult(raw: {
  rows?: ResultRow[];
  rowCount?: number;
  durationMs?: number;
  executedSql?: string;
  columns?: QueryColumn[];
}): QueryExecutionResult {
  const rows = Array.isArray(raw.rows) ? raw.rows : [];
  const columns =
    Array.isArray(raw.columns) && raw.columns.length > 0
      ? raw.columns
      : Object.keys(rows[0] ?? {}).map((name) => ({
          name,
          dataType: inferColumnType(rows[0]?.[name]),
        }));

  return {
    columns,
    rows,
    rowCount: typeof raw.rowCount === "number" ? raw.rowCount : rows.length,
    durationMs: typeof raw.durationMs === "number" ? raw.durationMs : 0,
    executedSql: typeof raw.executedSql === "string" ? raw.executedSql : "",
  };
}

function extractParams(sql: string, existing: QueryParamDefinition[]): QueryParamDefinition[] {
  const matches = Array.from(sql.matchAll(/:([a-zA-Z_][a-zA-Z0-9_]*)/g)).map((match) => match[1]);
  const unique = Array.from(new Set(matches));
  return unique.map((key) => {
    const prev = existing.find((param) => param.key === key);
    return prev ?? { key, type: "text", required: true };
  });
}

function compileSqlWithParams(
  sql: string,
  values: Record<string, string>,
): { sql: string; params: Array<string | number> } {
  const params: Array<string | number> = [];
  const compiledSql = sql.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, key: string) => {
    const rawValue = values[key] ?? "";
    const numericValue = rawValue !== "" && !Number.isNaN(Number(rawValue)) ? Number(rawValue) : rawValue;
    params.push(numericValue);
    return "?";
  });
  return { sql: compiledSql, params };
}

function getDimensionColumns(columns: QueryColumn[]) {
  return columns.filter((column) => column.dataType !== "number");
}

function getMeasureColumns(columns: QueryColumn[]) {
  return columns.filter((column) => column.dataType === "number");
}

function ResultTable({ result }: { result: QueryExecutionResult }) {
  return (
    <div className="overflow-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {result.columns.map((column) => (
              <th key={column.name} className="px-3 py-2 text-left font-semibold text-foreground whitespace-nowrap">
                {column.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-border/60 last:border-0">
              {result.columns.map((column) => (
                <td key={column.name} className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                  {row[column.name] === null || row[column.name] === undefined ? "null" : String(row[column.name])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResultChart({
  result,
  visualization,
}: {
  result: QueryExecutionResult;
  visualization: VisualizationConfig;
}) {
  const rows = result.rows;
  const xField = visualization.xField || visualization.categoryField;
  const yField = visualization.yField;

  if (visualization.type === "kpi") {
    const numericColumn = result.columns.find((column) => column.dataType === "number");
    const field = yField || numericColumn?.name;
    const value = field ? rows[0]?.[field] : null;
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card">
        <div className="text-center">
          <p className="text-4xl font-bold text-foreground">
            {typeof value === "number" ? value.toLocaleString() : String(value ?? "-")}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{field ?? "value"}</p>
        </div>
      </div>
    );
  }

  if (!xField || !yField) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
        차트 필드 매핑을 먼저 선택하세요.
      </div>
    );
  }

  if (visualization.type === "pie") {
    const data = rows.map((row) => ({
      name: String(row[xField] ?? ""),
      value: Number(row[yField] ?? 0),
    }));
    return (
      <div className="h-72 rounded-xl border border-border bg-card p-3">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={100}>
              {data.map((_, index) => (
                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            {visualization.showLegend !== false && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const common = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
      <XAxis dataKey={xField} tick={{ fontSize: 11 }} />
      <YAxis tick={{ fontSize: 11 }} />
      <Tooltip />
      {visualization.showLegend !== false && <Legend />}
    </>
  );

  return (
    <div className="h-72 rounded-xl border border-border bg-card p-3">
      <ResponsiveContainer width="100%" height="100%">
        {visualization.type === "line" ? (
          <LineChart data={rows}>
            {common}
            <Line type="monotone" dataKey={yField} stroke="#2563eb" strokeWidth={2} dot={false} />
          </LineChart>
        ) : (
          <BarChart data={rows}>
            {common}
            <Bar dataKey={yField} fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function ParamEditor({
  params,
  values,
  onTypeChange,
  onValueChange,
}: {
  params: QueryParamDefinition[];
  values: Record<string, string>;
  onTypeChange: (key: string, type: QueryParamType) => void;
  onValueChange: (key: string, value: string) => void;
}) {
  if (params.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
        SQL 안의 `:param` 형식 파라미터를 자동으로 인식합니다.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {params.map((param) => (
        <div key={param.key} className="grid gap-2 rounded-xl border border-border bg-card p-3 md:grid-cols-[1fr_140px]">
          <div>
            <p className="text-sm font-medium text-foreground">{param.key}</p>
            <input
              type={param.type === "number" ? "number" : param.type === "date" ? "date" : "text"}
              value={values[param.key] ?? param.defaultValue ?? ""}
              onChange={(event) => onValueChange(param.key, event.target.value)}
              className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Type</p>
            <select
              value={param.type}
              onChange={(event) => onTypeChange(param.key, event.target.value as QueryParamType)}
              className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="text">text</option>
              <option value="number">number</option>
              <option value="date">date</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SqlEditor() {
  const [searchParams] = useSearchParams();
  const questionId = searchParams.get("id");
  const { getQuestion, saveQuestion, updateQuestion, hydrated } = useSavedQuestions();
  const existingQuestion = questionId ? getQuestion(questionId) : undefined;

  const [title, setTitle] = React.useState(existingQuestion?.title ?? "SQL Query");
  const [sql, setSql] = React.useState(
    existingQuestion?.sql ??
      "select month, npl\nfrom npl_trend\nwhere month between :start_date and :end_date\norder by month",
  );
  const [description, setDescription] = React.useState(existingQuestion?.description ?? "");
  const [params, setParams] = React.useState<QueryParamDefinition[]>(existingQuestion?.params ?? []);
  const [paramValues, setParamValues] = React.useState<Record<string, string>>(
    Object.fromEntries((existingQuestion?.params ?? []).map((param) => [param.key, param.defaultValue ?? ""])),
  );
  const [visualization, setVisualization] = React.useState<VisualizationConfig>(
    existingQuestion?.visualization ?? { type: "table", showLegend: true },
  );
  const [result, setResult] = React.useState<QueryExecutionResult | null>(null);
  const [activeTab, setActiveTab] = React.useState<"table" | "chart" | "meta">("table");
  const [isRunning, setIsRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saveOpen, setSaveOpen] = React.useState(false);
  const [savedDest, setSavedDest] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!hydrated || !existingQuestion) return;
    setTitle(existingQuestion.title);
    setSql(existingQuestion.sql);
    setDescription(existingQuestion.description ?? "");
    setParams(existingQuestion.params);
    setParamValues(Object.fromEntries(existingQuestion.params.map((param) => [param.key, param.defaultValue ?? ""])));
    setVisualization(existingQuestion.visualization);
  }, [existingQuestion, hydrated]);

  React.useEffect(() => {
    setParams((prev) => extractParams(sql, prev));
  }, [sql]);

  React.useEffect(() => {
    if (!result) return;
    const dimensions = getDimensionColumns(result.columns);
    const measures = getMeasureColumns(result.columns);
    setVisualization((prev) => ({
      ...prev,
      xField: prev.xField && result.columns.some((column) => column.name === prev.xField)
        ? prev.xField
        : dimensions[0]?.name,
      categoryField: prev.categoryField && result.columns.some((column) => column.name === prev.categoryField)
        ? prev.categoryField
        : dimensions[0]?.name,
      yField: prev.yField && result.columns.some((column) => column.name === prev.yField)
        ? prev.yField
        : measures[0]?.name,
    }));
  }, [result]);

  React.useEffect(() => {
    if (!savedDest) return;
    const timer = window.setTimeout(() => setSavedDest(null), 4000);
    return () => window.clearTimeout(timer);
  }, [savedDest]);

  const runQuery = async () => {
    if (!sql.trim()) {
      setError("SQL을 입력하세요.");
      return;
    }

    setIsRunning(true);
    setError(null);

    try {
      const compiled = compileSqlWithParams(sql, paramValues);
      const body = {
        sql: compiled.sql,
        params: compiled.params,
      };
      const response = await apiFetch("/api/db-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(typeof json.error === "string" ? json.error : "쿼리 실행에 실패했습니다.");
      }
      setResult(buildResult(json));
      setActiveTab(visualization.type === "table" ? "table" : "chart");
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "쿼리 실행에 실패했습니다.");
      setResult(null);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSave = (nextTitle: string, nextDescription: string) => {
    const payload = {
      title: nextTitle,
      description: nextDescription,
      sql,
      params,
      visualization,
      datasetId: existingQuestion?.datasetId,
    };

    if (existingQuestion) {
      updateQuestion(existingQuestion.id, payload);
      setSavedDest(`/questions/${existingQuestion.id}`);
    } else {
      const saved = saveQuestion(payload);
      setSavedDest(`/questions/${saved.id}`);
    }

    setTitle(nextTitle);
    setDescription(nextDescription);
    setSaveOpen(false);
  };

  const dimensions = result ? getDimensionColumns(result.columns) : [];
  const measures = result ? getMeasureColumns(result.columns) : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">SQL Workspace</p>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full bg-transparent text-2xl font-bold text-foreground outline-none"
          />
          <p className="text-sm text-muted-foreground">
            SQL을 직접 실행하고, 결과 컬럼만 매핑해서 차트를 구성합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSaveOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <Save className="h-4 w-4" />
            저장
          </button>
          <button
            onClick={runQuery}
            disabled={isRunning}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            <Play className="h-4 w-4" />
            {isRunning ? "실행 중..." : "실행"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_420px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <FileCode2 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">SQL</h2>
            </div>
            <textarea
              value={sql}
              onChange={(event) => setSql(event.target.value)}
              spellCheck={false}
              className="min-h-[360px] w-full resize-y bg-transparent p-4 font-mono text-sm leading-6 text-foreground outline-none"
            />
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">결과</h2>
            </div>

            <div className="flex items-center gap-2">
              {(["table", "chart", "meta"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-1.5 text-sm ${
                    activeTab === tab
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {tab === "table" ? "Table" : tab === "chart" ? "Chart" : "Meta"}
                </button>
              ))}
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {!result ? (
              <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
                실행 후 결과가 표시됩니다.
              </div>
            ) : activeTab === "table" ? (
              <ResultTable result={result} />
            ) : activeTab === "chart" ? (
              <ResultChart result={result} visualization={visualization} />
            ) : (
              <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                <p>Rows: {result.rowCount}</p>
                <p>Duration: {result.durationMs}ms</p>
                <p className="mt-3 font-medium text-foreground">Executed SQL</p>
                <pre className="mt-2 overflow-auto rounded-lg bg-muted/40 p-3 text-xs">{result.executedSql || sql}</pre>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <Hash className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Parameters</h2>
            </div>
            <ParamEditor
              params={params}
              values={paramValues}
              onTypeChange={(key, type) => {
                setParams((prev) => prev.map((param) => (param.key === key ? { ...param, type } : param)));
              }}
              onValueChange={(key, value) => {
                setParamValues((prev) => ({ ...prev, [key]: value }));
              }}
            />
          </section>

          <section className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Visualization</h2>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[
                { type: "table", label: "Table", icon: Table2 },
                { type: "bar", label: "Bar", icon: BarChart3 },
                { type: "line", label: "Line", icon: LineChartIcon },
                { type: "pie", label: "Pie", icon: PieChartIcon },
                { type: "kpi", label: "Metric", icon: Hash },
              ].map((item) => {
                const Icon = item.icon;
                const selected = visualization.type === item.type;
                return (
                  <button
                    key={item.type}
                    onClick={() => setVisualization((prev) => ({ ...prev, type: item.type as VisualizationConfig["type"] }))}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-xs ${
                      selected ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {result && visualization.type !== "table" && visualization.type !== "kpi" && (
              <div className="mt-4 space-y-3">
                <div>
                  <p className="mb-1 text-sm font-medium text-foreground">X field</p>
                  <select
                    value={visualization.type === "pie" ? visualization.categoryField ?? "" : visualization.xField ?? ""}
                    onChange={(event) =>
                      setVisualization((prev) => ({
                        ...prev,
                        xField: visualization.type === "pie" ? prev.xField : event.target.value,
                        categoryField: visualization.type === "pie" ? event.target.value : prev.categoryField,
                      }))
                    }
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">선택</option>
                    {dimensions.map((column) => (
                      <option key={column.name} value={column.name}>
                        {column.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium text-foreground">Y field</p>
                  <select
                    value={visualization.yField ?? ""}
                    onChange={(event) => setVisualization((prev) => ({ ...prev, yField: event.target.value }))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">선택</option>
                    {measures.map((column) => (
                      <option key={column.name} value={column.name}>
                        {column.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {result && visualization.type === "kpi" && (
              <div className="mt-4">
                <p className="mb-1 text-sm font-medium text-foreground">Value field</p>
                <select
                  value={visualization.yField ?? ""}
                  onChange={(event) => setVisualization((prev) => ({ ...prev, yField: event.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">선택</option>
                  {measures.map((column) => (
                    <option key={column.name} value={column.name}>
                      {column.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </section>
        </div>
      </div>

      <SaveQuestionModal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        onSave={(nextTitle, nextDescription) => handleSave(nextTitle, nextDescription)}
        tableLabel={title}
        filters={[]}
        columnLabels={{}}
      />

      {savedDest && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-2xl">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>질문이 저장되었습니다.</span>
          <Link to={savedDest} className="text-emerald-300 underline underline-offset-2 hover:text-emerald-200">
            열기
          </Link>
          <button onClick={() => setSavedDest(null)} className="text-white/50 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
