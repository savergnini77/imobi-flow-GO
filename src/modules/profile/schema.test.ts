import { describe, expect, it } from "vitest";

import { profileSchema } from "./schema";

describe("profileSchema", () => {
  it("normaliza telefone e cargo vazio", () => {
    expect(
      profileSchema.parse({ fullName: " Ana Lima ", phone: "(21) 99876-5432", jobTitle: "" }),
    ).toEqual({ fullName: "Ana Lima", phone: "21998765432", jobTitle: null });
  });

  it("exige nome", () => {
    expect(profileSchema.safeParse({ fullName: "" }).success).toBe(false);
  });
});
