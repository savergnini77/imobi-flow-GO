import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Configuração mínima da suíte de testes.
// Por enquanto só testamos funções puras (schemas Zod, mapeamento de erros),
// então o ambiente é "node". Testes de componentes React (jsdom,
// @testing-library) serão adicionados quando necessário.
export default defineConfig({
  resolve: {
    // Mesmo alias do tsconfig.json ("@/*" -> "src/*").
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
