import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getUser } from "@/lib/auth/context";
import { safeNext } from "@/lib/utils/safe-next";

import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Entrar" };

const ERRORS: Record<string, string> = {
  link: "O link expirou ou já foi usado. Entre com sua senha ou peça um novo link.",
};

export default async function SignInPage(props: PageProps<"/entrar">) {
  const { erro, next } = await props.searchParams;
  const redirectTo = safeNext(typeof next === "string" ? next : null);
  if (await getUser()) redirect(redirectTo);
  const initialError = typeof erro === "string" ? ERRORS[erro] : undefined;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo de volta</h1>
      <p className="text-muted-foreground mt-1 mb-8 text-sm">
        Entre para gerenciar sua imobiliária.
      </p>
      <SignInForm initialError={initialError} redirectTo={redirectTo} />
      <p className="text-muted-foreground mt-8 text-center text-sm">
        Ainda não tem conta?{" "}
        <Link
          href={
            redirectTo === "/dashboard"
              ? "/cadastrar"
              : `/cadastrar?next=${encodeURIComponent(redirectTo)}`
          }
          className="text-primary font-medium hover:underline"
        >
          Criar conta grátis
        </Link>
      </p>
    </>
  );
}
