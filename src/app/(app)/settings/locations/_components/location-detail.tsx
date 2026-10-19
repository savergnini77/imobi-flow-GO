"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";

import {
  ArrowLeftIcon,
  ChatIcon,
  ExternalIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  TeamIcon,
  UsersIcon,
} from "@/components/shared/icons";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/field";
import { ActionMenu, type MenuItem } from "@/components/ui/menu";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils/cn";
import {
  addLocationMember,
  linkTeam,
  removeLocationMember,
  unlinkTeam,
} from "@/modules/locations/actions";
import {
  formatAddress,
  formatCep,
  formatPhone,
  mapsUrl,
  whatsappUrl,
} from "@/modules/locations/format";
import type { Location, LocationMember, LocationTeam } from "@/modules/locations/types";

import type { LocationPermissions } from "./locations-board";
import { LocationFormSheet } from "./location-form-sheet";
import { deleteBlockedReason, useLocationActions } from "./use-location-actions";

type Tab = "members" | "teams";

export function LocationDetail({
  location,
  members,
  companyMembers,
  teams,
  can,
}: {
  location: Location;
  members: LocationMember[];
  companyMembers: LocationMember[];
  teams: LocationTeam[];
  can: LocationPermissions & { manageTeams: boolean };
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<Tab>("members");
  const actions = useLocationActions({ afterDelete: () => router.replace("/settings/locations") });
  const linkedTeams = teams.filter((t) => t.locationId === location.id);
  const tabsId = useId();

  const menu: MenuItem[] = [];
  if (can.update && !location.isHeadquarters) {
    menu.push({
      label: "Definir como matriz",
      onSelect: () => actions.askHeadquarters(location),
      disabled: !location.isActive,
      disabledReason: "Reative a filial antes.",
    });
  }
  if (can.update) {
    menu.push(
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
    const reason = deleteBlockedReason({
      ...location,
      memberCount: members.length,
      teamCount: linkedTeams.length,
    });
    menu.push({
      label: "Excluir",
      danger: true,
      onSelect: () => actions.askDelete(location),
      disabled: Boolean(reason),
      disabledReason: reason ?? undefined,
    });
  }

  const address = formatAddress(location);
  const maps = mapsUrl(location);
  const whats = whatsappUrl(location.whatsapp);

  return (
    <>
      <Link
        href="/settings/locations"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeftIcon className="size-4" />
        Filiais
      </Link>

      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {location.name}
            {location.isHeadquarters && <Badge tone="primary">Matriz</Badge>}
            {!location.isActive && <Badge tone="warning">Inativa</Badge>}
            {location.code && <Badge>{location.code}</Badge>}
          </span>
        }
        actions={
          <>
            {can.update && (
              <Button variant="secondary" onClick={() => setEditing(true)}>
                Editar
              </Button>
            )}
            {menu.length > 0 && <ActionMenu label="Mais ações" items={menu} />}
          </>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,20rem)_1fr]">
        {/* Resumo */}
        <section
          aria-labelledby="summary-title"
          className="border-border bg-surface h-fit rounded-2xl border p-5 shadow-xs"
        >
          <h2 id="summary-title" className="text-sm font-semibold">
            Contato e endereço
          </h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-2.5">
              <MapPinIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
              <span>
                {address || (
                  <span className="text-muted-foreground italic">Endereço não informado</span>
                )}
                {location.cep && (
                  <span className="text-muted-foreground block">CEP {formatCep(location.cep)}</span>
                )}
                {maps && (
                  <a
                    href={maps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary mt-1 inline-flex items-center gap-1 font-medium hover:underline"
                  >
                    Abrir no Google Maps
                    <ExternalIcon className="size-3.5" />
                  </a>
                )}
              </span>
            </li>
            <ContactRow icon={<PhoneIcon className="size-4" />} empty="Telefone não informado">
              {location.phone && (
                <a href={`tel:+55${location.phone}`} className="hover:text-primary">
                  {formatPhone(location.phone)}
                </a>
              )}
            </ContactRow>
            <ContactRow icon={<ChatIcon className="size-4" />} empty="WhatsApp não informado">
              {whats && (
                <a
                  href={whats}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary"
                >
                  {formatPhone(location.whatsapp)}
                </a>
              )}
            </ContactRow>
            <ContactRow icon={<MailIcon className="size-4" />} empty="E-mail não informado">
              {location.email && (
                <a href={`mailto:${location.email}`} className="hover:text-primary break-all">
                  {location.email}
                </a>
              )}
            </ContactRow>
          </ul>
        </section>

        {/* Abas: Corretores / Equipes */}
        <section className="border-border bg-surface min-w-0 rounded-2xl border shadow-xs">
          <div
            role="tablist"
            aria-label="Vínculos da filial"
            className="border-border flex gap-1 border-b px-3 pt-2"
          >
            <TabButton
              id={`${tabsId}-members`}
              active={tab === "members"}
              onClick={() => setTab("members")}
            >
              <UsersIcon className="size-4" /> Pessoas
              <Count>{members.length}</Count>
            </TabButton>
            <TabButton
              id={`${tabsId}-teams`}
              active={tab === "teams"}
              onClick={() => setTab("teams")}
            >
              <TeamIcon className="size-4" /> Equipes
              <Count>{linkedTeams.length}</Count>
            </TabButton>
          </div>
          <div role="tabpanel" aria-labelledby={`${tabsId}-${tab}`} className="p-5">
            {tab === "members" ? (
              <MembersPanel
                locationId={location.id}
                members={members}
                companyMembers={companyMembers}
                canManage={can.manageMembers}
              />
            ) : (
              <TeamsPanel locationId={location.id} teams={teams} canManage={can.manageTeams} />
            )}
          </div>
        </section>
      </div>

      {editing && (
        <LocationFormSheet
          key={location.updatedAt}
          open
          location={location}
          onClose={() => setEditing(false)}
        />
      )}
      {actions.dialog}
    </>
  );
}

function ContactRow({
  icon,
  empty,
  children,
}: {
  icon: React.ReactNode;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2.5">
      <span className="text-muted-foreground">{icon}</span>
      {children || <span className="text-muted-foreground italic">{empty}</span>}
    </li>
  );
}

function TabButton({
  id,
  active,
  onClick,
  children,
}: {
  id: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      id={id}
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "focus-visible:outline-ring -mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2",
        active
          ? "border-primary text-foreground"
          : "text-muted-foreground hover:text-foreground border-transparent",
      )}
    >
      {children}
    </button>
  );
}

