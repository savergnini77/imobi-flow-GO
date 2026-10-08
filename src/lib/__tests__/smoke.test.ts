import { describe, expect, it } from "vitest";

// Teste smoke: prova apenas que a suíte de testes está configurada e roda.
describe("suíte de testes", () => {
  it("executa", () => {
    expect(1 + 1).toBe(2);
  });
});
