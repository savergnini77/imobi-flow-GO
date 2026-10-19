import type { ReactNode } from "react";

import { AppShell } from "@/components/shared/app-shell";
import { requireAppContext } from "@/lib/auth/context";
import { trialDaysLeft } from "@/lib/billing/trial";

// Área logada: exige sessão e imobiliária (senão redireciona para /entrar ou /onboarding).
export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user, memberships, active } = await requireAppContext();

  return (
    <AppShell
      companies={memberships.map((m) => ({
        id: m.companyId,
        name: m.companyName,
        roleName: m.roleName,
      }))}
      activeCompanyId={active.companyId}
      userName={user.fullName ?? ""}
      userEmail={user.email}
      trialDaysLeft={trialDaysLeft(active)}
    >
      {children}
    </AppShell>
  );
}
