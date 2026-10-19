/**
 * Atualiza a sessão do Supabase a cada requisição (usado pelo proxy) e faz o
 * redirecionamento OTIMISTA das rotas protegidas.
 *
 * A checagem definitiva continua no servidor (requireAppContext / RLS): aqui
 * só evitamos renderizar uma página protegida para quem claramente não tem
 * sessão.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getPublicSupabaseEnv } from "@/lib/env";

/** Prefixos que exigem sessão. */
const PROTECTED_PREFIXES = ["/dashboard", "/settings", "/onboarding", "/convite"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Cookies de sessão do Supabase seguem o padrão sb-<ref>-auth-token(.N). */
function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"));
}

function redirectToSignIn(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/entrar";
  url.search = "";
  const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (next !== "/dashboard") url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Visitante sem cookie de sessão: nada a renovar. Evita uma ida ao Supabase
  // em toda página pública (landing, login), o que mantém essas páginas rápidas.
  if (!hasSessionCookie(request)) {
    return isProtected(pathname) ? redirectToSignIn(request) : NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, anonKey } = getPublicSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Renova o token se necessário. Não colocar código entre createServerClient e getUser.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtected(pathname)) {
    const redirect = redirectToSignIn(request);
    // Preserva a limpeza de cookies feita pelo Supabase ao detectar sessão inválida.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return response;
}
