import { z } from "zod";

import { onlyDigits, phoneSchema } from "@/modules/locations/schema";

// O identificador (slug) é gerado no banco por provision_company, com sufixo
// automático em caso de colisão — o usuário só informa o nome.
export const createCompanySchema = z.object({
  name: z
    .string({ message: "Informe o nome da imobiliária." })
    .trim()
    .min(2, "O nome deve ter ao menos 2 caracteres.")
    .max(120, "O nome deve ter no máximo 120 caracteres."),
});

export type CreateCompanyInput = z.input<typeof createCompanySchema>;

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

/** CPF (11) ou CNPJ (14 dígitos), aceitando máscara; normaliza para dígitos. */
export const documentSchema = z
  .string()
  .optional()
  .nullable()
  .transform((value) => (value ? onlyDigits(value) : ""))
  .refine((value) => value === "" || value.length === 11 || value.length === 14, {
    message: "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos).",
  })
  .transform((value) => (value === "" ? null : value));

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .optional()
  .nullable()
  .refine((value) => !value || z.email().safeParse(value).success, {
    message: "Informe um e-mail válido.",
  })
  .transform((value) => (value ? value : null));

/** Site: aceita "minhaimob.com.br" e completa o protocolo. */
const websiteSchema = z
  .string()
  .trim()
  .max(200, "O site deve ter no máximo 200 caracteres.")
  .optional()
  .nullable()
  .transform((value) => {
    if (!value) return null;
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  })
  .refine((value) => !value || z.url().safeParse(value).success, {
    message: "Informe um endereço de site válido.",
  });

/** Dados da imobiliária editáveis em Configurações. */
export const companySettingsSchema = z.object({
  name: createCompanySchema.shape.name,
  legalName: optionalText(160, "A razão social"),
  document: documentSchema,
  creci: optionalText(30, "O CRECI"),
  email: optionalEmail,
  phone: phoneSchema,
  whatsapp: phoneSchema,
  website: websiteSchema,
});

export type CompanySettingsInput = z.input<typeof companySettingsSchema>;
export type CompanySettingsData = z.output<typeof companySettingsSchema>;
