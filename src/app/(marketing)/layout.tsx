import type { ReactNode } from "react";

import { SiteFooter } from "./_components/site-footer";
import { SiteHeader } from "./_components/site-header";

// Páginas públicas de marketing: estáticas, sem consulta ao banco nem à sessão.
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#conteudo"
        className="focus:bg-surface sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:px-3 focus:py-2"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader />
      <main id="conteudo" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
