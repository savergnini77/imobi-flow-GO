import { z } from "zod";

// Schemas de validação da autenticação.
// Usados no servidor (Server Actions) e, depois, no cliente (react-hook-form).

/** E-mail normalizado (aparado + minúsculas) e validado. */
export const emailSchema = z
  .string({ message: "Informe o e-mail." })
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: "Informe um e-mail válido." }));

/** Senha para cadastro / nova senha. 72 = limite de bytes do bcrypt. */
export const passwordSchema = z
  .string({ message: "Informe a senha." })
  .min(8, "A senha deve ter ao menos 8 caracteres.")
  .max(72, "A senha deve ter no máximo 72 caracteres.");

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z
    .string()
    .trim()
    .max(120, "O nome deve ter no máximo 120 caracteres.")
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
});

export const signInSchema = z.object({
  email: emailSchema,
  // No login não exigimos comprimento mínimo: as credenciais conferem ou não.
  password: z.string({ message: "Informe a senha." }).min(1, "Informe a senha."),
});

export const requestPasswordResetSchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string({ message: "Confirme a senha." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
