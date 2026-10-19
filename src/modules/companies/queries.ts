// Leituras da imobiliária ativa. Sempre filtradas por company_id além da RLS.

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export type CompanySettings = {
  name: string;
  legalName: string | null;
  document: string | null;
  creci: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
};

type SettingsRow = {
  legal_name: string | null;
  document: string | null;
  creci: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  companies: { name: string } | null;
};

export const getCompanySettings = cache(
  async (companyId: string): Promise<CompanySettings | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("company_settings")
      .select("legal_name, document, creci, email, phone, whatsapp, website, companies(name)")
      .eq("company_id", companyId)
      .maybeSingle();

    if (error) {
      console.error("[companies.getSettings]", error.code);
      return null;
    }
    const row = data as unknown as SettingsRow | null;
    if (!row) return null;

    return {
      name: row.companies?.name ?? "",
      legalName: row.legal_name,
      document: row.document,
      creci: row.creci,
      email: row.email,
      phone: row.phone,
      whatsapp: row.whatsapp,
      website: row.website,
    };
  },
);

/** Progresso dos primeiros passos exibidos no painel. */
export type SetupProgress = {
  companyDetails: boolean;
  extraLocation: boolean;
  teamInvited: boolean;
};

export const getSetupProgress = cache(async (companyId: string): Promise<SetupProgress> => {
  const supabase = await createClient();
  const [settings, locations, members, invitations] = await Promise.all([
    getCompanySettings(companyId),
    supabase
      .from("locations")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId),
    supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId),
    supabase
      .from("invitations")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "pending"),
  ]);

  return {
    companyDetails: Boolean(settings && (settings.whatsapp || settings.phone) && settings.creci),
    extraLocation: (locations.count ?? 0) > 1,
    teamInvited: (members.count ?? 0) > 1 || (invitations.count ?? 0) > 0,
  };
});
