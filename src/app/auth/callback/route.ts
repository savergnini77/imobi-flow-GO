// Callback dos links de e-mail do Supabase (confirmação de cadastro e
// recuperação de senha). Troca o código/token por uma sessão e redireciona.
//
// Suporta os dois formatos de link do Supabase:
//  - PKCE:       /auth/callback?code=...
//  - token_hash: /auth/callback?token_hash=...&type=signup|recovery|invite|email_change

import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/utils/safe-next";

const OTP_TYPES: readonly EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // Recuperação de senha sempre termina na tela de nova senha.
  const next = type === "recovery" ? "/auth/update-password" : safeNext(searchParams.get("next"));

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
    console.error("[auth.callback.code]", error.code ?? error.name, error.status);
  } else if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL(next, origin));
    console.error("[auth.callback.otp]", error.code ?? error.name, error.status);
  }

  return NextResponse.redirect(new URL("/entrar?erro=link", origin));
}
