import { describe, expect, it } from "vitest";

import { companySettingsSchema, createCompanySchema } from "./schema";

describe("createCompanySchema", () => {
  it("apara o nome", () => {
    expect(createCompanySchema.parse({ name: "  Prime Imóveis " }).name).toBe("Prime Imóveis");
  });

  it("recusa nome curto", () => {
    expect(createCompanySchema.safeParse({ name: "x" }).success).toBe(false);
  });
});

describe("companySettingsSchema", () => {
  it("normaliza documento, telefones, e-mail e site", () => {
    const data = companySettingsSchema.parse({
      name: "Prime Imóveis",
      document: "12.345.678/0001-90",
      phone: "(11) 3333-4444",
      whatsapp: "(11) 98765-4321",
      website: "primeimoveis.com.br",
      email: "Contato@Prime.com.br",
      creci: "",
    });
    expect(data).toMatchObject({
      document: "12345678000190",
      phone: "1133334444",
      whatsapp: "11987654321",
      website: "https://primeimoveis.com.br",
      email: "contato@prime.com.br",
      creci: null,
    });
  });

  it("recusa documento com tamanho inválido", () => {
    expect(companySettingsSchema.safeParse({ name: "Prime", document: "123" }).success).toBe(false);
  });

  it("recusa telefone sem DDD", () => {
    expect(companySettingsSchema.safeParse({ name: "Prime", phone: "98765-4321" }).success).toBe(
      false,
    );
  });
});
