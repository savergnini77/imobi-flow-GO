"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState, useTransition } from "react";

import {
  BuildingIcon,
  CalendarIcon,
  ClockIcon,
  FunnelIcon,
  HomeIcon,
  KeyIcon,
  LogoMark,
  LogoutIcon,
  MenuIcon,
  ShieldIcon,
  StarIcon,
  TeamIcon,
  UserIcon,
  UsersIcon,
} from "@/components/shared/icons";
import { trialLabel } from "@/lib/billing/trial";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";
import { signOut } from "@/modules/auth/actions";
import { switchCompany } from "@/modules/companies/actions";

type Company = { id: string; name: string; roleName: string };

type NavItem = { href: string; label: string; icon: ReactNode; soon?: boolean };

const NAV: { title?: string; items: NavItem[] }[] = [
  { items: [{ href: "/dashboard", label: "Painel", icon: <HomeIcon /> }] },
  {
    title: "Vendas",
    items: [
      { href: "/contatos", label: "Contatos", icon: <UsersIcon />, soon: true },
      { href: "/oportunidades", label: "Oportunidades", icon: <FunnelIcon />, soon: true },
      { href: "/imoveis", label: "Imóveis", icon: <KeyIcon />, soon: true },
      { href: "/agenda", label: "Agenda", icon: <CalendarIcon />, soon: true },
    ],
  },
  {
    title: "Configurações",
    items: [
      { href: "/settings/company", label: "Imobiliária", icon: <StarIcon /> },
      { href: "/settings/profile", label: "Meu perfil", icon: <UserIcon /> },
      { href: "/settings/locations", label: "Filiais", icon: <BuildingIcon /> },
      { href: "/settings/teams", label: "Equipes", icon: <TeamIcon />, soon: true },
      { href: "/settings/members", label: "Membros", icon: <UsersIcon />, soon: true },
      { href: "/settings/roles", label: "Papéis e permissões", icon: <ShieldIcon />, soon: true },
    ],
  },
];

export function AppShell({
  children,
  companies,
  activeCompanyId,
  userName,
  userEmail,
  trialDaysLeft = null,
}: {
  children: ReactNode;
  companies: Company[];
  activeCompanyId: string;
  userName: string;
  userEmail: string;
  trialDaysLeft?: number | null;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  // Fecha o menu mobile ao navegar (ajuste de estado durante o render, sem efeito).
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
  }

  const sidebar = (
    <div className="bg-sidebar text-sidebar-foreground flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <LogoMark className="size-7" />
        <span className="font-semibold tracking-tight text-white">Imobi Flow GO</span>
      </div>

      <CompanySwitcher companies={companies} activeCompanyId={activeCompanyId} />

      <nav aria-label="Principal" className="mt-4 flex-1 space-y-6 overflow-y-auto px-3">
        {NAV.map((group, index) => (
          <div key={group.title ?? index}>
            {group.title && (
              <p className="text-sidebar-foreground/50 mb-1.5 px-2 text-[11px] font-semibold tracking-wider uppercase">
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                if (item.soon) {
                  return (
                    <li key={item.href}>
                      <span
                        aria-disabled="true"
                        className="flex cursor-not-allowed items-center gap-3 rounded-lg px-2 py-2 text-sm opacity-50"
                      >
                        {item.icon}
                        <span className="flex-1">{item.label}</span>
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium">
                          Em breve
                        </span>
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "focus-visible:outline-ring flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors focus-visible:outline-2",
                        active
                          ? "bg-sidebar-active font-medium text-white"
                          : "hover:bg-sidebar-active/60 hover:text-white",
                      )}
                    >
                      <span className={active ? "text-emerald-400" : undefined}>{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <UserMenu name={userName} email={userEmail} />
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="sticky top-0 hidden h-dvh lg:block">{sidebar}</aside>

      {/* Barra superior mobile */}
      <div className="border-border bg-surface/90 sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={mobileOpen}
          className="hover:bg-muted -ml-1 rounded-md p-1.5"
        >
          <MenuIcon />
        </button>
        <LogoMark className="size-6" />
        <span className="truncate text-sm font-semibold">
          {companies.find((c) => c.id === activeCompanyId)?.name}
        </span>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-[var(--overlay)]"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-72 max-w-[85%] shadow-2xl">{sidebar}</div>
        </div>
      )}

      <div className="min-w-0">
        {trialDaysLeft !== null && <TrialBanner daysLeft={trialDaysLeft} />}
        {children}
      </div>
    </div>
  );
}

/** Faixa do teste grátis. Fica mais visível nos últimos 3 dias. */
function TrialBanner({ daysLeft }: { daysLeft: number }) {
  const urgent = daysLeft <= 3;
  return (
    <div
      role="status"
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-sm",
        urgent ? "bg-warning-soft text-warning-foreground" : "bg-accent text-accent-foreground",
      )}
    >
      <span className="inline-flex items-center gap-1.5 font-medium">
        <ClockIcon className="size-4" />
        {trialLabel(daysLeft)}
      </span>
      <span className="text-current/80">
        {daysLeft === 0
          ? "Escolha um plano para continuar usando."
          : "Todos os recursos liberados durante o teste."}
      </span>
    </div>
  );
}

function CompanySwitcher({
  companies,
  activeCompanyId,
}: {
  companies: Company[];
  activeCompanyId: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const active = companies.find((c) => c.id === activeCompanyId);

  if (companies.length <= 1) {
    return (
      <div className="bg-sidebar-active mx-3 rounded-xl px-3 py-2.5">
        <p className="truncate text-sm font-medium text-white">{active?.name}</p>
        <p className="text-sidebar-foreground/70 text-xs">{active?.roleName}</p>
      </div>
    );
  }

  return (
    <div className="mx-3">
      <label htmlFor="company-switcher" className="sr-only">
        Imobiliária ativa
      </label>
      <select
        id="company-switcher"
        value={activeCompanyId}
        disabled={pending}
        onChange={(event) => {
          const id = event.target.value;
          startTransition(async () => {
            const result = await switchCompany(id);
            if (!result.ok) toast(result.formError ?? "Não foi possível trocar.", "error");
            router.refresh();
          });
        }}
        className="bg-sidebar-active focus-visible:outline-ring h-11 w-full rounded-xl border-0 px-3 text-sm font-medium text-white focus-visible:outline-2"
      >
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function UserMenu({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || email[0]?.toUpperCase();

  return (
    <div className="flex items-center gap-3 border-t border-white/5 px-4 py-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-semibold text-emerald-300">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{name || email}</p>
        {name && <p className="text-sidebar-foreground/60 truncate text-xs">{email}</p>}
      </div>
      <button
        type="button"
        aria-label="Sair"
        title="Sair"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await signOut();
            if (!result.ok) {
              toast(result.formError ?? "Não foi possível sair.", "error");
              return;
            }
            router.replace("/entrar");
            router.refresh();
          })
        }
        className="text-sidebar-foreground/70 hover:bg-sidebar-active focus-visible:outline-ring rounded-md p-1.5 hover:text-white focus-visible:outline-2"
      >
        <LogoutIcon />
      </button>
    </div>
  );
}
