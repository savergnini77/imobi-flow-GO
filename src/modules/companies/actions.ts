"use server";

// Server Actions de imobiliária: criação no onboarding, troca da ativa e
// edição dos dados. A autorização real é do banco (RLS); UPDATE bloqueado pela
// RLS afeta 0 linhas sem erro, por isso conferimos o retorno de .select().

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  type ActionResult,
  failFields,
  failForm,
  succeed,
  zodToFieldErrors,
} from "@/lib/action-result";
import {
  ACTIVE_COMPANY_COOKIE,
  ACTIVE_COMPANY_COOKIE_OPTIONS,
  can,
  getMemberships,
  getUser,
  requireAppContext,
} from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { companySettingsSchema, createCompanySchema } from "@/modules/companies/schema";

const NOT_ALLOWED = "Você não tem permissão para editar os dados da imobiliária.";

/** Atualiza nome e dados cadastrais da imobiliária ativa. */
export async function updateCompanySettings(input: unknown): Promise<ActionResult> {
  const parsed = companySettingsSchema.safeParse(input);
  if (!parsed.success) return failFields(zodToFieldErrors(parsed.error));

  const context = await requireAppContext();
  const companyId = context.active.companyId;
  const { name, legalName, ...rest } = parsed.data;
  const supabase = await createClient();

  if (can(context, "company.manage") && name !== context.active.companyName) {
    const { data, error } = await supabase
      .from("companies")
      .update({ name })
      .eq("id", companyId)
      .select("id");
    if (error) {
      console.error("[companies.updateName]", error.code);
      return failForm("Não foi possível salvar o nome. Tente novamente.");
    }
    if (!data?.length) return failForm(NOT_ALLOWED);
  }

  const { data, error } = await supabase
    .from("company_settings")
    .update({ legal_name: legalName, ...rest })
    .eq("company_id", companyId)
    .select("company_id");

  if (error) {
    console.error("[companies.updateSettings]", error.code);
    return failForm(
      error.code === "23514"
        ? "Dados inválidos. Confira os campos e tente novamente."
        : "Não foi possível salvar. Tente novamente.",
    );
  }
  if (!data?.length) return failForm(NOT_ALLOWED);

  revalidatePath("/", "layout");
  return succeed(undefined);
}

/** Cria a primeira imobiliária do usuário (já com a filial "Matriz"). */
export async function createCompany(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = createCompanySchema.safeParse(input);
  if (!parsed.success) return failFields(zodToFieldErrors(parsed.error));

  const user = await getUser();
  if (!user) return failForm("Sua sessão expirou. Entre novamente.");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("provision_company", {
    p_name: parsed.data.name,
  });

  if (error) {
    console.error("[companies.create]", error.code);
    if (error.code === "P0001") {
      return failForm("Você já criou uma imobiliária. Peça um convite para entrar em outra.");
    }
    if (error.code === "22023") {
      return failFields({ name: ["O nome deve ter entre 2 e 120 caracteres."] });
    }
    return failForm("Não foi possível criar a imobiliária. Tente novamente.");
  }

  const company = data as { id: string };
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_COMPANY_COOKIE, company.id, ACTIVE_COMPANY_COOKIE_OPTIONS);

  return succeed({ id: company.id });
}

/** Troca a imobiliária ativa (só contexto de navegação; validada contra as memberships). */
export async function switchCompany(companyId: unknown): Promise<ActionResult> {
  const parsed = z.uuid().safeParse(companyId);
  if (!parsed.success) return failForm("Imobiliária inválida.");

  const user = await getUser();
  if (!user) return failForm("Sua sessão expirou. Entre novamente.");

  const memberships = await getMemberships(user.id);
  if (!memberships.some((m) => m.companyId === parsed.data)) {
    return failForm("Você não pertence a esta imobiliária.");
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_COMPANY_COOKIE, parsed.data, ACTIVE_COMPANY_COOKIE_OPTIONS);
  revalidatePath("/", "layout");
  return succeed(undefined);
}
