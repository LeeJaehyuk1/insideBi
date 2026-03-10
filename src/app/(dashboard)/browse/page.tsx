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

        {/* 데이터베이스 추가하기 카드 */}
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/30 p-6 cursor-default">
          {/* DB 커넥터 아이콘들 */}
          <div className="flex items-center gap-2">
            {/* PostgreSQL */}
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#336791]/10 border border-[#336791]/20">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#336791]">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" opacity=".3"/>
                <path d="M11 7h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
            </div>
            {/* MySQL */}
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4479A1]/10 border border-[#4479A1]/20">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#4479A1]">
                <path d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z" opacity=".4"/>
                <path d="M9 9h6v6H9z"/>
              </svg>
            </div>
            {/* Snowflake */}
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#29B5E8]/10 border border-[#29B5E8]/20">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#29B5E8]">
                <path d="M12 2l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z"/>
              </svg>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">데이터베이스 추가하기</p>
            <p className="text-xs text-muted-foreground mt-1">
              20개 이상의 데이터 커넥터. 몇 분 안에 탐색을 시작하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
