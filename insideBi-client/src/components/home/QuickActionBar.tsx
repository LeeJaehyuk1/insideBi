import { Link } from "react-router-dom";
import { LayoutTemplate, MessageSquarePlus } from "lucide-react";

const ACTIONS = [
  {
    href: "/questions/new",
    label: "새 질문",
    icon: MessageSquarePlus,
    color: "bg-violet-500",
  },
  {
    href: "/dashboards/new",
    label: "새 대시보드",
    icon: LayoutTemplate,
    color: "bg-orange-500",
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
            className="flex items-center gap-2 rounded-lg border bg-card px-3.5 py-2 text-sm font-medium transition-all hover:border-primary/50 hover:shadow-sm"
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
