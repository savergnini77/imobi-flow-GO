"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";

import { cn } from "@/lib/utils/cn";

type BaseProps = {
  open: boolean;
  /** Chamado em Esc, clique no fundo ou botão fechar. Retorne sem fechar para bloquear. */
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/**
 * Usa o <dialog> nativo (foco preso, Esc e camada superior de graça, sem libs).
 * variant "modal" = centralizado; "sheet" = painel lateral direito.
 */
function NativeDialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  variant,
}: BaseProps & { variant: "modal" | "sheet" }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      data-variant={variant}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        "bg-surface-raised text-foreground shadow-2xl backdrop:backdrop-blur-[1px]",
        variant === "modal" &&
          "border-border m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border p-0",
        variant === "sheet" &&
          "border-border my-0 mr-0 ml-auto h-dvh max-h-dvh w-full max-w-xl border-l p-0 sm:rounded-l-2xl",
        className,
      )}
    >
      {open && (
        <div className={cn("flex flex-col", variant === "sheet" && "h-full")}>
          <header className="border-border flex items-start justify-between gap-4 border-b px-5 py-4">
            <div>
              <h2 id={titleId} className="text-base font-semibold">
                {title}
              </h2>
              {description && (
                <div id={descriptionId} className="text-muted-foreground mt-1 text-sm">
                  {description}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-ring -mr-1 rounded-md p-1 focus-visible:outline-2"
              aria-label="Fechar"
            >
              <svg viewBox="0 0 20 20" className="size-5" fill="currentColor" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </header>
          <div className={cn("px-5 py-4", variant === "sheet" && "flex-1 overflow-y-auto")}>
            {children}
          </div>
          {footer && (
            <footer className="border-border flex flex-col-reverse gap-2 border-t px-5 py-3 sm:flex-row sm:justify-end">
              {footer}
            </footer>
          )}
        </div>
      )}
    </dialog>
  );
}

export function Dialog(props: BaseProps) {
  return <NativeDialog {...props} variant="modal" />;
}

export function Sheet(props: BaseProps) {
  return <NativeDialog {...props} variant="sheet" />;
}
