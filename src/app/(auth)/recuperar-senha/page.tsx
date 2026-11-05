import type { Metadata } from "next";
import Link from "next/link";

import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Recuperar senha</h1>
      <p className="text-muted-foreground mt-1 mb-8 text-sm">
        Informe seu e-mail e enviaremos um link para criar uma nova senha.
      </p>
      <ResetForm />
      <p className="text-muted-foreground mt-8 text-center text-sm">
        Lembrou?{" "}
        <Link href="/entrar" className="text-primary font-medium hover:underline">
          Voltar para o login
        </Link>
      </p>
    </>
  );
}
