// Busca de filiais: monta o valor do filtro "or" do PostgREST (função pura).

/**
 * Valor de um ILIKE na sintaxe crua do PostgREST:
 * escapa os curingas do ILIKE e envolve em aspas duplas, para que vírgula,
 * ponto, dois-pontos e parênteses digitados pelo usuário não quebrem o filtro.
 */
export function toIlikeFilterValue(search: string): string {
  const escaped = search.replace(/[\\%_]/g, (c) => `\\${c}`);
  const quoted = `%${escaped}%`.replace(/["\\]/g, (c) => `\\${c}`);
  return `"${quoted}"`;
}
