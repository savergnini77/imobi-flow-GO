/**
 * Proxy do Next.js 16 (antes chamado de "middleware").
 *
 * Mantém a sessão do Supabase atualizada e faz o redirecionamento otimista
 * das rotas protegidas (a checagem definitiva fica no servidor e na RLS).
 */
import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/session";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  /**
   * Roda em todas as rotas, EXCETO:
   * - _next/static (arquivos estáticos)
   * - _next/image (otimização de imagem)
   * - favicon.ico
   * - arquivos de imagem comuns
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
