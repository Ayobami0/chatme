import { redact } from "@logging";

describe("redact", () => {
  it("masks credentials, codes and message text at any depth", () => {
    expect(
      redact({
        challengeId: "c1",
        code: "1234",
        tokens: { accessToken: "a", refreshToken: "r" },
        items: [{ id: "m1", text: "hello" }],
      }),
    ).toEqual({
      challengeId: "c1",
      code: "[REDACTED]",
      tokens: { accessToken: "[REDACTED]", refreshToken: "[REDACTED]" },
      items: [{ id: "m1", text: "[REDACTED]" }],
    });
  });

  it("passes primitives through", () => {
    expect(redact("x")).toBe("x");
    expect(redact(undefined)).toBeUndefined();
  });
});
