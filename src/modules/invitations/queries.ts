// Leituras de convites (somente servidor).

import { createClient } from "@/lib/supabase/server";

export type InvitationPreview = {
  companyName: string;
  roleName: string;
  email: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  isExpired: boolean;
};

type PreviewRow = {
  company_name: string;
  role_name: string;
  email: string;
  status: InvitationPreview["status"];
  is_expired: boolean;
};

/** Dados mínimos do convite para a tela de aceite (null se o token não existe). */
export async function getInvitationPreview(token: string): Promise<InvitationPreview | null> {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_invitation_preview", { p_token: token });
  if (error) {
    console.error("[invitations.preview]", error.code);
    return null;
  }

  const row = (data as PreviewRow[] | null)?.[0];
  if (!row) return null;

  return {
    companyName: row.company_name,
    roleName: row.role_name,
    email: row.email,
    status: row.status,
    isExpired: row.is_expired,
  };
}
