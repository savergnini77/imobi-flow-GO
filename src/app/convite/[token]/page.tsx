import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoMark, MailIcon } from "@/components/shared/icons";
import { getUser } from "@/lib/auth/context";
import { getInvitationPreview } from "@/modules/invitations/queries";

import { AcceptInvitation } from "./accept-invitation";

export const metadata: Metadata = { title: "Convite", robots: { index: false } };

export default async function InvitationPage(props: PageProps<"/convite/[token]">) {
  const { token } = await props.params;
  const user = await getUser();
  if (!user) redirect(`/entrar?next=${encodeURIComponent(`/convite/${token}`)}`);

  const invitation = await getInvitationPreview(token);
  const emailMatches = invitation && invitation.email.toLowerCase() === user.email.toLowerCase();

  let problem: string | null = null;
  if (!invitation) problem = "Convite inválido. Confira o link ou peça um novo convite.";
  else if (invitation.status === "accepted") problem = "Este convite já foi utilizado.";
  else if (invitation.status !== "pending") problem = "Este convite não está mais disponível.";
  else if (invitation.isExpired) problem = "Este convite expirou. Peça um novo convite.";
  else if (!emailMatches) {
    problem = `Este convite foi enviado para ${invitation.email}, mas você entrou como ${user.email}. Saia e entre com a conta do e-mail convidado.`;
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-2.5">
          <LogoMark className="size-7" />
          <span className="font-semibold tracking-tight">Imobi Flow GO</span>
        </div>

        <div className="border-border bg-surface rounded-2xl border p-6 shadow-sm">
          <div className="bg-accent text-accent-foreground mb-4 flex size-12 items-center justify-center rounded-full">
            <MailIcon />
          </div>

          {problem ? (
            <>
              <h1 className="text-xl font-semibold tracking-tight">
                Não foi possível usar este convite
              </h1>
              <p role="alert" className="text-muted-foreground mt-2 text-sm">
                {problem}
              </p>
              <Link
                href="/dashboard"
                className="text-primary mt-6 inline-block text-sm font-medium hover:underline"
              >
                Ir para o painel
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold tracking-tight">
                Você foi convidado para {invitation!.companyName}
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Seu papel será <strong className="text-foreground">{invitation!.roleName}</strong>.
                Ao aceitar, você passa a ver os dados desta imobiliária de acordo com esse papel.
              </p>
              <AcceptInvitation token={token} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
