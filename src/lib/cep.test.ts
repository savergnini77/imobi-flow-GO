import { describe, expect, it, vi } from "vitest";

import { lookupCepAddress, parseViaCep } from "./cep";

const viaCepBody = {
  cep: "04077-020",
  logradouro: "Avenida Ibirapuera",
  bairro: "Moema",
  localidade: "São Paulo",
  uf: "sp",
};

function fakeFetch(body: unknown, ok = true) {
  return vi.fn(async () => ({ ok, json: async () => body }) as Response);
}

describe("parseViaCep", () => {
  it("converte a resposta do ViaCEP", () => {
    expect(parseViaCep(viaCepBody)).toEqual({
      cep: "04077020",
      street: "Avenida Ibirapuera",
      neighborhood: "Moema",
      city: "São Paulo",
      state: "SP",
    });
  });

  it("retorna null para CEP inexistente", () => {
    expect(parseViaCep({ erro: true })).toBeNull();
    expect(parseViaCep({ erro: "true" })).toBeNull();
  });
});

describe("lookupCepAddress", () => {
  it("não chama a API com CEP inválido", async () => {
    const fetchImpl = fakeFetch(viaCepBody);
    expect(await lookupCepAddress("123", fetchImpl)).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("consulta só com os dígitos e devolve o endereço", async () => {
    const fetchImpl = fakeFetch(viaCepBody);
    const address = await lookupCepAddress("04077-020", fetchImpl);
    expect(address?.city).toBe("São Paulo");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://viacep.com.br/ws/04077020/json/",
      expect.any(Object),
    );
  });

  it("falha em silêncio (HTTP de erro ou exceção)", async () => {
    expect(await lookupCepAddress("04077020", fakeFetch({}, false))).toBeNull();
    const throwing = vi.fn(async () => {
      throw new Error("offline");
    });
    expect(await lookupCepAddress("04077020", throwing)).toBeNull();
  });
});
