// Leituras das filiais. Sempre filtradas por company_id além da RLS
// (a RLS garante o isolamento; o filtro escolhe a imobiliária ativa).

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { LocationFilters } from "@/modules/locations/schema";
import { toIlikeFilterValue } from "@/modules/locations/search";
import type {
  Location,
  LocationMember,
  LocationTeam,
  LocationWithStats,
} from "@/modules/locations/types";

export const LOCATION_COLUMNS =
  "id, company_id, name, code, phone, whatsapp, email, cep, street, number, complement, neighborhood, city, state, is_headquarters, is_active, created_at, updated_at";

type LocationRow = {
  id: string;
  company_id: string;
  name: string;
  code: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  cep: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: Location["state"];
  is_headquarters: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type LocationStatsRow = LocationRow & {
  location_members: { count: number }[];
  teams: { count: number }[];
};

export function toLocation(row: LocationRow): Location {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    code: row.code,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    cep: row.cep,
    street: row.street,
    number: row.number,
    complement: row.complement,
    neighborhood: row.neighborhood,
    city: row.city,
    state: row.state,
    isHeadquarters: row.is_headquarters,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Lista as filiais da imobiliária com contagem de corretores e equipes
 * em UMA query (contagens embutidas do PostgREST, sem N+1).
 * Ordem: matriz primeiro, ativas antes das inativas, depois por nome.
 */
export async function listLocations(
  companyId: string,
  filters: LocationFilters,
): Promise<LocationWithStats[]> {
  const supabase = await createClient();
  let query = supabase
    .from("locations")
    .select(`${LOCATION_COLUMNS}, location_members(count), teams(count)`)
    .eq("company_id", companyId)
    .order("is_headquarters", { ascending: false })
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  if (filters.status === "active") query = query.eq("is_active", true);
  if (filters.status === "inactive") query = query.eq("is_active", false);
  if (filters.q) {
    const pattern = toIlikeFilterValue(filters.q);
    query = query.or(
      `name.ilike.${pattern},city.ilike.${pattern},neighborhood.ilike.${pattern},code.ilike.${pattern}`,
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("[locations.list]", error.code);
    throw new Error("Não foi possível carregar as filiais.");
  }

  return ((data ?? []) as unknown as LocationStatsRow[]).map((row) => ({
    ...toLocation(row),
    memberCount: row.location_members?.[0]?.count ?? 0,
    teamCount: row.teams?.[0]?.count ?? 0,
  }));
}

/** Totais para o cabeçalho (independem do filtro). */
export async function countLocations(
  companyId: string,
): Promise<{ total: number; active: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("locations")
    .select("is_active")
    .eq("company_id", companyId);

  if (error) {
    console.error("[locations.count]", error.code);
    return { total: 0, active: 0 };
  }
  const rows = (data ?? []) as { is_active: boolean }[];
  return { total: rows.length, active: rows.filter((r) => r.is_active).length };
}

/** Uma filial da imobiliária ativa (null se não existir ou não for visível). */
export const getLocation = cache(
  async (companyId: string, id: string): Promise<Location | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("locations")
      .select(LOCATION_COLUMNS)
      .eq("company_id", companyId)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[locations.get]", error.code);
      return null;
    }
    return data ? toLocation(data as unknown as LocationRow) : null;
  },
);

type MemberRow = {
  user_id: string;
  memberships: {
    profiles: { full_name: string | null } | null;
    roles: { name: string } | null;
  } | null;
};

/** Pessoas lotadas na filial, com nome e papel. */
export async function listLocationMembers(
  companyId: string,
  locationId: string,
): Promise<LocationMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("location_members")
    .select("user_id, memberships(profiles(full_name), roles(name))")
    .eq("company_id", companyId)
    .eq("location_id", locationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[locations.members]", error.code);
    return [];
  }

  return ((data ?? []) as unknown as MemberRow[]).map((row) => ({
    userId: row.user_id,
    fullName: row.memberships?.profiles?.full_name ?? null,
    roleName: row.memberships?.roles?.name ?? null,
  }));
}

type CompanyMemberRow = {
  user_id: string;
  profiles: { full_name: string | null } | null;
  roles: { name: string } | null;
};

/** Todas as pessoas da imobiliária (para o seletor "adicionar à filial"). */
export async function listCompanyMembers(companyId: string): Promise<LocationMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("user_id, profiles(full_name), roles(name)")
    .eq("company_id", companyId);

  if (error) {
    console.error("[locations.companyMembers]", error.code);
    return [];
  }

  return ((data ?? []) as unknown as CompanyMemberRow[])
    .map((row) => ({
      userId: row.user_id,
      fullName: row.profiles?.full_name ?? null,
      roleName: row.roles?.name ?? null,
    }))
    .sort((a, b) => (a.fullName ?? "").localeCompare(b.fullName ?? "", "pt-BR"));
}

/** Equipes da imobiliária (com a filial a que pertencem, se houver). */
export async function listCompanyTeams(companyId: string): Promise<LocationTeam[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .select("id, name, location_id")
    .eq("company_id", companyId)
    .order("name", { ascending: true });

  if (error) {
    console.error("[locations.teams]", error.code);
    return [];
  }

  return ((data ?? []) as { id: string; name: string; location_id: string | null }[]).map(
    (row) => ({ id: row.id, name: row.name, locationId: row.location_id }),
  );
}
