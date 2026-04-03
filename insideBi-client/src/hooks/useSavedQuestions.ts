import * as React from "react";
import type { SavedQuestion, QueryParamDefinition, VisualizationConfig } from "@/types/question";

const LS_KEY = "insightbi_questions_v1";

type LegacyQuestion = {
  id?: string;
  title?: string;
  sql?: string;
  chartType?: string;
  vizSettings?: { xKey?: string; yKey?: string; showLegend?: boolean };
  savedAt?: string;
  updatedAt?: string;
  datasetId?: string;
};

function normalizeParams(params: unknown): QueryParamDefinition[] {
  if (!Array.isArray(params)) return [];
  const normalized: QueryParamDefinition[] = [];
  for (const item of params) {
      if (!item || typeof item !== "object") continue;
      const raw = item as Record<string, unknown>;
      const key = typeof raw.key === "string" ? raw.key.trim() : "";
      if (!key) continue;
      const type = raw.type === "number" || raw.type === "date" ? raw.type : "text";
      normalized.push({
        key,
        label: typeof raw.label === "string" ? raw.label : undefined,
        type,
        required: Boolean(raw.required),
        defaultValue: typeof raw.defaultValue === "string" ? raw.defaultValue : undefined,
      });
  }
  return normalized;
}

function normalizeVisualization(
  visualization: unknown,
  legacy?: LegacyQuestion,
): VisualizationConfig {
  if (visualization && typeof visualization === "object") {
    const raw = visualization as Record<string, unknown>;
    const type = raw.type;
    if (type === "table" || type === "line" || type === "bar" || type === "pie" || type === "kpi") {
      return {
        type,
        xField: typeof raw.xField === "string" ? raw.xField : undefined,
        yField: typeof raw.yField === "string" ? raw.yField : undefined,
        categoryField: typeof raw.categoryField === "string" ? raw.categoryField : undefined,
        showLegend: typeof raw.showLegend === "boolean" ? raw.showLegend : true,
      };
    }
  }

  const fallbackType =
    legacy?.chartType === "line" ||
    legacy?.chartType === "bar" ||
    legacy?.chartType === "pie" ||
    legacy?.chartType === "kpi"
      ? legacy.chartType
      : "table";

  return {
    type: fallbackType,
    xField: legacy?.vizSettings?.xKey,
    yField: legacy?.vizSettings?.yKey,
    showLegend: legacy?.vizSettings?.showLegend ?? true,
  };
}

function normalizeQuestion(item: unknown): SavedQuestion | null {
  if (!item || typeof item !== "object") return null;
  const raw = item as Record<string, unknown>;
  const legacy = raw as LegacyQuestion;
  const sql = typeof raw.sql === "string" ? raw.sql : "";
  if (!sql.trim()) return null;

  const now = new Date().toISOString();
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : Math.random().toString(36).slice(2, 9),
    title: typeof raw.title === "string" && raw.title.trim() ? raw.title.trim() : "SQL Query",
    description: typeof raw.description === "string" ? raw.description : undefined,
    sql,
    params: normalizeParams(raw.params),
    visualization: normalizeVisualization(raw.visualization, legacy),
    savedAt: typeof raw.savedAt === "string" ? raw.savedAt : now,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : typeof raw.savedAt === "string" ? raw.savedAt : now,
    datasetId: typeof raw.datasetId === "string" ? raw.datasetId : undefined,
  };
}

function load(): SavedQuestion[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeQuestion)
      .filter((question): question is SavedQuestion => question !== null);
  } catch {
    return [];
  }
}

function persist(questions: SavedQuestion[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(questions));
}

export function useSavedQuestions() {
  const [questions, setQuestions] = React.useState<SavedQuestion[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const loaded = load();
    setQuestions(loaded);
    persist(loaded);
    setHydrated(true);
  }, []);

  const saveQuestion = (question: Partial<Omit<SavedQuestion, "id" | "savedAt" | "updatedAt">> & { title: string }) => {
    const now = new Date().toISOString();
    const next: SavedQuestion = {
      id: Math.random().toString(36).slice(2, 9),
      title: question.title,
      description: question.description,
      sql: question.sql ?? "select 1",
      params: question.params ?? [],
      visualization: question.visualization ?? { type: "table", showLegend: true },
      savedAt: now,
      updatedAt: now,
      datasetId: question.datasetId,
    };
    setQuestions((prev) => {
      const updated = [next, ...prev];
      persist(updated);
      return updated;
    });
    return next;
  };

  const updateQuestion = (id: string, updates: Partial<Omit<SavedQuestion, "id" | "savedAt" | "updatedAt">>) => {
    setQuestions((prev) => {
      const updated = prev.map((question) =>
        question.id === id
          ? {
              ...question,
              ...updates,
              sql: updates.sql ?? question.sql,
              params: updates.params ?? question.params,
              visualization: updates.visualization ?? question.visualization,
              updatedAt: new Date().toISOString(),
            }
          : question,
      );
      persist(updated);
      return updated;
    });
  };

  const deleteQuestion = (id: string) => {
    setQuestions((prev) => {
      const updated = prev.filter((question) => question.id !== id);
      persist(updated);
      return updated;
    });
  };

  const getQuestion = (id: string) => questions.find((question) => question.id === id);

  return { questions, hydrated, saveQuestion, updateQuestion, deleteQuestion, getQuestion };
}
