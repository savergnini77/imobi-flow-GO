import { z } from "zod";

// Tipo de resultado padrão das Server Actions + helpers.
// Sem "use server": exporta funções síncronas e tipos, usados no servidor e no cliente.

/** Erros por campo: nome do campo -> lista de mensagens. */
export type FieldErrors = Record<string, string[]>;

/** Resultado padrão de toda Server Action. */
export type ActionResult<T = undefined> =
  { ok: true; data: T } | { ok: false; formError?: string; fieldErrors?: FieldErrors };

export function succeed<T>(data: T): { ok: true; data: T } {
  return { ok: true, data };
}

export function failForm(formError: string): { ok: false; formError: string } {
  return { ok: false, formError };
}

export function failFields(
  fieldErrors: FieldErrors,
  formError?: string,
): { ok: false; fieldErrors: FieldErrors; formError?: string } {
  return { ok: false, fieldErrors, formError };
}

/**
 * Converte um ZodError em FieldErrors. A chave é o caminho do campo
 * (ex.: "email", "confirmPassword"); erros sem caminho vão para "_form".
 */
export function zodToFieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.map(String).join(".") : "_form";
    (result[key] ??= []).push(issue.message);
  }
  return result;
}
