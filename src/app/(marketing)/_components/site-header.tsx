import Link from "next/link";

import { LogoMark } from "@/components/shared/icons";
import { ButtonLink } from "@/components/ui/button";

import { MobileNav } from "./mobile-nav";
import { MARKETING_NAV } from "./nav";

export function SiteHeader() {
  return (
    <header className="border-border/70 bg-background/85 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link
          href="/"
          className="focus-visible:outline-ring flex items-center gap-2.5 rounded-md focus-visible:outline-2"
        >
          <LogoMark className="size-7" />
          <span className="font-semibold tracking-tight">Imobi Flow GO</span>
        </Link>

        <nav aria-label="Principal" className="hidden flex-1 md:block">
          <ul className="text-muted-foreground flex items-center justify-center gap-7 text-sm">
            {MARKETING_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <ButtonLink href="/entrar" variant="ghost" size="sm">
            Entrar
          </ButtonLink>
          <ButtonLink href="/cadastrar" size="sm">
            Teste grátis
          </ButtonLink>
        </div>

        <MobileNav />
      </div>
    </header>
  );
}
