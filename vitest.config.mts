import { defineConfig } from "vitest/config";

// Configuração mínima da suíte de testes.
// Por enquanto só testamos funções puras (schemas Zod, mapeamento de erros),
// então o ambiente é "node". Testes de componentes React (jsdom,
// @testing-library) serão adicionados quando houver telas.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
