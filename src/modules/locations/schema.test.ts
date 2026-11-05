import { describe, expect, it } from "vitest";

import { locationFiltersSchema, locationInputSchema } from "./schema";

const valid = { name: "  Filial Moema  " };

describe("locationInputSchema", () => {
  it("apara o nome e transforma opcionais vazios em null", () => {
    const result = locationInputSchema.safeParse({
      ...valid,
      code: "",
      phone: "",
      email: "  ",
      cep: "",
      street: "   ",
      state: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Filial Moema");
      expect(result.data.code).toBeNull();
      expect(result.data.phone).toBeNull();
      expect(result.data.email).toBeNull();
      expect(result.data.cep).toBeNull();
      expect(result.data.street).toBeNull();
      expect(result.data.state).toBeNull();
    }
  });

  it("normaliza CEP, telefones, código, UF e e-mail", () => {
    const result = locationInputSchema.safeParse({
      ...valid,
      cep: "04077-020",
      phone: "(11) 3333-4444",
      whatsapp: "(11) 98765-4321",
      code: " sp-01 ",
      state: "sp",
      email: " Moema@Imob.COM ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cep).toBe("04077020");
      expect(result.data.phone).toBe("1133334444");
      expect(result.data.whatsapp).toBe("11987654321");
      expect(result.data.code).toBe("SP-01");
      expect(result.data.state).toBe("SP");
      expect(result.data.email).toBe("moema@imob.com");
    }
  });

  it.each([
    ["name", { name: "A" }],
    ["cep", { ...valid, cep: "1234" }],
    ["phone", { ...valid, phone: "3333-4444" }],
    ["state", { ...valid, state: "XX" }],
    ["email", { ...valid, email: "sem-arroba" }],
    ["code", { ...valid, code: "CÓDIGO MUITO LONGO" }],
  ])("rejeita %s inválido no campo certo", (field, input) => {
    const result = locationInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.join(".") === field)).toBe(true);
    }
  });

  it("descarta chaves desconhecidas (ex.: is_headquarters)", () => {
    const result = locationInputSchema.safeParse({ ...valid, is_headquarters: true });
    expect(result.success).toBe(true);
    if (result.success) expect("is_headquarters" in result.data).toBe(false);
  });
});

describe("locationFiltersSchema", () => {
  it("usa 'all' quando o status é ausente ou inválido", () => {
    expect(locationFiltersSchema.parse({}).status).toBe("all");
    expect(locationFiltersSchema.parse({ status: "xpto" }).status).toBe("all");
  });

  it("ignora busca vazia ou em formato inesperado", () => {
    expect(locationFiltersSchema.parse({ q: "   " }).q).toBeUndefined();
    expect(locationFiltersSchema.parse({ q: ["a", "b"] }).q).toBeUndefined();
    expect(locationFiltersSchema.parse({ q: " moema " }).q).toBe("moema");
  });
});
