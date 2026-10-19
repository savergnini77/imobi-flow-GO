// Planos comerciais — fonte única para a landing (preços) e, no Sprint 6,
// para o Stripe e os limites por plano.
//
// ATENÇÃO: valores de lançamento PROPOSTOS, ainda a validar com o negócio.

export type PlanId = "starter" | "pro" | "business";

export type Plan = {
  id: PlanId;
  name: string;
  /** Preço mensal em reais (cobrança mensal). */
  monthlyPrice: number;
  audience: string;
  /** Limite de usuários ativos na imobiliária. */
  maxUsers: number;
  highlights: string[];
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
      "Até 3 usuários",
      "Contatos, funil e imóveis ilimitados",
      "WhatsApp em um clique",
      "Agenda de visitas e tarefas",
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
      "Até 10 usuários",
      "Tudo do Starter",
      "Equipes, filiais e permissões",
      "Página do imóvel que gera lead",
      "Painel de desempenho da equipe",
    ],
  },
  {
    id: "business",
    name: "Business",
    monthlyPrice: 790,
    audience: "Para operações com várias filiais",
    maxUsers: 30,
    highlights: [
      "Até 30 usuários",
      "Tudo do Pro",
      "Distribuição automática de leads",
      "Relatórios gerenciais",
      "Suporte prioritário",
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
