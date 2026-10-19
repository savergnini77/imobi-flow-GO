"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  BuildingIcon,
  ChatIcon,
  MapPinIcon,
  PhoneIcon,
  PlusIcon,
  StarIcon,
  TeamIcon,
  UsersIcon,
} from "@/components/shared/icons";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ActionMenu, type MenuItem } from "@/components/ui/menu";
import { cn } from "@/lib/utils/cn";
import { formatAddress, formatPhone, whatsappUrl } from "@/modules/locations/format";
import type { LocationFilters } from "@/modules/locations/schema";
import type { LocationWithStats } from "@/modules/locations/types";

import { LocationFormSheet } from "./location-form-sheet";
import { LocationsToolbar } from "./locations-toolbar";
import { deleteBlockedReason, useLocationActions } from "./use-location-actions";

export type LocationPermissions = {
  create: boolean;
  update: boolean;
  delete: boolean;
  manageMembers: boolean;
};

export function LocationsBoard({
  companyName,
  locations,
  totals,
  filters,
  can,
}: {
  companyName: string;
  locations: LocationWithStats[];
  totals: { total: number; active: number };
  filters: LocationFilters;
  can: LocationPermissions;
}) {
  const router = useRouter();
  // undefined = fechado; null = nova filial; Location = editar.
  const [editing, setEditing] = useState<LocationWithStats | null | undefined>(undefined);
  const actions = useLocationActions();
  const isFiltered = Boolean(filters.q) || filters.status !== "all";

  const openCreate = () => setEditing(null);

  const menuFor = (location: LocationWithStats): MenuItem[] => {
    const items: MenuItem[] = [
      { label: "Ver detalhes", onSelect: () => router.push(`/settings/locations/${location.id}`) },
    ];
    if (can.update) {
      items.push({ label: "Editar", onSelect: () => setEditing(location) });
      if (!location.isHeadquarters) {
        items.push({
          label: "Definir como matriz",
          onSelect: () => actions.askHeadquarters(location),
          disabled: !location.isActive,
          disabledReason: "Reative a filial antes.",
        });
      }
      items.push(
        location.isActive
          ? {
              label: "Desativar",
              onSelect: () => actions.askDeactivate(location),
              disabled: location.isHeadquarters,
              disabledReason: "A matriz não pode ser desativada.",
            }
          : { label: "Reativar", onSelect: () => actions.reactivate(location) },
      );
    }
    if (can.delete) {
      const reason = deleteBlockedReason(location);
      items.push({
        label: "Excluir",
        danger: true,
        onSelect: () => actions.askDelete(location),
        disabled: Boolean(reason),
        disabledReason: reason ?? undefined,
      });
    }
    return items;
  };

  const inactive = totals.total - totals.active;

  return (
    <>
      <PageHeader
        eyebrow={companyName}
        title="Filiais"
        description={
          totals.total === 0
            ? "Organize seus escritórios, corretores e equipes por região."
            : `${totals.active} ${totals.active === 1 ? "filial ativa" : "filiais ativas"}${
                inactive ? ` · ${inactive} ${inactive === 1 ? "inativa" : "inativas"}` : ""
              }`
        }
        actions={
          can.create && (
            <Button onClick={openCreate}>
              <PlusIcon className="size-4" />
              Nova filial
            </Button>
          )
        }
      />

      <div className="mt-6">
        <LocationsToolbar filters={filters} />
      </div>

      <div className="mt-6">
        {locations.length === 0 ? (
          isFiltered ? (
            <EmptyState
              icon={<MapPinIcon />}
              title="Nenhuma filial encontrada"
              description="Tente outro termo de busca ou mude o filtro de status."
              action={
                <Button variant="secondary" onClick={() => router.replace("/settings/locations")}>
                  Limpar filtros
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<BuildingIcon />}
              title="Cadastre sua primeira filial"
              description="Organize corretores e equipes por região e tenha o contato de cada escritório à mão."
              action={
                can.create && (
                  <Button onClick={openCreate}>
                    <PlusIcon className="size-4" />
                    Nova filial
                  </Button>
                )
              }
            />
          )
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {locations.map((location) => (
              <li key={location.id}>
                <LocationCard location={location} menu={menuFor(location)} />
              </li>
            ))}
            {can.create && !isFiltered && (
              <li>
                <button
                  type="button"
                  onClick={openCreate}
                  className="border-border text-muted-foreground hover:border-primary/50 hover:bg-accent/40 hover:text-accent-foreground focus-visible:outline-ring flex h-full min-h-48 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-sm font-medium transition-colors focus-visible:outline-2"
                >
                  <PlusIcon />
                  Adicionar filial
                </button>
              </li>
            )}
          </ul>
        )}
      </div>

      {editing !== undefined && (
        <LocationFormSheet
          key={editing?.id ?? "new"}
          open
          location={editing}
          onClose={() => setEditing(undefined)}
        />
      )}
      {actions.dialog}
    </>
  );
}

