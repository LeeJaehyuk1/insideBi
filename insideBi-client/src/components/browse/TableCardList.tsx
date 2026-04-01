
import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, Zap } from "lucide-react";

interface TableInfo {
  tableId: string;
  label: string;
  datasetId?: string;
}

interface Props {
  dbId: string;
  tables: TableInfo[];
}

export default function TableCardList({ dbId, tables }: Props) {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {tables.map((table) => (
        <div
          key={table.tableId}
          className="relative flex items-center rounded-xl border border-border bg-background hover:border-primary/40 hover:shadow-sm transition-all group"
          onMouseEnter={() => setHoveredId(table.tableId)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <Link
            to={`/browse/${dbId}/${table.tableId}`}
            className="flex flex-1 items-center gap-3 px-5 py-4 pr-10"
          >
            <LayoutGrid className="h-5 w-5 text-primary shrink-0" />
            <span className="text-sm font-semibold text-primary group-hover:text-primary/80 transition-colors">
              {table.label}
            </span>
          </Link>

          {/* 호버 시에만 표시되는 Zap 버튼 */}
          <button
            onClick={() => navigate(`/xray/${dbId}/${table.tableId}`)}
            title="X-ray — 자동 분석"
            className={`
              absolute right-3 top-1/2 -translate-y-1/2
              p-1.5 rounded-lg transition-all duration-150
              text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20
              ${hoveredId === table.tableId ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"}
            `}
          >
            <Zap className="h-4 w-4 fill-yellow-400" />
          </button>
        </div>
      ))}
    </div>
  );
}
