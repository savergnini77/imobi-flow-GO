"use server";

// Server Actions das filiais. Todo export deste arquivo é acessível por POST,
// então cada ação valida a entrada e exige sessão. A autorização real é feita
// pelo banco (RLS + app.has_permission); aqui só traduzimos o resultado.
//
// Detalhe importante do PostgREST: UPDATE/DELETE bloqueados pela RLS não dão
// erro — afetam 0 linhas. Por isso toda escrita pede `.select()` e confere
// se alguma linha voltou.

import { revalidatePath } from "next/cache";

import {
  type ActionResult,
  failFields,
  failForm,
  succeed,
  zodToFieldErrors,
} from "@/lib/action-result";
import { requireAppContext } from "@/lib/auth/context";
import { type CepAddress, lookupCepAddress } from "@/lib/cep";
import { createClient } from "@/lib/supabase/server";
import { mapLocationDbError, type PostgrestErrorLike } from "@/modules/locations/errors";
import {
  cepSchema,
  locationIdSchema,
  locationInputSchema,
  locationMemberSchema,
  locationTeamSchema,
  toggleActiveSchema,
  updateLocationSchema,
  type LocationData,
} from "@/modules/locations/schema";

const LIST_PATH = "/settings/locations";
const NOT_ALLOWED = "Filial não encontrada ou você não tem permissão para esta ação.";

function fail(error: PostgrestErrorLike, scope: string) {
  console.error(`[locations.${scope}]`, error.code);
  const mapped = mapLocationDbError(error);
  return mapped.field ? failFields({ [mapped.field]: [mapped.message] }) : failForm(mapped.message);
}

function toRow(data: LocationData) {
  return {
    name: data.name,
    code: data.code,
    phone: data.phone,
    whatsapp: data.whatsapp,
    email: data.email,
    cep: data.cep,
    street: data.street,
    number: data.number,
    complement: data.complement,
    neighborhood: data.neighborhood,
    city: data.city,
    state: data.state,
  };
}

function revalidateLocation(id?: string) {
  revalidatePath(LIST_PATH);
  if (id) revalidatePath(`${LIST_PATH}/${id}`);
}

export async function createLocation(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = locationInputSchema.safeParse(input);
  if (!parsed.success) return failFields(zodToFieldErrors(parsed.error));

  const { user, active } = await requireAppContext();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("locations")
    .insert({ ...toRow(parsed.data), company_id: active.companyId, created_by: user.id })
    .select("id")
    .single();

  if (error) return fail(error, "create");

  revalidateLocation();
  return succeed({ id: (data as { id: string }).id });
}

export async function updateLocation(input: unknown): Promise<ActionResult> {
  const parsed = updateLocationSchema.safeParse(input);
  if (!parsed.success) return failFields(zodToFieldErrors(parsed.error));

  const { active } = await requireAppContext();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("locations")
    .update(toRow(parsed.data))
    .eq("id", parsed.data.id)
    .eq("company_id", active.companyId)
    .select("id");

  if (error) return fail(error, "update");
  if (!data?.length) return failForm(NOT_ALLOWED);

  revalidateLocation(parsed.data.id);
  return succeed(undefined);
}

export async function setHeadquarters(id: unknown): Promise<ActionResult> {
  const parsed = locationIdSchema.safeParse(id);
  if (!parsed.success) return failForm("Filial inválida.");

  await requireAppContext();
  const supabase = await createClient();

  const { error } = await supabase.rpc("set_headquarters", { p_location_id: parsed.data });
  if (error) return fail(error, "setHeadquarters");

  revalidateLocation(parsed.data);
  return succeed(undefined);
}

export async function toggleLocationActive(input: unknown): Promise<ActionResult> {
  const parsed = toggleActiveSchema.safeParse(input);
  if (!parsed.success) return failForm("Dados inválidos.");

  const { active } = await requireAppContext();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("locations")
    .update({ is_active: parsed.data.isActive })
    .eq("id", parsed.data.id)
    .eq("company_id", active.companyId)
    .select("id");

  if (error) return fail(error, "toggleActive");
  if (!data?.length) return failForm(NOT_ALLOWED);

  revalidateLocation(parsed.data.id);
  return succeed(undefined);
}

export async function deleteLocation(id: unknown): Promise<ActionResult> {
  const parsed = locationIdSchema.safeParse(id);
  if (!parsed.success) return failForm("Filial inválida.");

  const { active } = await requireAppContext();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("locations")
    .delete()
    .eq("id", parsed.data)
    .eq("company_id", active.companyId)
    .select("id");

  if (error) return fail(error, "delete");
  if (!data?.length) return failForm(NOT_ALLOWED);

  revalidatePath(LIST_PATH);
  return succeed(undefined);
}

export async function addLocationMember(input: unknown): Promise<ActionResult> {
  const parsed = locationMemberSchema.safeParse(input);
  if (!parsed.success) return failForm("Dados inválidos.");

  const { active } = await requireAppContext();
  const supabase = await createClient();

  const { error } = await supabase.from("location_members").insert({
    company_id: active.companyId,
    location_id: parsed.data.locationId,
    user_id: parsed.data.userId,
  });

  if (error) return fail(error, "addMember");

  revalidateLocation(parsed.data.locationId);
  return succeed(undefined);
}

export async function removeLocationMember(input: unknown): Promise<ActionResult> {
  const parsed = locationMemberSchema.safeParse(input);
  if (!parsed.success) return failForm("Dados inválidos.");

  const { active } = await requireAppContext();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("location_members")
    .delete()
    .eq("company_id", active.companyId)
    .eq("location_id", parsed.data.locationId)
    .eq("user_id", parsed.data.userId)
    .select("id");

  if (error) return fail(error, "removeMember");
  if (!data?.length) return failForm(NOT_ALLOWED);

  revalidateLocation(parsed.data.locationId);
  return succeed(undefined);
}

/** Vincula (ou move) uma equipe para a filial. Exige teams.update. */
export async function linkTeam(input: unknown): Promise<ActionResult> {
  const parsed = locationTeamSchema.safeParse(input);
  if (!parsed.success) return failForm("Dados inválidos.");

  const { active } = await requireAppContext();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("teams")
    .update({ location_id: parsed.data.locationId })
    .eq("id", parsed.data.teamId)
    .eq("company_id", active.companyId)
    .select("id");

  if (error) return fail(error, "linkTeam");
  if (!data?.length) return failForm("Equipe não encontrada ou você não tem permissão.");

  revalidateLocation(parsed.data.locationId);
  return succeed(undefined);
}

/** Desvincula a equipe da filial (a equipe continua existindo). */
export async function unlinkTeam(input: unknown): Promise<ActionResult> {
  const parsed = locationTeamSchema.safeParse(input);
  if (!parsed.success) return failForm("Dados inválidos.");

  const { active } = await requireAppContext();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("teams")
    .update({ location_id: null })
    .eq("id", parsed.data.teamId)
    .eq("location_id", parsed.data.locationId)
    .eq("company_id", active.companyId)
    .select("id");

  if (error) return fail(error, "unlinkTeam");
  if (!data?.length) return failForm("Equipe não encontrada ou você não tem permissão.");

  revalidateLocation(parsed.data.locationId);
  return succeed(undefined);
}

/** Busca o endereço pelo CEP. Exige sessão para não virar proxy público. */
export async function lookupCep(rawCep: unknown): Promise<CepAddress | null> {
  const parsed = cepSchema.safeParse(typeof rawCep === "string" ? rawCep : "");
  if (!parsed.success || !parsed.data) return null;

  await requireAppContext();
  return lookupCepAddress(parsed.data);
}
