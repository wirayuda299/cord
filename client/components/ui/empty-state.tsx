import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  className?: string;
  children?: ReactNode;
};

export function EmptyState({ icon, title, className, children }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-24 text-white/25 gap-3",
        className,
      )}
    >
      {icon}
      <p className="text-sm">{title}</p>
      {children}
    </div>
  );
}
