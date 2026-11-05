import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LogoMark } from "@/components/shared/icons";
import { getMemberships, getUser } from "@/lib/auth/context";

import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Criar imobiliária" };

export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/entrar");
  if ((await getMemberships(user.id)).length > 0) redirect("/dashboard");

  const firstName = user.fullName?.split(" ")[0];

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-2.5">
          <LogoMark className="size-7" />
          <span className="font-semibold tracking-tight">Imobi Flow GO</span>
        </div>
        <p className="text-primary text-sm font-medium">Passo final</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {firstName ? `${firstName}, qual é a sua imobiliária?` : "Qual é a sua imobiliária?"}
        </h1>
        <p className="text-muted-foreground mt-1 mb-8 text-sm">
          Criamos sua imobiliária já com a <strong className="text-foreground">Matriz</strong>{" "}
          cadastrada. Depois é só adicionar as outras filiais e a equipe.
        </p>
        <div className="border-border bg-surface rounded-2xl border p-6 shadow-sm">
          <OnboardingForm />
        </div>
      </div>
    </main>
  );
}
