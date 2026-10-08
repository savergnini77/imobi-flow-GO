import { describe, expect, it } from "vitest";
import { z } from "zod";

import { failFields, failForm, mapSupabaseAuthError, succeed, zodToFieldErrors } from "./errors";
import { signUpSchema } from "./schema";

describe("helpers de resultado", () => {
  it("succeed embrulha os dados", () => {
    expect(succeed({ needsEmailConfirmation: true })).toEqual({
      ok: true,
      data: { needsEmailConfirmation: true },
    });
  });

  it("failForm devolve erro geral", () => {
    expect(failForm("deu ruim")).toEqual({ ok: false, formError: "deu ruim" });
  });

  it("failFields devolve erros por campo", () => {
    expect(failFields({ email: ["inválido"] })).toEqual({
      ok: false,
      fieldErrors: { email: ["inválido"] },
    });
  });
});

describe("zodToFieldErrors", () => {
  it("agrupa mensagens pelo caminho do campo", () => {
    const result = signUpSchema.safeParse({ email: "x", password: "123" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = zodToFieldErrors(result.error);
      expect(Object.keys(fieldErrors).sort()).toEqual(["email", "password"]);
      expect(fieldErrors.email.length).toBeGreaterThan(0);
      expect(fieldErrors.password.length).toBeGreaterThan(0);
    }
  });

  it("usa a chave _form quando o erro não tem caminho", () => {
    const schema = z.object({ a: z.string() }).refine(() => false, { message: "regra global" });
    const result = schema.safeParse({ a: "ok" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = zodToFieldErrors(result.error);
      expect(fieldErrors._form).toEqual(["regra global"]);
    }
  });
});

describe("mapSupabaseAuthError", () => {
  it("traduz códigos conhecidos", () => {
    expect(mapSupabaseAuthError({ code: "invalid_credentials" })).toBe(
      "E-mail ou senha incorretos.",
    );
    expect(mapSupabaseAuthError({ code: "email_not_confirmed" })).toContain("Confirme seu e-mail");
    expect(mapSupabaseAuthError({ code: "weak_password" })).toContain("fraca");
  });

  it("usa mensagem genérica para código desconhecido e não vaza a mensagem crua", () => {
    const raw = "internal: user 4f3a not found in shard 7";
    const message = mapSupabaseAuthError({ code: "algo_desconhecido", message: raw });
    expect(message).not.toContain(raw);
    expect(message).toBe("Não foi possível concluir a ação. Tente novamente em instantes.");
  });

  it("trata status 429 como excesso de tentativas", () => {
    expect(mapSupabaseAuthError({ status: 429 })).toContain("Muitas tentativas");
  });

  it("retorna mensagem genérica para null/undefined", () => {
    expect(mapSupabaseAuthError(null)).toBe(
      "Não foi possível concluir a ação. Tente novamente em instantes.",
    );
    expect(mapSupabaseAuthError(undefined)).toBe(
      "Não foi possível concluir a ação. Tente novamente em instantes.",
    );
  });
});
