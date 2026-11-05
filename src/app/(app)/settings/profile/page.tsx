import type { Metadata } from "next";

import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { requireAppContext } from "@/lib/auth/context";
import { getProfile } from "@/modules/profile/queries";

import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function ProfilePage() {
  const { user } = await requireAppContext();
  const profile = await getProfile(user.id);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Configurações"
        title="Meu perfil"
        description="Seu nome e contato aparecem para a equipe e, depois, nas mensagens aos clientes."
      />
      <div className="border-border bg-surface mt-8 max-w-xl rounded-2xl border p-6 shadow-xs">
        <ProfileForm email={user.email} defaults={profile} />
      </div>
    </PageContainer>
  );
}
