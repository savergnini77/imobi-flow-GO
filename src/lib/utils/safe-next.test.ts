import { describe, expect, it } from "vitest";

import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it("aceita caminhos internos", () => {
    expect(safeNext("/settings/locations?x=1")).toBe("/settings/locations?x=1");
  });

  it.each([null, undefined, "", "https://evil.com", "//evil.com", "/\\evil.com", "dashboard"])(
    "recusa %s",
    (value) => {
      expect(safeNext(value)).toBe("/dashboard");
    },
  );

  it("usa o fallback informado", () => {
    expect(safeNext(null, "/onboarding")).toBe("/onboarding");
  });
});
