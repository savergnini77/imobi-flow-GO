import type { Metadata } from "next";

import { UpdatePasswordForm } from "./update-password-form";

export const metadata: Metadata = { title: "Nova senha" };

// Destino do link de recuperação (via /auth/callback?next=/auth/update-password).
export default function UpdatePasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Crie uma nova senha</h1>
      <p className="text-muted-foreground mt-1 mb-8 text-sm">
        Escolha uma senha com pelo menos 8 caracteres.
      </p>
      <UpdatePasswordForm />
    </>
  );
}
