import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type Tone = "primary" | "neutral" | "warning";

const tones: Record<Tone, string> = {
  primary: "bg-accent text-accent-foreground ring-primary/20",
  neutral: "bg-muted text-muted-foreground ring-border",
  warning: "bg-warning-soft text-warning-foreground ring-warning-foreground/20",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
