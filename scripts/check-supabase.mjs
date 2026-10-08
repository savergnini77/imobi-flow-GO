/**
 * Teste de conexão simples e seguro com o Supabase.
 *
 * O que faz:
 * - Confere se as variáveis públicas existem (cita apenas o NOME se faltar).
 * - Faz uma requisição ao endpoint público de saúde do Auth:
 *     GET <SUPABASE_URL>/auth/v1/health
 * - Imprime só o resultado (OK / FALHA). Nunca imprime a URL, a chave nem o
 *   corpo da resposta.
 *
 * O que NÃO faz:
 * - Não acessa tabelas, não cria nada, não usa chave secreta.
 *
 * Encerramento: usa `process.exitCode` e deixa o event loop drenar sozinho.
 * Nunca chama `process.exit()` — no Windows, encerrar à força enquanto os
 * handles do fetch/timer ainda estão fechando derruba o processo com uma
 * asserção do libuv (src\win\async.c).
 *
 * Uso: npm run check:supabase
 */

const REQUIRED_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];

function isMissing(value) {
  return value === undefined || value.trim() === "";
}

async function main() {
  const missing = REQUIRED_KEYS.filter((key) => isMissing(process.env[key]));
  if (missing.length > 0) {
    console.error(
      `FALHA: variáveis de ambiente ausentes: ${missing.join(", ")}. Preencha o .env.local.`,
    );
    process.exitCode = 1;
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL.trim().replace(/\/+$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim();

  const healthUrl = `${url}/auth/v1/health`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  timeout.unref();

  try {
    const res = await fetch(healthUrl, {
      method: "GET",
      headers: { apikey: anonKey },
      signal: controller.signal,
    });

    if (res.ok) {
      console.log(`OK: conexão com o Supabase Auth bem-sucedida (HTTP ${res.status}).`);
      return;
    }

    console.error(`FALHA: o Supabase respondeu com HTTP ${res.status}.`);
    process.exitCode = 1;
  } catch (error) {
    const reason = error?.name === "AbortError" ? "tempo esgotado (timeout)" : "erro de rede";
    console.error(`FALHA: não foi possível conectar ao Supabase (${reason}).`);
    process.exitCode = 1;
  } finally {
    clearTimeout(timeout);
  }
}

await main();
