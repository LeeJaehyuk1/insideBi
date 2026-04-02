import { SqlEditor } from "@/components/questions/SqlEditor";

export const metadata = {
  title: "새 질문 · SQL 에디터 — Insight BI",
  description: "SQL 에디터로 직접 쿼리를 작성하고 결과를 시각화하세요",
};

export default function NewQuestionPage() {
  return <SqlEditor />;
}
