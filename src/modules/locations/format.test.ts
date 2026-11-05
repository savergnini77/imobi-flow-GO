import { describe, expect, it } from "vitest";

import {
  formatAddress,
  formatCep,
  formatPhone,
  mapsUrl,
  maskCep,
  maskPhone,
  whatsappUrl,
} from "./format";
import type { Location } from "./types";

const base: Location = {
  id: "1",
  companyId: "c",
  name: "Moema",
  code: null,
  phone: null,
  whatsapp: null,
  email: null,
  cep: "04077020",
  street: "Av. Ibirapuera",
  number: "2000",
  complement: "Sala 5",
  neighborhood: "Moema",
  city: "São Paulo",
  state: "SP",
  isHeadquarters: false,
  isActive: true,
  createdAt: "",
  updatedAt: "",
};

describe("telefone e CEP", () => {
  it("formata celular, fixo e CEP", () => {
    expect(formatPhone("11987654321")).toBe("(11) 98765-4321");
    expect(formatPhone("1133334444")).toBe("(11) 3333-4444");
    expect(formatPhone(null)).toBe("");
    expect(formatCep("04077020")).toBe("04077-020");
  });

  it("aplica máscara progressiva enquanto digita", () => {
    expect(maskPhone("1")).toBe("(1");
    expect(maskPhone("119876")).toBe("(11) 9876");
    expect(maskPhone("11987654321999")).toBe("(11) 98765-4321");
    expect(maskCep("040770")).toBe("04077-0");
    expect(maskCep("abc")).toBe("");
  });
});

describe("endereço e links", () => {
  it("monta o endereço em uma linha", () => {
    expect(formatAddress(base)).toBe("Av. Ibirapuera, 2000 Sala 5 - Moema, São Paulo / SP");
  });

  it("não gera link de mapa sem endereço", () => {
    const empty = {
      ...base,
      cep: null,
      street: null,
      number: null,
      complement: null,
      neighborhood: null,
      city: null,
      state: null,
    };
    expect(mapsUrl(empty)).toBeNull();
    expect(mapsUrl(base)).toContain("https://www.google.com/maps/search/?api=1&query=");
  });

  it("gera link do WhatsApp com DDI do Brasil", () => {
    expect(whatsappUrl("11987654321")).toBe("https://wa.me/5511987654321");
    expect(whatsappUrl(null)).toBeNull();
  });
});
