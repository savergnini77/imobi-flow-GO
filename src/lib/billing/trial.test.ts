import { describe, expect, it } from "vitest";

import { trialDaysLeft, trialLabel } from "./trial";

const now = new Date("2026-10-12T12:00:00Z");

describe("trialDaysLeft", () => {
  it("conta os dias arredondando para cima", () => {
    expect(
      trialDaysLeft({ subscriptionStatus: "trialing", trialEndsAt: "2026-10-26T11:00:00Z" }, now),
    ).toBe(14);
  });

  it("nunca fica negativo", () => {
    expect(
      trialDaysLeft({ subscriptionStatus: "trialing", trialEndsAt: "2026-10-01T00:00:00Z" }, now),
    ).toBe(0);
  });

  it("é null fora do trial", () => {
    expect(trialDaysLeft({ subscriptionStatus: "active", trialEndsAt: null }, now)).toBeNull();
  });
});

describe("trialLabel", () => {
  it.each([
    [0, "Seu teste grátis terminou"],
    [1, "Último dia do teste grátis"],
    [5, "5 dias restantes no teste grátis"],
  ])("%i dias", (days, label) => {
    expect(trialLabel(days)).toBe(label);
  });
});
