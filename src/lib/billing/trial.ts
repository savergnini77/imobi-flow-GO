// Regras do teste grátis. Funções puras: usadas no servidor e testadas em unidade.

const DAY_MS = 86_400_000;

type TrialInfo = { subscriptionStatus: string; trialEndsAt: string | null };

/** Dias restantes do teste grátis (null quando a imobiliária não está em trial). */
export function trialDaysLeft(company: TrialInfo, now: Date = new Date()): number | null {
  if (company.subscriptionStatus !== "trialing" || !company.trialEndsAt) return null;
  const ms = new Date(company.trialEndsAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / DAY_MS));
}

/** Texto curto para o banner do trial. */
export function trialLabel(daysLeft: number): string {
  if (daysLeft === 0) return "Seu teste grátis terminou";
  if (daysLeft === 1) return "Último dia do teste grátis";
  return `${daysLeft} dias restantes no teste grátis`;
}
