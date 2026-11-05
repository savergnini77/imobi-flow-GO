/**
 * Só aceita caminhos internos ("/algo"), nunca URLs externas (open redirect).
 * Qualquer valor suspeito cai no fallback.
 */
export function safeNext(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
}
