import { SqlEditor } from "@/components/questions/SqlEditor";

export const metadata = {
  title: "New Question · SQL Editor",
  description: "Write SQL, execute queries, and save chart-ready questions.",
};

export default function NewQuestionPage() {
  return <SqlEditor />;
}
