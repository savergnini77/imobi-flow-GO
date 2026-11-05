import { z } from "zod";

// Schemas de validação das filiais.
// Usados no servidor (Server Actions) e no cliente (react-hook-form).
// Regras espelham as constraints de supabase/migrations/0003_locations.sql.

export const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

export type UF = (typeof UFS)[number];

/** Remove tudo que não é dígito. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Texto opcional: aparado; vazio vira null. */
function optionalText(max: number, label: string) {
  return z
    .string()
    .trim()
    .max(max, `${label} deve ter no máximo ${max} caracteres.`)
    .optional()
    .nullable()
    .transform((value) => (value ? value : null));
}

/** Telefone BR (fixo ou celular, com DDD): normalizado para 10–11 dígitos. */
export const phoneSchema = z
  .string()
  .optional()
  .nullable()
  .transform((value) => (value ? onlyDigits(value) : ""))
  .refine((value) => value === "" || /^\d{10,11}$/.test(value), {
    message: "Informe o telefone com DDD (10 ou 11 dígitos).",
  })
  .transform((value) => (value === "" ? null : value));

/** CEP: aceita "01310-100" ou "01310100"; normaliza para 8 dígitos. */
export const cepSchema = z
  .string()
  .optional()
  .nullable()
  .transform((value) => (value ? onlyDigits(value) : ""))
  .refine((value) => value === "" || /^\d{8}$/.test(value), {
    message: "CEP deve ter 8 dígitos.",
  })
  .transform((value) => (value === "" ? null : value));

/** E-mail opcional, normalizado. */
const optionalEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .optional()
  .nullable()
  .refine((value) => !value || z.email().safeParse(value).success, {
    message: "Informe um e-mail válido.",
  })
  .transform((value) => (value ? value : null));

/** UF opcional (sigla em maiúsculas). */
const stateSchema = z
  .string()
  .trim()
  .toUpperCase()
  .optional()
  .nullable()
  .refine((value) => !value || (UFS as readonly string[]).includes(value), {
    message: "Selecione uma UF válida.",
  })
  .transform((value) => (value ? (value as UF) : null));

/** Código interno opcional (ex.: "SP-01"). */
const codeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .optional()
  .nullable()
  .refine((value) => !value || /^[A-Z0-9-]{1,12}$/.test(value), {
    message: "Use até 12 letras, números ou hífen (ex.: SP-01).",
  })
  .transform((value) => (value ? value : null));

/** Dados editáveis de uma filial (criar e editar). */
export const locationInputSchema = z.object({
  name: z
    .string({ message: "Informe o nome da filial." })
    .trim()
    .min(2, "O nome deve ter ao menos 2 caracteres.")
    .max(80, "O nome deve ter no máximo 80 caracteres."),
  code: codeSchema,
  phone: phoneSchema,
  whatsapp: phoneSchema,
  email: optionalEmailSchema,
  cep: cepSchema,
  street: optionalText(120, "A rua"),
  number: optionalText(20, "O número"),
  complement: optionalText(80, "O complemento"),
  neighborhood: optionalText(80, "O bairro"),
  city: optionalText(80, "A cidade"),
  state: stateSchema,
});

export const locationIdSchema = z.uuid({ message: "Filial inválida." });

export const updateLocationSchema = locationInputSchema.extend({
  id: locationIdSchema,
});

export const locationMemberSchema = z.object({
  locationId: locationIdSchema,
  userId: z.uuid({ message: "Pessoa inválida." }),
});

export const locationTeamSchema = z.object({
  locationId: locationIdSchema,
  teamId: z.uuid({ message: "Equipe inválida." }),
});

export const toggleActiveSchema = z.object({
  id: locationIdSchema,
  isActive: z.boolean(),
});

/** Filtros da lista (vêm da URL; valores inválidos caem no padrão). */
export const locationFiltersSchema = z.object({
  q: z
    .string()
    .trim()
    .max(80)
    .optional()
    .catch(undefined)
    .transform((value) => (value ? value : undefined)),
  status: z.enum(["active", "inactive", "all"]).catch("all").default("all"),
});

export type LocationInput = z.input<typeof locationInputSchema>;
export type LocationData = z.output<typeof locationInputSchema>;
export type LocationFilters = z.output<typeof locationFiltersSchema>;
