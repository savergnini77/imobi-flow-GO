"use server";

// Server Actions de autenticação. Todo export deste arquivo é uma Server Action
// (função assíncrona), acessível por POST — por isso cada uma valida a entrada
// e, quando faz sentido, verifica a sessão.
//
// Estas ações NÃO redirecionam nem renderizam nada: retornam um ActionResult.
// A navegação será feita pelas telas, em subetapa futura.

import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import {
  type ActionResult,
  failFields,
  failForm,
  mapSupabaseAuthError,
  succeed,
  zodToFieldErrors,
} from "@/modules/auth/errors";
import {
  requestPasswordResetSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "@/modules/auth/schema";

/** Origem pública da aplicação, para montar os links de e-mail. */
async function appOrigin(): Promise<string> {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

export async function signUp(
  input: unknown,
): Promise<ActionResult<{ needsEmailConfirmation: boolean }>> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return failFields(zodToFieldErrors(parsed.error));
  }

  const { email, password, fullName } = parsed.data;
  const supabase = await createClient();
  const origin = await appOrigin();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: fullName ? { full_name: fullName } : undefined,
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("[auth.signUp]", error.code ?? error.name, error.status);
    return failForm(mapSupabaseAuthError(error));
  }

  // Com confirmação de e-mail ligada, não há sessão até o usuário confirmar.
  return succeed({ needsEmailConfirmation: !data.session });
}

export async function signIn(input: unknown): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return failFields(zodToFieldErrors(parsed.error));
  }

  const { email, password } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error("[auth.signIn]", error.code ?? error.name, error.status);
    return failForm(mapSupabaseAuthError(error));
  }

  return succeed(undefined);
}

export async function requestPasswordReset(input: unknown): Promise<ActionResult> {
  const parsed = requestPasswordResetSchema.safeParse(input);
  if (!parsed.success) {
    return failFields(zodToFieldErrors(parsed.error));
  }

  const supabase = await createClient();
  const origin = await appOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/auth/update-password`,
  });

  if (error) {
    // Não revelar se a conta existe: registramos no servidor, mas a resposta
    // ao cliente é sempre a mesma.
    console.error("[auth.requestPasswordReset]", error.code ?? error.name, error.status);
  }

  return succeed(undefined);
}

export async function updatePassword(input: unknown): Promise<ActionResult> {
  const parsed = updatePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return failFields(zodToFieldErrors(parsed.error));
  }

  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return failForm("Sua sessão expirou. Abra novamente o link de recuperação de senha.");
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    console.error("[auth.updatePassword]", error.code ?? error.name, error.status);
    return failForm(mapSupabaseAuthError(error));
  }

  return succeed(undefined);
}

export async function signOut(): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[auth.signOut]", error.code ?? error.name, error.status);
    return failForm("Não foi possível encerrar a sessão. Tente novamente.");
  }

  return succeed(undefined);
}
