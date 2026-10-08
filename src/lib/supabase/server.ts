/**
 * Cliente Supabase para uso no servidor (Server Components, Server Actions,
 * Route Handlers). Lê e grava a sessão nos cookies da requisição.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getPublicSupabaseEnv } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getPublicSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Chamado a partir de um Server Component (cookies somente leitura).
          // Pode ser ignorado: o proxy já mantém a sessão atualizada.
        }
      },
    },
  });
}
