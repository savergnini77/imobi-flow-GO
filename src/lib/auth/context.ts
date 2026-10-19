/**
 * Contexto do usuário logado e da imobiliária ativa (somente servidor).
 *
 * Regra do projeto: a imobiliária ativa é APENAS contexto de navegação.
 * O cookie é validado contra as memberships do usuário, e toda autorização
 * de verdade continua no banco (RLS + app.has_permission). As permissões
 * lidas aqui servem só para esconder/mostrar botões na interface.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export const ACTIVE_COMPANY_COOKIE = "active_company_id";

export const ACTIVE_COMPANY_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

export type CompanyMembership = {
  companyId: string;
  companyName: string;
  companySlug: string;
  roleSlug: string;
  roleName: string;
  permissions: Set<string>;
  plan: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
};

export type SessionUser = {
  id: string;
  email: string;
  fullName: string | null;
};

type MembershipRow = {
  company_id: string;
  companies: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    subscription_status: string;
    trial_ends_at: string | null;
  } | null;
  roles: {
    slug: string;
    name: string;
    role_permissions: { permissions: { key: string } | null }[];
  } | null;
};

/** Usuário autenticado (validado no servidor do Supabase) ou null. */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", data.user.id)
    .maybeSingle();

  return {
    id: data.user.id,
    email: data.user.email ?? "",
    fullName: (profile?.full_name as string | null | undefined) ?? null,
  };
});

/** Todas as imobiliárias do usuário, com papel e permissões (uma única query). */
export const getMemberships = cache(async (userId: string): Promise<CompanyMembership[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select(
      "company_id, companies(id, name, slug, plan, subscription_status, trial_ends_at), roles(slug, name, role_permissions(permissions(key)))",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[auth.getMemberships]", error.code);
    return [];
  }

  return ((data ?? []) as unknown as MembershipRow[])
    .filter((row) => row.companies && row.roles)
    .map((row) => ({
      companyId: row.company_id,
      companyName: row.companies!.name,
      companySlug: row.companies!.slug,
      plan: row.companies!.plan,
      subscriptionStatus: row.companies!.subscription_status,
      trialEndsAt: row.companies!.trial_ends_at,
      roleSlug: row.roles!.slug,
      roleName: row.roles!.name,
      permissions: new Set(
        row
          .roles!.role_permissions.map((rp) => rp.permissions?.key)
          .filter((key): key is string => Boolean(key)),
      ),
    }));
});

export type AppContext = {
  user: SessionUser;
  memberships: CompanyMembership[];
  active: CompanyMembership;
};

/**
 * Exige usuário logado com ao menos uma imobiliária.
 * - sem sessão -> /entrar
 * - sem imobiliária -> /onboarding
 */
export const requireAppContext = cache(async (): Promise<AppContext> => {
  const user = await getUser();
  if (!user) redirect("/entrar");

  const memberships = await getMemberships(user.id);
  if (memberships.length === 0) redirect("/onboarding");

  const cookieStore = await cookies();
  const wanted = cookieStore.get(ACTIVE_COMPANY_COOKIE)?.value;
  const active = memberships.find((m) => m.companyId === wanted) ?? memberships[0];

  return { user, memberships, active };
});

/** Atalho para checar uma permissão na imobiliária ativa (só para a interface). */
export function can(context: AppContext, permission: string): boolean {
  return context.active.permissions.has(permission);
}
