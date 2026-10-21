import { parseConversationId } from "@features/chat/navigation";
import { getSessionStage } from "../auth-context";

jest.mock("@core/query", () => ({ client: {} }));

describe("getSessionStage", () => {
  const signedIn = { authStatus: "authenticated" as const, profileFlowStage: "unknown" as const };

  it("is signed-out without a session", () => {
    expect(
      getSessionStage({ authStatus: "unauthenticated", profileStatus: "complete", profileFlowStage: "unknown" }),
    ).toBe("signed-out");
  });

  it("stays in profile setup until the profile is complete", () => {
    expect(getSessionStage({ ...signedIn, profileStatus: "incomplete" })).toBe("profile-setup");
  });

  it("stays in profile setup for the photo step even once the server says complete", () => {
    expect(
      getSessionStage({ ...signedIn, profileStatus: "complete", profileFlowStage: "image" }),
    ).toBe("profile-setup");
  });

  it("enters the app when setup is done", () => {
    expect(getSessionStage({ ...signedIn, profileStatus: "complete" })).toBe("app");
  });
});

describe("parseConversationId", () => {
  it.each(["0b8f6c2e-7c1a-4c55-9a0e-2f8d1c3b4a5e", "7D444840-9DC0-41D1-B245-5FFDCE74FAD2"])("accepts %s", (id) => {
    expect(parseConversationId(id)).toBe(id);
  });

  it.each([undefined, "", "abc123", "../etc", "a b", "%E0%A4%A", `${"0".repeat(36)}`])("rejects %p", (id) => {
    expect(parseConversationId(id)).toBeUndefined();
  });

  it("takes the first value of a repeated param", () => {
    expect(parseConversationId(["0b8f6c2e-7c1a-4c55-9a0e-2f8d1c3b4a5e", "7d444840-9dc0-41d1-b245-5ffdce74fad2"])).toBe("0b8f6c2e-7c1a-4c55-9a0e-2f8d1c3b4a5e");
  });
});
