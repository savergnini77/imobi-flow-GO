import Link from "next/link";

import { LogoMark } from "@/components/shared/icons";

export function SiteFooter() {
  return (
    <footer className="border-border bg-surface border-t">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-7" />
            <span className="font-semibold tracking-tight">Imobi Flow GO</span>
          </div>
          <p className="text-muted-foreground mt-3 max-w-xs text-sm">
            CRM para imobiliárias e corretores. Feito no Brasil, com dados protegidos pela LGPD.
          </p>
        </div>

        <nav aria-label="Produto">
          <p className="text-sm font-semibold">Produto</p>
          <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
            <li>
              <Link href="/#recursos" className="hover:text-foreground">
                Recursos
              </Link>
            </li>
            <li>
              <Link href="/#precos" className="hover:text-foreground">
                Preços
              </Link>
            </li>
            <li>
              <Link href="/cadastrar" className="hover:text-foreground">
                Teste grátis
              </Link>
            </li>
            <li>
              <Link href="/entrar" className="hover:text-foreground">
                Entrar
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Legal">
          <p className="text-sm font-semibold">Legal</p>
          <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
            <li>
              <Link href="/termos" className="hover:text-foreground">
                Termos de uso
              </Link>
            </li>
            <li>
              <Link href="/privacidade" className="hover:text-foreground">
                Política de privacidade
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <p className="border-border text-muted-foreground border-t py-5 text-center text-xs">
        © {new Date().getFullYear()} Imobi Flow GO. Todos os direitos reservados.
      </p>
    </footer>
  );
}
