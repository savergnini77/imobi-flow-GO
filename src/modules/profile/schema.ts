import { z } from "zod";

import { phoneSchema } from "@/modules/locations/schema";

/** Dados do perfil editáveis pelo próprio usuário. */
export const profileSchema = z.object({
  fullName: z
    .string({ message: "Informe seu nome." })
    .trim()
    .min(2, "O nome deve ter ao menos 2 caracteres.")
    .max(120, "O nome deve ter no máximo 120 caracteres."),
  phone: phoneSchema,
  jobTitle: z
    .string()
    .trim()
    .max(80, "O cargo deve ter no máximo 80 caracteres.")
    .optional()
    .nullable()
    .transform((value) => (value ? value : null)),
});

export type ProfileInput = z.input<typeof profileSchema>;
