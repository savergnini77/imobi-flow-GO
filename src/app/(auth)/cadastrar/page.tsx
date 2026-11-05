import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getUser } from "@/lib/auth/context";
import { safeNext } from "@/lib/utils/safe-next";

import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Criar conta" };

export default async function SignUpPage(props: PageProps<"/cadastrar">) {
  const { next } = await props.searchParams;
  const redirectTo = safeNext(typeof next === "string" ? next : null);
  if (await getUser()) redirect(redirectTo);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Crie sua conta</h1>
      <p className="text-muted-foreground mt-1 mb-8 text-sm">
        14 dias grátis, sem cartão de crédito. Em 2 minutos sua imobiliária está pronta.
      </p>
      <SignUpForm redirectTo={redirectTo} />
      <p className="text-muted-foreground mt-8 text-center text-sm">
        Já tem conta?{" "}
        <Link
          href={
            redirectTo === "/dashboard"
              ? "/entrar"
              : `/entrar?next=${encodeURIComponent(redirectTo)}`
          }
          className="text-primary font-medium hover:underline"
        >
          Entrar
        </Link>
      </p>
    </>
  );
}
