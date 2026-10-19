import type { Metadata } from "next";
import type { ReactNode } from "react";

import {
  BuildingIcon,
  CalendarIcon,
  ChatIcon,
  CheckIcon,
  ClockIcon,
  ExternalIcon,
  FunnelIcon,
  KeyIcon,
  ShieldIcon,
  TeamIcon,
  UsersIcon,
} from "@/components/shared/icons";
import { ButtonLink } from "@/components/ui/button";
import { formatBRL, PLANS } from "@/config/plans";
import { SITE } from "@/config/site";
import { cn } from "@/lib/utils/cn";

import { PipelineMockup } from "./_components/pipeline-mockup";

export const metadata: Metadata = {
  title: { absolute: `${SITE.name} · CRM para imobiliárias e corretores` },
  description: SITE.description,
  alternates: { canonical: "/" },
};

const PAINS = [
  {
    title: "Lead esquecido no WhatsApp",
    text: "O cliente chamou às 21h, ninguém respondeu, e na manhã seguinte ele já estava visitando com outra imobiliária.",
  },
  {
    title: "Planilha que ninguém atualiza",
    text: "Cada corretor anota de um jeito. Quando alguém sai da equipe, a carteira de clientes vai junto.",
  },
  {
    title: "Gestor sem visibilidade",
    text: "Quantos leads entraram? Quantas visitas viraram proposta? Sem número, não há como melhorar.",
  },
];

const PILLARS = [
  {
    icon: <ClockIcon />,
    title: "Atenda mais rápido",
    text: "Todo lead chega organizado, com responsável e próximo passo. Um clique abre o WhatsApp com a mensagem pronta.",
  },
  {
    icon: <FunnelIcon />,
    title: "Organize o funil",
    text: "Do primeiro contato ao fechamento, cada negócio aparece na etapa certa, sem perder o histórico.",
  },
  {
    icon: <CheckIcon />,
    title: "Feche mais negócios",
    text: "Follow-ups lembrados, visitas agendadas e imóveis compatíveis com o que o cliente procura.",
  },
];

const STEPS = [
  {
    title: "Crie sua imobiliária",
    text: "Cadastro em 2 minutos. Matriz, equipe e permissões já vêm configuradas.",
  },
  {
    title: "Traga seus dados",
    text: "Importe a planilha de contatos e cadastre seus imóveis com fotos.",
  },
  {
    title: "Comece a atender",
    text: "Convide os corretores e acompanhe cada lead pelo funil, do celular ou do computador.",
  },
];

const FEATURES = [
  {
    icon: <UsersIcon />,
    title: "Contatos com histórico completo",
    text: "Ligações, mensagens, visitas e observações em uma linha do tempo única por cliente.",
  },
  {
    icon: <FunnelIcon />,
    title: "Funil de vendas em kanban",
    text: "Arraste o negócio entre etapas e veja na hora onde cada oportunidade está parada.",
  },
  {
    icon: <ChatIcon />,
    title: "WhatsApp em um clique",
    text: "Mensagens prontas para cada situação, e o contato fica registrado no histórico.",
  },
  {
    icon: <KeyIcon />,
    title: "Imóveis com fotos e captação",
    text: "Cadastro completo, proprietários, comissão e status de publicação.",
  },
  {
    icon: <ExternalIcon />,
    title: "Página do imóvel que gera lead",
    text: "Compartilhe o link do imóvel: quem se interessar vira contato direto no seu funil.",
  },
  {
    icon: <CalendarIcon />,
    title: "Agenda de visitas e tarefas",
    text: "Visitas, retornos e follow-ups com lembrete para o corretor responsável.",
  },
  {
    icon: <BuildingIcon />,
    title: "Filiais e equipes",
    text: "Organize a operação por escritório e equipe, com o gestor enxergando tudo.",
  },
  {
    icon: <TeamIcon />,
    title: "Permissões por papel",
    text: "Proprietário, gerente, corretor e assistente veem só o que precisam ver.",
  },
];

const AUDIENCES = [
  {
    title: "Corretor autônomo",
    text: "Pare de depender da memória e do caderno. Tenha sua carteira organizada e profissional.",
  },
  {
    title: "Imobiliária pequena",
    text: "Coloque a equipe no mesmo processo e saiba exatamente quem está atendendo quem.",
  },
  {
    title: "Imobiliária em crescimento",
    text: "Filiais, equipes e indicadores para crescer sem perder o controle da operação.",
  },
];

