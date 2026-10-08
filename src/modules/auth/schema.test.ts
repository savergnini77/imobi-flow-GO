import { describe, expect, it } from "vitest";

import {
  emailSchema,
  passwordSchema,
  requestPasswordResetSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "./schema";

describe("emailSchema", () => {
  it("apara e normaliza para minúsculas", () => {
    const result = emailSchema.safeParse("  Foo.Bar@Example.COM  ");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("foo.bar@example.com");
    }
  });

  it("rejeita string sem formato de e-mail", () => {
    expect(emailSchema.safeParse("foo.bar").success).toBe(false);
  });

  it("rejeita valor não-string com mensagem própria", () => {
    const result = emailSchema.safeParse(123);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Informe o e-mail.");
    }
  });
});

describe("passwordSchema", () => {
  it("aceita exatamente 8 caracteres", () => {
    expect(passwordSchema.safeParse("12345678").success).toBe(true);
  });

  it("aceita exatamente 72 caracteres", () => {
    expect(passwordSchema.safeParse("a".repeat(72)).success).toBe(true);
  });

  it("rejeita 7 e 73 caracteres", () => {
    expect(passwordSchema.safeParse("1234567").success).toBe(false);
    expect(passwordSchema.safeParse("a".repeat(73)).success).toBe(false);
  });

  it("rejeita ausência de senha com mensagem própria", () => {
    const result = passwordSchema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Informe a senha.");
    }
  });
});

describe("signUpSchema", () => {
  it("aceita entrada válida e normaliza o e-mail (apara + minúsculas)", () => {
    const result = signUpSchema.safeParse({
      email: "  Joao@Exemplo.COM  ",
      password: "senhaforte1",
      fullName: "  João da Silva  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("joao@exemplo.com");
      expect(result.data.fullName).toBe("João da Silva");
    }
  });

  it("transforma fullName vazio em undefined", () => {
    const result = signUpSchema.safeParse({
      email: "a@b.com",
      password: "12345678",
      fullName: "   ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fullName).toBeUndefined();
    }
  });

  it("rejeita e-mail inválido no campo email", () => {
    const result = signUpSchema.safeParse({ email: "sem-arroba", password: "12345678" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.join(".") === "email")).toBe(true);
    }
  });

  it("rejeita senha com menos de 8 caracteres no campo password", () => {
    const result = signUpSchema.safeParse({ email: "a@b.com", password: "1234567" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.join(".") === "password")).toBe(true);
    }
  });

  it("rejeita senha com mais de 72 caracteres", () => {
    const result = signUpSchema.safeParse({ email: "a@b.com", password: "x".repeat(73) });
    expect(result.success).toBe(false);
  });

  it("rejeita fullName com mais de 120 caracteres", () => {
    const result = signUpSchema.safeParse({
      email: "a@b.com",
      password: "12345678",
      fullName: "n".repeat(121),
    });
    expect(result.success).toBe(false);
  });

  it("aceita fullName ausente (fica undefined)", () => {
    const result = signUpSchema.safeParse({ email: "a@b.com", password: "12345678" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fullName).toBeUndefined();
    }
  });

  it("descarta chaves desconhecidas", () => {
    const result = signUpSchema.safeParse({
      email: "a@b.com",
      password: "12345678",
      role: "owner",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect("role" in result.data).toBe(false);
    }
  });
});

describe("signInSchema", () => {
  it("aceita qualquer senha não vazia (não exige comprimento mínimo)", () => {
    const result = signInSchema.safeParse({ email: "a@b.com", password: "x" });
    expect(result.success).toBe(true);
  });

  it("rejeita senha vazia", () => {
    const result = signInSchema.safeParse({ email: "a@b.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("requestPasswordResetSchema", () => {
  it("normaliza o e-mail", () => {
    const result = requestPasswordResetSchema.safeParse({ email: "USER@Site.com" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@site.com");
    }
  });

  it("rejeita e-mail inválido", () => {
    expect(requestPasswordResetSchema.safeParse({ email: "x" }).success).toBe(false);
  });
});

describe("updatePasswordSchema", () => {
  it("aceita senhas iguais e válidas", () => {
    const result = updatePasswordSchema.safeParse({
      password: "novaSenha1",
      confirmPassword: "novaSenha1",
    });
    expect(result.success).toBe(true);
  });

  it("reporta divergência no campo confirmPassword", () => {
    const result = updatePasswordSchema.safeParse({
      password: "novaSenha1",
      confirmPassword: "outraCoisa2",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.join(".") === "confirmPassword");
      expect(issue?.message).toBe("As senhas não conferem.");
    }
  });

  it("reporta senha curta no campo password", () => {
    const result = updatePasswordSchema.safeParse({ password: "123", confirmPassword: "123" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.join(".") === "password")).toBe(true);
    }
  });

  it("exige confirmPassword", () => {
    const result = updatePasswordSchema.safeParse({ password: "novaSenha1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.join(".") === "confirmPassword")).toBe(true);
    }
  });
});
