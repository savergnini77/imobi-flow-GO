"use server";

// Server Actions de convite (lado de quem RECEBE o convite).
// O envio de convites (tela de membros) entra no Sprint 2.

import { cookies } from "next/headers";
import { z } from "zod";

import { type ActionResult, failForm, succeed } from "@/lib/action-result";
import { ACTIVE_COMPANY_COOKIE, ACTIVE_COMPANY_COOKIE_OPTIONS } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { mapInvitationError } from "@/modules/invitations/errors";

const tokenSchema = z
  .string()
  .trim()
  .regex(/^[a-f0-9]{64}$/);

/** Aceita o convite e torna a imobiliária do convite a ativa. */
export async function acceptInvitation(
  token: unknown,
): Promise<ActionResult<{ companyId: string }>> {
  const parsed = tokenSchema.safeParse(token);
  if (!parsed.success) return failForm(mapInvitationError({ code: "P0002" }));

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_invitation", { p_token: parsed.data });

  if (error) {
    console.error("[invitations.accept]", error.code);
    return failForm(mapInvitationError(error));
  }

  const companyId = data as string;
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_COMPANY_COOKIE, companyId, ACTIVE_COMPANY_COOKIE_OPTIONS);

  return succeed({ companyId });
}
