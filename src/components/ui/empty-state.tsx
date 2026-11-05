import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="border-border bg-surface flex flex-col items-center rounded-2xl border border-dashed px-6 py-14 text-center">
      {icon && (
        <div className="bg-accent text-accent-foreground mb-4 flex size-12 items-center justify-center rounded-full">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="text-muted-foreground mt-1 max-w-sm text-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-md ${className ?? ""}`} />;
}