function Count({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-muted text-muted-foreground rounded-full px-1.5 text-xs tabular-nums">
      {children}
    </span>
  );
}

/** Executa uma action com toast de sucesso/erro. */
function useRunner() {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<ActionResult>, success: string) =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast(success);
      else toast(result.formError ?? "Não foi possível concluir a ação.", "error");
    });
  return { pending, run };
}

function MembersPanel({
  locationId,
  members,
  companyMembers,
  canManage,
}: {
  locationId: string;
  members: LocationMember[];
  companyMembers: LocationMember[];
  canManage: boolean;
}) {
  const { pending, run } = useRunner();
  const [selected, setSelected] = useState("");
  const inLocation = new Set(members.map((m) => m.userId));
  const available = companyMembers.filter((m) => !inLocation.has(m.userId));

  return (
    <div className="space-y-5">
      {canManage && (
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            if (!selected) return;
            const person = available.find((m) => m.userId === selected);
            run(
              () => addLocationMember({ locationId, userId: selected }),
              `${person?.fullName ?? "Pessoa"} adicionada à filial.`,
            );
            setSelected("");
          }}
        >
          <label htmlFor="add-member" className="sr-only">
            Adicionar pessoa à filial
          </label>
          <Select
            id="add-member"
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            disabled={available.length === 0 || pending}
            className="sm:max-w-xs"
          >
            <option value="">
              {available.length === 0 ? "Todos já estão nesta filial" : "Selecione uma pessoa…"}
            </option>
            {available.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.fullName ?? "Sem nome"}
                {member.roleName ? ` — ${member.roleName}` : ""}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary" disabled={!selected} loading={pending}>
            Adicionar
          </Button>
        </form>
      )}

      {members.length === 0 ? (
        <EmptyState
          icon={<UsersIcon />}
          title="Ninguém lotado aqui ainda"
          description={
            canManage
              ? "Adicione corretores e assistentes que atendem nesta filial."
              : "Quando alguém for lotado nesta filial, aparecerá aqui."
          }
        />
      ) : (
        <ul className="divide-border border-border divide-y rounded-xl border">
          {members.map((member) => (
            <li key={member.userId} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={member.fullName} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{member.fullName ?? "Sem nome"}</p>
                {member.roleName && (
                  <p className="text-muted-foreground text-xs">{member.roleName}</p>
                )}
              </div>
              {canManage && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    run(
                      () => removeLocationMember({ locationId, userId: member.userId }),
                      `${member.fullName ?? "Pessoa"} removida da filial.`,
                    )
                  }
                >
                  Remover
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TeamsPanel({
  locationId,
  teams,
  canManage,
}: {
  locationId: string;
  teams: LocationTeam[];
  canManage: boolean;
}) {
  const { pending, run } = useRunner();
  const [selected, setSelected] = useState("");
  const linked = teams.filter((t) => t.locationId === locationId);
  const available = teams.filter((t) => t.locationId !== locationId);

  return (
    <div className="space-y-5">
      {canManage && teams.length > 0 && (
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            if (!selected) return;
            const team = available.find((t) => t.id === selected);
            run(
              () => linkTeam({ locationId, teamId: selected }),
              `Equipe ${team?.name ?? ""} vinculada.`,
            );
            setSelected("");
          }}
        >
          <label htmlFor="link-team" className="sr-only">
            Vincular equipe à filial
          </label>
          <Select
            id="link-team"
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            disabled={available.length === 0 || pending}
            className="sm:max-w-xs"
          >
            <option value="">
              {available.length === 0 ? "Todas as equipes já estão aqui" : "Selecione uma equipe…"}
            </option>
            {available.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
                {team.locationId ? " (mover de outra filial)" : ""}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary" disabled={!selected} loading={pending}>
            Vincular
          </Button>
        </form>
      )}

      {linked.length === 0 ? (
        <EmptyState
          icon={<TeamIcon />}
          title="Nenhuma equipe nesta filial"
          description={
            teams.length === 0
              ? "A imobiliária ainda não tem equipes. Elas poderão ser vinculadas aqui assim que forem criadas."
              : "Vincule equipes para saber quem atende a partir deste escritório."
          }
        />
      ) : (
        <ul className="divide-border border-border divide-y rounded-xl border">
          {linked.map((team) => (
            <li key={team.id} className="flex items-center gap-3 px-4 py-3">
              <span className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-full">
                <TeamIcon className="size-4" />
              </span>
              <p className="min-w-0 flex-1 truncate text-sm font-medium">{team.name}</p>
              {canManage && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    run(
                      () => unlinkTeam({ locationId, teamId: team.id }),
                      `Equipe ${team.name} desvinculada.`,
                    )
                  }
                >
                  Desvincular
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Avatar({ name }: { name: string | null }) {
  const initials =
    (name ?? "?")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?";
  return (
    <span className="bg-accent text-accent-foreground flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
      {initials}
    </span>
  );
}
