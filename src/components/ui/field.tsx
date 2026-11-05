import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

const control =
  "block w-full rounded-lg border border-input bg-surface px-3 text-sm text-foreground shadow-xs placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring/40 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-danger aria-invalid:focus-visible:outline-danger/30";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, "h-10", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(control, "h-10 pr-8", className)} {...props} />;
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("text-foreground text-sm font-medium", className)} {...props} />;
}

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * Rótulo + controle + dica/erro, com ids acessíveis.
 * O controle filho deve receber id={id} e aria-describedby={describedBy(id, ...)}.
 */
export function Field({ id, label, error, hint, required, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-danger text-xs font-medium" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-muted-foreground text-xs">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** aria-describedby coerente com o que o Field renderiza. */
export function describedBy(id: string, error?: string, hint?: ReactNode): string | undefined {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export function FormAlert({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <div
      role="alert"
      className="border-danger/30 bg-danger-soft text-danger rounded-lg border px-3 py-2.5 text-sm"
    >
      {children}
    </div>
  );
}
