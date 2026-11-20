import { canSendMessage, MAX_MESSAGE_LENGTH } from "@features/chat/utils/can-send-message";

describe("canSendMessage", () => {
  it("rejects an empty draft", () => {
    expect(canSendMessage({ text: "" })).toBe(false);
  });

  it.each([" ", "   ", "\n", "\t \n "])("rejects whitespace-only text %p", (text) => {
    expect(canSendMessage({ text })).toBe(false);
  });

  it("accepts text with content", () => {
    expect(canSendMessage({ text: "hello" })).toBe(true);
    expect(canSendMessage({ text: "  hello  " })).toBe(true);
  });

  it("accepts an attachment without text", () => {
    expect(canSendMessage({ text: "", attachmentCount: 1 })).toBe(true);
  });

  it("accepts text at the API limit and rejects text over it", () => {
    expect(canSendMessage({ text: "a".repeat(MAX_MESSAGE_LENGTH) })).toBe(true);
    expect(canSendMessage({ text: "a".repeat(MAX_MESSAGE_LENGTH + 1) })).toBe(false);
  });
});
