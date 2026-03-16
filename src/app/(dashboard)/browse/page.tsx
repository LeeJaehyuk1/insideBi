import Link from "next/link";
import { Database, BookOpen, Plus } from "lucide-react";
import { DATABASES } from "@/lib/db-catalog";

export default function BrowsePage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">데이터베이스</h1>
        </div>
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <BookOpen className="h-4 w-4" />
          데이터에 대해 알아보기
        </button>
      </div>

      {/* DB 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* DB 카드들 */}
        {DATABASES.map((db) => (
          <Link
            key={db.id}
            href={`/browse/${db.id}`}
            className="flex flex-col gap-4 rounded-xl border border-border bg-background p-6 hover:border-primary/50 hover:shadow-md transition-all group"
          >
            {/* DB 아이콘 */}
            <div className="flex h-12 w-12 items-center justify-center">
              <Database className="h-10 w-10 text-violet-500" />
            </div>
            {/* DB 이름 */}
            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              {db.label}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