function LocationCard({ location, menu }: { location: LocationWithStats; menu: MenuItem[] }) {
  const address = formatAddress(location);
  const whats = whatsappUrl(location.whatsapp);

  return (
    <article
      className={cn(
        "bg-surface relative flex h-full flex-col rounded-2xl border shadow-xs transition-shadow hover:shadow-md",
        location.isHeadquarters ? "border-primary/40" : "border-border",
        !location.isActive && "opacity-75",
      )}
    >
      <div className="flex items-start gap-3 p-5 pb-4">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            location.isHeadquarters
              ? "bg-primary text-primary-foreground"
              : "bg-accent text-accent-foreground",
          )}
        >
          {location.isHeadquarters ? <StarIcon /> : <BuildingIcon />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold">
            <Link
              href={`/settings/locations/${location.id}`}
              className="after:focus-visible:outline-ring after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none after:focus-visible:outline-2"
            >
              {location.name}
            </Link>
          </h2>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {location.isHeadquarters && <Badge tone="primary">Matriz</Badge>}
            {!location.isActive && <Badge tone="warning">Inativa</Badge>}
            {location.code && <Badge>{location.code}</Badge>}
          </div>
        </div>
        {/* Fica acima do link "esticado" do card. */}
        <div className="relative z-10">
          <ActionMenu label={`Ações de ${location.name}`} items={menu} />
        </div>
      </div>

      <div className="flex-1 space-y-2 px-5 text-sm">
        <p className="text-muted-foreground flex gap-2">
          <MapPinIcon className="mt-0.5 size-4 shrink-0" />
          {address ? (
            <span className="line-clamp-2">{address}</span>
          ) : (
            <span className="italic">Endereço não informado</span>
          )}
        </p>
        {(location.phone || whats) && (
          <p className="relative z-10 flex flex-wrap items-center gap-x-4 gap-y-1">
            {location.phone && (
              <a
                href={`tel:+55${location.phone}`}
                className="hover:text-primary inline-flex items-center gap-1.5"
              >
                <PhoneIcon className="text-muted-foreground size-4" />
                {formatPhone(location.phone)}
              </a>
            )}
            {whats && (
              <a
                href={whats}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary inline-flex items-center gap-1.5"
              >
                <ChatIcon className="text-muted-foreground size-4" />
                WhatsApp
              </a>
            )}
          </p>
        )}
      </div>

      <dl className="divide-border border-border mt-4 grid grid-cols-2 divide-x border-t text-sm">
        <div className="flex items-center gap-2 px-5 py-3">
          <UsersIcon className="text-muted-foreground size-4" />
          <dt className="sr-only">Corretores</dt>
          <dd>
            <span className="font-semibold tabular-nums">{location.memberCount}</span>{" "}
            <span className="text-muted-foreground">
              {location.memberCount === 1 ? "pessoa" : "pessoas"}
            </span>
          </dd>
        </div>
        <div className="flex items-center gap-2 px-5 py-3">
          <TeamIcon className="text-muted-foreground size-4" />
          <dt className="sr-only">Equipes</dt>
          <dd>
            <span className="font-semibold tabular-nums">{location.teamCount}</span>{" "}
            <span className="text-muted-foreground">
              {location.teamCount === 1 ? "equipe" : "equipes"}
            </span>
          </dd>
        </div>
      </dl>
    </article>
  );
}
