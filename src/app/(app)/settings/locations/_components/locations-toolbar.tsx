"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { SearchIcon } from "@/components/shared/icons";
import { Spinner } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { LocationFilters } from "@/modules/locations/schema";

const STATUS: { value: LocationFilters["status"]; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "active", label: "Ativas" },
  { value: "inactive", label: "Inativas" },
];

/** Busca + filtro de status, sincronizados com a URL (?q=&status=). */
export function LocationsToolbar({ filters }: { filters: LocationFilters }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(filters.q ?? "");
  const [lastUrlQuery, setLastUrlQuery] = useState(filters.q ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // A URL mudou por fora (ex.: "Limpar filtros", voltar no navegador):
  // sincroniza o campo. Enquanto o usuário digita, a URL acompanha o campo.
  if ((filters.q ?? "") !== lastUrlQuery) {
    setLastUrlQuery(filters.q ?? "");
    if ((filters.q ?? "") !== query.trim()) setQuery(filters.q ?? "");
  }

  const navigate = (next: Partial<{ q: string; status: string }>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value || (key === "status" && value === "all")) params.delete(key);
      else params.set(key, value);
    }
    const search = params.toString();
    startTransition(() =>
      router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false }),
    );
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:max-w-sm">
        <label htmlFor="locations-search" className="sr-only">
          Buscar filial
        </label>
        <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <input
          id="locations-search"
          type="search"
          value={query}
          placeholder="Buscar por nome, cidade, bairro ou código"
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => navigate({ q: value.trim() }), 300);
          }}
          className="border-input bg-surface placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-ring/40 h-10 w-full rounded-lg border pr-9 pl-9 text-sm shadow-xs focus-visible:outline-2"
        />
        {pending && (
          <Spinner className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2" />
        )}
      </div>

      <div
        role="radiogroup"
        aria-label="Status"
        className="border-border bg-surface inline-flex self-start rounded-lg border p-0.5 shadow-xs"
      >
        {STATUS.map((option) => {
          const checked = filters.status === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => navigate({ status: option.value })}
              className={cn(
                "focus-visible:outline-ring rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2",
                checked
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
