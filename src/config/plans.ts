// Planos comerciais — fonte única para a landing (preços) e, no Sprint 6,
// para o Stripe e os limites por plano.
//
// ATENÇÃO: valores de lançamento PROPOSTOS, ainda a validar com o negócio.

import type { FeatureKey } from "@/config/features";

export type PlanId = "starter" | "pro" | "business";

export type PlanHighlight = {
  text: string;
  /** Recurso de que o item depende; enquanto indisponível, aparece "Em breve". */
  feature?: FeatureKey;
};

export type Plan = {
  id: PlanId;
  name: string;
  /** Preço mensal em reais (cobrança mensal). */
  monthlyPrice: number;
  audience: string;
  /** Limite de usuários ativos na imobiliária. */
  maxUsers: number;
  highlights: PlanHighlight[];
  featured?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 149,
    audience: "Para o corretor autônomo e equipes pequenas",
    maxUsers: 3,
    highlights: [
      { text: "Até 3 usuários" },
      { text: "Contatos, funil e imóveis ilimitados", feature: "contacts" },
      { text: "WhatsApp em um clique", feature: "whatsapp" },
      { text: "Agenda de visitas e tarefas", feature: "agenda" },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 349,
    audience: "Para a imobiliária que quer crescer com processo",
    maxUsers: 10,
    featured: true,
    highlights: [
      { text: "Até 10 usuários" },
      { text: "Tudo do Starter" },
      { text: "Filiais, equipes e permissões" },
      { text: "Página do imóvel que gera lead", feature: "propertyPage" },
      { text: "Painel de desempenho da equipe", feature: "dashboard" },
    ],
  },
  {
    id: "business",
    name: "Business",
    monthlyPrice: 790,
    audience: "Para operações com várias filiais",
    maxUsers: 30,
    highlights: [
      { text: "Até 30 usuários" },
      { text: "Tudo do Pro" },
      { text: "Distribuição automática de leads", feature: "leadDistribution" },
      { text: "Relatórios gerenciais", feature: "reports" },
      { text: "Suporte prioritário" },
    ],
  },
];

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}
