import {
  ShieldAlert,
  BarChart3,
  FileText,
  Star,
  LayoutTemplate,
  Folder,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap = {
  ShieldAlert,
  BarChart3,
  FileText,
  Star,
  LayoutTemplate,
  Folder,
} as const;

interface CollectionIconProps {
  icon: string;
  color: string; // tailwind bg- class
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { wrapper: "h-8 w-8", icon: "h-4 w-4" },
  md: { wrapper: "h-10 w-10", icon: "h-5 w-5" },
  lg: { wrapper: "h-12 w-12", icon: "h-6 w-6" },
};

export function CollectionIcon({ icon, color, size = "md" }: CollectionIconProps) {
  const Icon = iconMap[icon as keyof typeof iconMap] ?? Folder;
  const s = sizeMap[size];
  return (
    <div className={cn("flex items-center justify-center rounded-lg shrink-0", color, s.wrapper)}>
      <Icon className={cn("text-white", s.icon)} />
    </div>
  );
}
