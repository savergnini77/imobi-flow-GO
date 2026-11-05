import type { Metadata } from "next";

import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { can, requireAppContext } from "@/lib/auth/context";
import { getCompanySettings } from "@/modules/companies/queries";

import { CompanySettingsForm } from "./company-settings-form";

export const metadata: Metadata = { title: "Imobiliária" };

export default async function CompanySettingsPage() {
  const context = await requireAppContext();
  const settings = await getCompanySettings(context.active.companyId);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Configurações"
        title="Dados da imobiliária"
        description="Aparecem para a sua equipe e, nas próximas etapas, nas páginas de imóveis e nas mensagens aos clientes."
      />
      <div className="border-border bg-surface mt-8 max-w-2xl rounded-2xl border p-6 shadow-xs">
        <CompanySettingsForm
          defaults={settings}
          canEdit={can(context, "settings.manage")}
          canRename={can(context, "company.manage")}
        />
      </div>
    </PageContainer>
  );
}