const FAQ = [
  {
    q: "Preciso de cartão de crédito para testar?",
    a: `Não. O teste grátis dura ${SITE.trialDays} dias com todos os recursos liberados. Você só escolhe um plano se quiser continuar.`,
  },
  {
    q: "Consigo trazer os contatos da minha planilha?",
    a: "Sim. A importação aceita a planilha que você já usa (CSV/Excel) e organiza os contatos automaticamente.",
  },
  {
    q: "Funciona no celular?",
    a: "Sim. O sistema foi pensado para o corretor na rua: funciona no navegador do celular, sem instalar nada.",
  },
  {
    q: "Vocês fazem disparo em massa no WhatsApp?",
    a: "Não. Trabalhamos com conversas individuais, iniciadas em um clique. Disparo em massa coloca seu número em risco de bloqueio.",
  },
  {
    q: "Meus dados ficam seguros?",
    a: "Sim. Os dados de cada imobiliária são isolados no próprio banco de dados, com controle de acesso por papel, backups e tratamento conforme a LGPD.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Pode. Não há fidelidade: o plano é mensal e você cancela quando quiser.",
  },
];

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: SITE.description,
    url: SITE.url,
    inLanguage: "pt-BR",
    offers: PLANS.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: plan.monthlyPrice,
      priceCurrency: "BRL",
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-48 left-1/2 size-[640px] -translate-x-1/2 rounded-full bg-emerald-400/15 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:pt-20 lg:pb-28">
          <div>
            <p className="border-border bg-surface text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
              <span className="bg-primary size-1.5 rounded-full" aria-hidden="true" />
              CRM imobiliário feito para o mercado brasileiro
            </p>
            <h1 className="mt-5 text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Pare de perder lead no WhatsApp.
            </h1>
            <p className="text-muted-foreground mt-5 max-w-xl text-lg text-pretty">
              O Imobi Flow GO organiza seus contatos, imóveis e visitas em um só lugar, e mostra
              para cada corretor qual é o próximo passo de cada negócio.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/cadastrar" size="lg">
                Teste grátis por {SITE.trialDays} dias
              </ButtonLink>
              <ButtonLink href="#como-funciona" variant="secondary" size="lg">
                Ver como funciona
              </ButtonLink>
            </div>
            <ul className="text-muted-foreground mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {["Sem cartão de crédito", "Pronto em 2 minutos", "Cancele quando quiser"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <CheckIcon className="text-primary size-4" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>
          <PipelineMockup />
        </div>
      </section>

      {/* DOR */}
      <Section
        id="problema"
        eyebrow="O problema"
        title="Lead que espera, esfria. E vai para o concorrente."
        description="Se algum destes cenários parece familiar, sua imobiliária está deixando dinheiro na mesa."
        muted
      >
        <div className="grid gap-4 md:grid-cols-3">
          {PAINS.map((pain) => (
            <div key={pain.title} className="border-border bg-surface rounded-2xl border p-6">
              <h3 className="font-semibold">{pain.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm">{pain.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* SOLUÇÃO */}
      <Section
        id="solucao"
        eyebrow="A solução"
        title="Um processo simples que toda a equipe segue"
        description="Menos ferramentas soltas, mais negócios andando. Do primeiro contato à assinatura do contrato."
      >
        <div className="grid gap-8 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <div key={pillar.title}>
              <IconBadge>{pillar.icon}</IconBadge>
              <h3 className="mt-4 text-lg font-semibold">{pillar.title}</h3>
              <p className="text-muted-foreground mt-2">{pillar.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* COMO FUNCIONA */}
      <Section id="como-funciona" eyebrow="Como funciona" title="Comece hoje, em três passos" muted>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="border-border bg-surface rounded-2xl border p-6">
              <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-full text-sm font-semibold">
                {index + 1}
              </span>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm">{step.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* RECURSOS */}
      <Section
        id="recursos"
        eyebrow="Recursos"
        title="Tudo o que a imobiliária precisa para vender e alugar"
      >
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div key={feature.title}>
              <IconBadge>{feature.icon}</IconBadge>
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground mt-1.5 text-sm">{feature.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* PARA QUEM */}
      <Section
        id="para-quem"
        eyebrow="Para quem"
        title="Do corretor autônomo à rede de filiais"
        muted
      >
        <div className="grid gap-4 md:grid-cols-3">
          {AUDIENCES.map((audience) => (
            <div key={audience.title} className="border-border bg-surface rounded-2xl border p-6">
              <h3 className="font-semibold">{audience.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm">{audience.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* PREÇOS */}
      <Section
        id="precos"
        eyebrow="Preços"
        title="Planos simples, sem fidelidade"
        description={`Comece com ${SITE.trialDays} dias grátis em qualquer plano. Sem cartão de crédito.`}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "bg-surface relative flex flex-col rounded-2xl border p-6",
                plan.featured ? "border-primary shadow-xl shadow-emerald-900/10" : "border-border",
              )}
            >
              {plan.featured && (
                <span className="bg-primary text-primary-foreground absolute -top-3 left-6 rounded-full px-3 py-1 text-xs font-semibold">
                  Mais escolhido
                </span>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="text-muted-foreground mt-1 text-sm">{plan.audience}</p>
              <p className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">
                  {formatBRL(plan.monthlyPrice)}
                </span>
                <span className="text-muted-foreground text-sm">/mês</span>
              </p>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {plan.highlights.map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckIcon className="text-primary size-4 shrink-0 translate-y-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <ButtonLink
                href="/cadastrar"
                variant={plan.featured ? "primary" : "secondary"}
                className="mt-8 w-full"
              >
                Começar teste grátis
              </ButtonLink>
            </div>
          ))}
        </div>
      </Section>

      {/* SEGURANÇA */}
      <Section id="seguranca" muted>
        <div className="border-border bg-surface flex flex-col items-start gap-6 rounded-2xl border p-8 md:flex-row md:items-center">
          <span className="bg-accent text-accent-foreground flex size-14 shrink-0 items-center justify-center rounded-2xl">
            <ShieldIcon className="size-7" />
          </span>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Seus dados protegidos e isolados
            </h2>
            <p className="text-muted-foreground mt-2 max-w-3xl">
              Cada imobiliária tem seus dados separados no próprio banco de dados, não só na tela.
              Controle de acesso por papel, histórico de alterações e backups, em conformidade com a
              LGPD.
            </p>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section id="perguntas" eyebrow="Dúvidas" title="Perguntas frequentes">
        <div className="divide-border border-border bg-surface mx-auto max-w-3xl divide-y rounded-2xl border">
          {FAQ.map((item) => (
            <details key={item.q} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                {item.q}
                <span
                  aria-hidden="true"
                  className="text-muted-foreground text-xl leading-none transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="text-muted-foreground mt-3">{item.a}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* CTA FINAL */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="bg-sidebar mx-auto max-w-6xl overflow-hidden rounded-3xl px-6 py-14 text-center text-white sm:px-12">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Seu próximo cliente pode estar esperando resposta agora.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Crie sua conta em 2 minutos e teste grátis por {SITE.trialDays} dias. Sem cartão de
            crédito.
          </p>
          <ButtonLink href="/cadastrar" size="lg" className="mt-8">
            Começar teste grátis
          </ButtonLink>
        </div>
      </section>
    </>
  );
}

function Section({
  id,
  eyebrow,
  title,
  description,
  muted,
  children,
}: {
  id: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  muted?: boolean;
  children: ReactNode;
}) {
  const titleId = title ? `${id}-titulo` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cn("scroll-mt-16 px-4 py-20 sm:px-6", muted && "bg-surface/60")}
    >
      <div className="mx-auto max-w-6xl">
        {title && (
          <div className="mb-12 max-w-2xl">
            {eyebrow && <p className="text-primary text-sm font-semibold">{eyebrow}</p>}
            <h2
              id={titleId}
              className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
            >
              {title}
            </h2>
            {description && <p className="text-muted-foreground mt-4 text-lg">{description}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

function IconBadge({ children }: { children: ReactNode }) {
  return (
    <span className="bg-accent text-accent-foreground flex size-11 items-center justify-center rounded-xl">
      {children}
    </span>
  );
}
