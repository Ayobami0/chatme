import { ConversationModel, MessageModel } from "@shared/types/models";
import { reconcileMessages, withLatestMessage } from "../reconcile-messages";

const msg = (overrides: Partial<MessageModel>): MessageModel => ({
  id: "m1",
  conversationId: "c1",
  clientMessageId: "client-1",
  senderId: "u1",
  kind: "text",
  text: "hi",
  createdAt: "2026-01-01T00:00:01.000Z",
  ...overrides,
});

describe("reconcileMessages", () => {
  it("replaces a local message with the server copy sharing its clientMessageId", () => {
    const local = msg({ id: "client-1", text: "hi" });
    const server = msg({ id: "srv-1", text: "hi", version: 1 });

    expect(reconcileMessages([local], [server])).toEqual([{ ...local, ...server }]);
  });

  it("does not duplicate a send whose socket echo arrives after the HTTP response", () => {
    const server = msg({ id: "srv-1" });
    const afterHttp = reconcileMessages([], [server]);
    expect(reconcileMessages(afterHttp, [msg({ id: "srv-1" })])).toHaveLength(1);
  });

  it("keeps socket messages that are missing from a fetched page, sorted oldest first", () => {
    const fromSocket = msg({ id: "m3", clientMessageId: "c3", createdAt: "2026-01-01T00:00:03.000Z" });
    const page = [
      msg({ id: "m2", clientMessageId: "c2", createdAt: "2026-01-01T00:00:02.000Z" }),
      msg({ id: "m1", clientMessageId: "c1", createdAt: "2026-01-01T00:00:01.000Z" }),
    ];

    expect(reconcileMessages([fromSocket], page).map((m) => m.id)).toEqual(["m1", "m2", "m3"]);
  });

  it("accepts an empty page without dropping anything", () => {
    const existing = [msg({})];
    expect(reconcileMessages(existing, [])).toEqual(existing);
  });
});

describe("withLatestMessage", () => {
  const conversation = {
    id: "c1",
    type: "direct",
    latestMessage: {
      id: "m2",
      senderId: "u1",
      kind: "text",
      preview: "newer",
      createdAt: "2026-01-01T00:00:05.000Z",
    },
  } as ConversationModel;

  it("ignores a message older than the current preview", () => {
    const [result] = withLatestMessage([conversation], msg({}))!;
    expect(result.latestMessage?.id).toBe("m2");
  });

  it("previews attachment-only messages", () => {
    const [result] = withLatestMessage(
      [conversation],
      msg({ id: "m9", text: null, attachments: [{} as never], createdAt: "2026-01-01T00:00:09.000Z" }),
    )!;
    expect(result.latestMessage?.preview).toBe("Attachment");
  });
});
