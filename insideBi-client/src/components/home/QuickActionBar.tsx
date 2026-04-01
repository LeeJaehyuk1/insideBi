import { Link } from "react-router-dom";
import { MessageSquarePlus, LayoutTemplate, Database, FolderOpen } from "lucide-react";

const ACTIONS = [
  {
    href: "/questions/new",
    label: "새 질문",
    icon: MessageSquarePlus,
    color: "bg-violet-500",
  },
  {
    href: "/builder",
    label: "새 대시보드",
    icon: LayoutTemplate,
    color: "bg-orange-500",
  },
  {
    href: "/browse",
    label: "데이터 탐색",
    icon: Database,
    color: "bg-slate-500",
  },
  {
    href: "/collections",
    label: "컬렉션",
    icon: FolderOpen,
    color: "bg-amber-500",
  },
];

export function QuickActionBar() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            to={action.href}
            className="flex items-center gap-2 rounded-lg border bg-card px-3.5 py-2 text-sm font-medium hover:border-primary/50 hover:shadow-sm transition-all"
          >
            <div className={`flex h-6 w-6 items-center justify-center rounded-md ${action.color}`}>
              <Icon className="h-3.5 w-3.5 text-white" />
            </div>
            {action.label}
          </Link>
        );
      })}
    </div>
  );
}
