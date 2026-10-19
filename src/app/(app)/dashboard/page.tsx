import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  ArrowRightIcon,
  BuildingIcon,
  CalendarIcon,
  CheckIcon,
  FunnelIcon,
  KeyIcon,
  StarIcon,
  UsersIcon,
} from "@/components/shared/icons";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { can, requireAppContext } from "@/lib/auth/context";
import { cn } from "@/lib/utils/cn";
import { getSetupProgress } from "@/modules/companies/queries";
import { countLocations } from "@/modules/locations/queries";

export const metadata: Metadata = { title: "Painel" };

type Step = {
  title: string;
  description: string;
  done: boolean;
  href?: string;
  soon?: boolean;
};

export default async function DashboardPage() {
  const context = await requireAppContext();
  const { user, active } = context;
  const [locations, progress] = await Promise.all([
    countLocations(active.companyId),
    getSetupProgress(active.companyId),
  ]);
  const firstName = user.fullName?.split(" ")[0];
  const isManager = can(context, "settings.manage");

  const steps: Step[] = [
    {
      title: "Criar sua imobiliária",
      description: "Pronto! Matriz e equipe principal já foram criadas.",
      done: true,
    },
    {
      title: "Completar os dados da imobiliária",
      description: "CRECI, telefone e WhatsApp, usados nas mensagens aos clientes.",
      done: progress.companyDetails,
      href: isManager ? "/settings/company" : undefined,
    },
    {
      title: "Cadastrar suas filiais",
      description: "Cada escritório com endereço, contato e corretores.",
      done: progress.extraLocation,
      href: "/settings/locations",
    },
    {
      title: "Convidar sua equipe",
      description: "Corretores e assistentes com as permissões certas.",
      done: progress.teamInvited,
      soon: true,
    },
    {
      title: "Importar seus contatos",
      description: "Traga a planilha de leads e clientes em poucos cliques.",
      done: false,
      soon: true,
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <PageContainer>
      <PageHeader
        eyebrow={active.companyName}
        title={firstName ? `Olá, ${firstName}` : "Olá!"}
        description="Um resumo rápido da sua imobiliária."
      />

      {doneCount < steps.length && (
        <section
          aria-labelledby="setup-title"
          className="border-border bg-surface mt-8 rounded-2xl border p-5 shadow-xs sm:p-6"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="setup-title" className="font-semibold">
                Primeiros passos
              </h2>
              <p className="text-muted-foreground text-sm">
                Deixe tudo pronto para atender seus clientes.
              </p>
            </div>
            <p className="text-sm font-medium tabular-nums">
              {doneCount} de {steps.length}
            </p>
          </div>
          <div
            className="bg-muted mt-4 h-1.5 overflow-hidden rounded-full"
            role="progressbar"
            aria-label="Progresso dos primeiros passos"
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-valuenow={doneCount}
          >
            <div
              className="bg-primary h-full rounded-full transition-[width]"
              style={{ width: `${(doneCount / steps.length) * 100}%` }}
            />
          </div>
          <ol className="divide-border mt-5 divide-y">
            {steps.map((step) => (
              <SetupStep key={step.title} step={step} />
            ))}
          </ol>
        </section>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/settings/locations"
          className="group border-border bg-surface focus-visible:outline-ring rounded-2xl border p-5 shadow-xs transition-shadow hover:shadow-md focus-visible:outline-2"
        >
          <div className="flex items-center justify-between">
            <IconBadge>
              <BuildingIcon />
            </IconBadge>
            <span className="text-primary text-sm font-medium group-hover:underline">
              Gerenciar
            </span>
          </div>
          <p className="mt-4 text-3xl font-semibold tabular-nums">{locations.active}</p>
          <p className="text-muted-foreground text-sm">
            {locations.active === 1 ? "filial ativa" : "filiais ativas"}
            {locations.total > locations.active &&
              ` · ${locations.total - locations.active} inativa(s)`}
          </p>
        </Link>

        <div className="border-border bg-surface rounded-2xl border p-5 shadow-xs">
          <IconBadge>
            <StarIcon />
          </IconBadge>
          <p className="mt-4 font-medium">Seu papel: {active.roleName}</p>
          <p className="text-muted-foreground text-sm">
            O que você pode fazer depende do seu papel nesta imobiliária.
          </p>
        </div>

        <ComingSoon
          icon={<UsersIcon />}
          title="Contatos e timeline"
          description="Todo o histórico de cada lead e cliente em um só lugar."
        />
        <ComingSoon
          icon={<FunnelIcon />}
          title="Funil de vendas"
          description="Oportunidades em kanban, do primeiro contato ao fechamento."
        />
        <ComingSoon
          icon={<KeyIcon />}
          title="Imóveis"
          description="Cadastro com fotos e página pronta para compartilhar no WhatsApp."
        />
        <ComingSoon
          icon={<CalendarIcon />}
          title="Agenda de visitas"
          description="Visitas, retornos e tarefas sem esquecer nenhum cliente."
        />
      </div>
    </PageContainer>
  );
}

function SetupStep({ step }: { step: Step }) {
  const content = (
    <>
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full border",
          step.done
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input text-transparent",
        )}
        aria-hidden="true"
      >
        <CheckIcon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block text-sm font-medium",
            step.done && "text-muted-foreground line-through",
          )}
        >
          {step.title}
          <span className="sr-only">{step.done ? " (concluído)" : " (pendente)"}</span>
        </span>
        <span className="text-muted-foreground block text-sm">{step.description}</span>
      </span>
      {step.soon && !step.done ? (
        <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs font-medium">
          Em breve
        </span>
      ) : step.href && !step.done ? (
        <ArrowRightIcon className="text-primary size-4" />
      ) : null}
    </>
  );

  return (
    <li>
      {step.href && !step.done ? (
        <Link
          href={step.href}
          className="hover:bg-muted focus-visible:outline-ring -mx-2 flex items-center gap-3 rounded-lg px-2 py-3 focus-visible:outline-2"
        >
          {content}
        </Link>
      ) : (
        <div className="flex items-center gap-3 py-3">{content}</div>
      )}
    </li>
  );
}

function IconBadge({ children }: { children: ReactNode }) {
  return (
    <span className="bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-xl">
      {children}
    </span>
  );
}

function ComingSoon({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="border-border rounded-2xl border border-dashed p-5">
      <div className="flex items-center justify-between">
        <span className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-xl">
          {icon}
        </span>
        <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs font-medium">
          Em breve
        </span>
      </div>
      <p className="mt-4 font-medium">{title}</p>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
