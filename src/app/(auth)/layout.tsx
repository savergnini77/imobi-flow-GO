import type { ReactNode } from "react";

import { BuildingIcon, LogoMark, ShieldIcon, TeamIcon } from "@/components/shared/icons";

// Casca das telas públicas: painel de marca à esquerda (desktop) + formulário.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="bg-sidebar relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -right-40 size-[480px] rounded-full bg-emerald-500/20 blur-3xl"
        />
        <div className="relative flex items-center gap-3">
          <LogoMark />
          <span className="text-lg font-semibold tracking-tight">Imobi Flow GO</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl leading-tight font-semibold tracking-tight">
            Sua imobiliária inteira, organizada em um só lugar.
          </h1>
          <p className="mt-4 text-base text-white/70">
            Filiais, equipes e corretores com as permissões certas para cada pessoa. Menos planilha,
            mais negócio fechado.
          </p>
          <ul className="mt-10 space-y-5 text-sm">
            <li className="flex gap-3">
              <BuildingIcon className="size-5 shrink-0 text-emerald-400" />
              <span>
                <strong className="font-medium text-white">Filiais e matriz</strong>
                <span className="block text-white/60">
                  Cada escritório com equipe, contato e endereço.
                </span>
              </span>
            </li>
            <li className="flex gap-3">
              <TeamIcon className="size-5 shrink-0 text-emerald-400" />
              <span>
                <strong className="font-medium text-white">Equipes e corretores</strong>
                <span className="block text-white/60">Quem atende onde, sempre atualizado.</span>
              </span>
            </li>
            <li className="flex gap-3">
              <ShieldIcon className="size-5 shrink-0 text-emerald-400" />
              <span>
                <strong className="font-medium text-white">Dados isolados por imobiliária</strong>
                <span className="block text-white/60">
                  Segurança no banco de dados, não só na tela.
                </span>
              </span>
            </li>
          </ul>
        </div>

        <p className="relative text-xs text-white/40">© Imobi Flow GO</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <LogoMark className="size-7" />
            <span className="font-semibold tracking-tight">Imobi Flow GO</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
