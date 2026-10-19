"use client";

import { type ReactNode, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";

export type MenuItem = {
  label: string;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
  /** Motivo exibido quando desabilitado (title + texto auxiliar). */
  disabledReason?: string;
};

/** Menu de ações "⋯" com teclado (setas, Esc) e clique fora para fechar. */
export function ActionMenu({ label, items }: { label: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    rootRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not([disabled])')?.focus();
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setOpen(false);
      buttonRef.current?.focus();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const nodes = Array.from(
      rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])') ??
        [],
    );
    const index = nodes.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === "ArrowDown" ? index + 1 : index - 1;
    nodes[(next + nodes.length) % nodes.length]?.focus();
  };

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-ring rounded-md p-1.5 focus-visible:outline-2"
      >
        <svg viewBox="0 0 20 20" className="size-5" fill="currentColor" aria-hidden="true">
          <path d="M10 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM10 8.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM11.5 15.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
        </svg>
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className="border-border bg-surface-raised absolute right-0 z-20 mt-1 w-60 overflow-hidden rounded-xl border py-1 shadow-xl"
        >
          {items.map((item) => (
            <MenuButton
              key={item.label}
              item={item}
              onDone={() => {
                setOpen(false);
                item.onSelect();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MenuButton({ item, onDone }: { item: MenuItem; onDone: () => void }): ReactNode {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={item.disabled}
      title={item.disabled ? item.disabledReason : undefined}
      onClick={onDone}
      className={cn(
        "hover:bg-muted focus-visible:bg-muted flex w-full flex-col items-start px-3 py-2 text-left text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent",
        item.danger ? "text-danger" : "text-foreground",
      )}
    >
      <span>{item.label}</span>
      {item.disabled && item.disabledReason && (
        <span className="text-muted-foreground text-xs">{item.disabledReason}</span>
      )}
    </button>
  );
}
