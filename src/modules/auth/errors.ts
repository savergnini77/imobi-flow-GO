import { z } from "zod";

// Tipos de resultado das Server Actions e tradução de erros para PT-BR.
// Sem "use server": este arquivo exporta funções síncronas e tipos,
// usados tanto no servidor quanto no cliente.

/** Erros por campo: nome do campo -> lista de mensagens. */
export type FieldErrors = Record<string, string[]>;

/** Resultado padrão de toda Server Action de autenticação. */
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

/** Formato estrutural dos erros do Supabase Auth (evita acoplar o tipo do SDK). */
export type SupabaseAuthErrorLike = {
  code?: string | null;
  message?: string | null;
  status?: number | null;
};

const GENERIC_AUTH_ERROR = "Não foi possível concluir a ação. Tente novamente em instantes.";

/** Mensagens amigáveis (PT-BR) por código de erro do Supabase Auth. */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  email_not_confirmed: "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.",
  user_already_exists: "Já existe uma conta com este e-mail.",
  email_exists: "Já existe uma conta com este e-mail.",
  user_banned: "Esta conta está bloqueada. Fale com o suporte.",
  weak_password: "Senha muito fraca. Use ao menos 8 caracteres.",
  same_password: "A nova senha deve ser diferente da anterior.",
  email_address_invalid: "E-mail inválido.",
  validation_failed: "Dados inválidos. Confira os campos e tente novamente.",
  signup_disabled: "O cadastro está desativado no momento.",
  over_request_rate_limit: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  over_email_send_rate_limit: "Muitos e-mails enviados. Aguarde alguns minutos e tente novamente.",
  session_not_found: "Sua sessão expirou. Entre novamente.",
  session_expired: "Sua sessão expirou. Entre novamente.",
};

/**
 * Traduz um erro do Supabase Auth para uma mensagem segura em PT-BR.
 * Nunca repassa a mensagem crua do provedor.
 */
export function mapSupabaseAuthError(error: SupabaseAuthErrorLike | null | undefined): string {
  if (!error) return GENERIC_AUTH_ERROR;
  const mapped = error.code ? AUTH_ERROR_MESSAGES[error.code] : undefined;
  if (mapped) return mapped;
  if (error.status === 429) return AUTH_ERROR_MESSAGES.over_request_rate_limit;
  return GENERIC_AUTH_ERROR;
}
