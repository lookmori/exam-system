import { cn } from "@/lib/utils";
import { FileQuestion, Sparkles } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-20 text-center",
        className
      )}
    >
      {icon || (
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-fun-lavender-light to-fun-pink-light border-2 border-fun-lavender/10">
          <FileQuestion className="h-10 w-10 text-fun-lavender" />
        </div>
      )}
      <h3 className="mt-5 text-lg font-bold text-slate-700">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-slate-500 max-w-sm font-medium">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
