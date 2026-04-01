
import * as React from "react";
import type { SavedQuestion } from "@/types/question";

const LS_KEY = "insightbi_questions_v1";

function load(): SavedQuestion[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function save(questions: SavedQuestion[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(questions));
}

export function useSavedQuestions() {
  const [questions, setQuestions] = React.useState<SavedQuestion[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setQuestions(load());
    setHydrated(true);
  }, []);

  const saveQuestion = (q: Omit<SavedQuestion, "id" | "savedAt">) => {
    const next: SavedQuestion = {
      ...q,
      id: Math.random().toString(36).slice(2, 9),
      savedAt: new Date().toISOString(),
    };
    const updated = [next, ...questions];
    setQuestions(updated);
    save(updated);
    return next;
  };

  const deleteQuestion = (id: string) => {
    const updated = questions.filter((q) => q.id !== id);
    setQuestions(updated);
    save(updated);
  };

  const updateQuestion = (id: string, updates: Partial<Omit<SavedQuestion, "id" | "savedAt">>) => {
    const updated = questions.map((q) =>
      q.id === id ? { ...q, ...updates, savedAt: new Date().toISOString() } : q
    );
    setQuestions(updated);
    save(updated);
  };

  const getQuestion = (id: string) => questions.find((q) => q.id === id);

  return { questions, hydrated, saveQuestion, updateQuestion, deleteQuestion, getQuestion };
}
