// Consulta de endereço por CEP (ViaCEP), feita no servidor.
// Falha silenciosa: em qualquer erro retorna null e o formulário segue manual.

export type CepAddress = {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
};

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean | string;
};

export function parseViaCep(body: ViaCepResponse): CepAddress | null {
  if (!body || body.erro || !body.cep) return null;
  return {
    cep: body.cep.replace(/\D/g, ""),
    street: body.logradouro ?? "",
    neighborhood: body.bairro ?? "",
    city: body.localidade ?? "",
    state: (body.uf ?? "").toUpperCase(),
  };
}

export async function lookupCepAddress(
  rawCep: string,
  fetchImpl: typeof fetch = fetch,
): Promise<CepAddress | null> {
  const cep = rawCep.replace(/\D/g, "");
  if (!/^\d{8}$/.test(cep)) return null;

  try {
    const response = await fetchImpl(`https://viacep.com.br/ws/${cep}/json/`, {
      signal: AbortSignal.timeout(3000),
      // CEP muda muito raramente: pode ficar em cache por um dia.
      next: { revalidate: 86400 },
    } as RequestInit);
    if (!response.ok) return null;
    return parseViaCep((await response.json()) as ViaCepResponse);
  } catch {
    return null;
  }
}
