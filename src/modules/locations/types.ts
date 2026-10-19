import type { UF } from "@/modules/locations/schema";

/** Linha de public.locations, já em camelCase. */
export type Location = {
  id: string;
  companyId: string;
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
  state: UF | null;
  isHeadquarters: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Filial com contagens para a lista. */
export type LocationWithStats = Location & {
  memberCount: number;
  teamCount: number;
};

/** Pessoa lotada em uma filial. */
export type LocationMember = {
  userId: string;
  fullName: string | null;
  roleName: string | null;
};

/** Equipe vinculada (ou vinculável) a uma filial. */
export type LocationTeam = {
  id: string;
  name: string;
  locationId: string | null;
};
