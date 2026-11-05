import type { Metadata } from "next";
import Link from "next/link";

import { getUser } from "@/lib/auth/context";

import { UpdatePasswordForm } from "./update-password-form";

export const metadata: Metadata = { title: "Nova senha" };

// Destino do link de recuperação (via /auth/callback?next=/auth/update-password).
// Sem sessão (link expirado ou página aberta direto), não adianta mostrar o
// formulário: a troca de senha exige a sessão criada pelo link do e-mail.
export default async function UpdatePasswordPage() {
  const user = await getUser();

  if (!user) {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight">Link expirado</h1>
        <p role="alert" className="text-muted-foreground mt-2 text-sm">
          O link de recuperação expirou ou já foi usado. Peça um novo para criar sua senha.
        </p>
        <Link
          href="/recuperar-senha"
          className="text-primary mt-6 inline-block text-sm font-medium hover:underline"
        >
          Enviar um novo link
        </Link>
      </>
    );
  }

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
