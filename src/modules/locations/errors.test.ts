import { describe, expect, it } from "vitest";

import { GENERIC_LOCATION_ERROR, mapLocationDbError } from "./errors";
import { toIlikeFilterValue } from "./search";

describe("mapLocationDbError", () => {
  it("traduz os códigos próprios da migração 0005", () => {
    expect(mapLocationDbError({ code: "LC001" }).message).toContain("matriz");
    expect(mapLocationDbError({ code: "LC002" }).message).toContain("vinculados");
    expect(mapLocationDbError({ code: "LC003" }).message).toContain("Reative");
  });

  it("aponta o campo certo em violação de unicidade", () => {
    expect(
      mapLocationDbError({ code: "23505", message: 'violates "locations_company_code_uq"' }),
    ).toEqual({ field: "code", message: "Já existe uma filial com este código." });
    expect(mapLocationDbError({ code: "23505", message: "locations_company_name_uq" }).field).toBe(
      "name",
    );
  });

  it("nunca repassa a mensagem crua do banco", () => {
    const raw = "internal: relation public.locations shard 3";
    const mapped = mapLocationDbError({ code: "XX000", message: raw });
    expect(mapped.message).toBe(GENERIC_LOCATION_ERROR);
    expect(mapLocationDbError(null).message).toBe(GENERIC_LOCATION_ERROR);
  });
});

describe("toIlikeFilterValue", () => {
  it("envolve em aspas e escapa curingas, aspas e barras", () => {
    expect(toIlikeFilterValue("moema")).toBe('"%moema%"');
    expect(toIlikeFilterValue("50%_off")).toBe('"%50\\\\%\\\\_off%"');
    expect(toIlikeFilterValue('a"b')).toBe('"%a\\"b%"');
  });

  it("mantém vírgula, ponto e parênteses dentro das aspas", () => {
    expect(toIlikeFilterValue("S.J. (Centro), SP")).toBe('"%S.J. (Centro), SP%"');
  });
});
