/**
 * Verificação de variáveis de ambiente.
 *
 * Regras:
 * - Só checamos se a variável EXISTE e não está vazia.
 * - Nunca exibimos o VALOR de nenhuma variável (log, console ou mensagem de erro).
 * - Aqui só tratamos variáveis públicas (prefixo NEXT_PUBLIC_). A chave secreta
 *   (service role) não é lida nem referenciada neste arquivo.
 */

/** Nomes das variáveis públicas obrigatórias para o Supabase. */
const PUBLIC_SUPABASE_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

type PublicSupabaseEnvKey = (typeof PUBLIC_SUPABASE_ENV_KEYS)[number];

/** Considera "ausente" o que for undefined, string vazia ou só espaços. */
function isMissing(value: string | undefined): boolean {
  return value === undefined || value.trim() === "";
}

/**
 * Garante que as variáveis públicas do Supabase estão presentes.
 * Lança um erro citando apenas os NOMES das que faltam — nunca os valores.
 */
export function assertPublicSupabaseEnv(): void {
  const missing: PublicSupabaseEnvKey[] = PUBLIC_SUPABASE_ENV_KEYS.filter((key) =>
    isMissing(process.env[key]),
  );

  if (missing.length > 0) {
    throw new Error(
      `Variáveis de ambiente ausentes: ${missing.join(", ")}. Preencha o .env.local.`,
    );
  }
}

/**
 * Retorna a URL e a chave pública (anon/publishable) do Supabase.
 * Chama a validação antes, então o retorno é sempre de strings preenchidas.
 */
export function getPublicSupabaseEnv(): { url: string; anonKey: string } {
  assertPublicSupabaseEnv();

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
  };
}
