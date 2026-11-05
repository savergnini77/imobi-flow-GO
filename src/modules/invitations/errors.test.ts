import { describe, expect, it } from "vitest";

import { mapInvitationError } from "./errors";

describe("mapInvitationError", () => {
  it("e-mail diferente", () => {
    expect(mapInvitationError({ code: "42501" })).toMatch(/outro e-mail/);
  });

  it("convite expirado", () => {
    expect(mapInvitationError({ code: "P0001", message: "este convite expirou" })).toMatch(
      /expirou/,
    );
  });

  it("convite já utilizado", () => {
    expect(mapInvitationError({ code: "P0001", message: "este convite já foi utilizado" })).toMatch(
      /já foi utilizado/,
    );
  });

  it("token inválido", () => {
    expect(mapInvitationError({ code: "P0002" })).toMatch(/inválido/);
  });

  it("nunca repassa mensagem crua", () => {
    expect(mapInvitationError({ code: "XX000", message: "segredo interno" })).not.toMatch(
      /segredo/,
    );
  });
});
