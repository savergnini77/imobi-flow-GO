"use client";

import Link from "next/link";
import { useState } from "react";

import { MenuIcon } from "@/components/shared/icons";
import { ButtonLink } from "@/components/ui/button";

import { MARKETING_NAV } from "./nav";

// Único JS de cliente da landing: abrir/fechar o menu no celular.
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="ml-auto md:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        className="hover:bg-muted focus-visible:outline-ring rounded-md p-2 focus-visible:outline-2"
      >
        <MenuIcon />
      </button>

      {open && (
        <div
          id="mobile-nav"
          className="border-border bg-background absolute inset-x-0 top-16 border-b px-4 pb-5 shadow-lg"
        >
          <ul className="flex flex-col py-2">
            {MARKETING_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="hover:bg-muted block rounded-md px-2 py-3 text-base"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-2 gap-2">
            <ButtonLink href="/entrar" variant="secondary">
              Entrar
            </ButtonLink>
            <ButtonLink href="/cadastrar">Teste grátis</ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}
