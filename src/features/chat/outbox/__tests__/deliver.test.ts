jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("@services/conversation", () => ({
  ConversationService: { sendMessage: jest.fn() },
}));
jest.mock("@services/media", () => ({
  MediaService: { uploadMedia: jest.fn() },
}));

import { QueryClient } from "@tanstack/react-query";
import { ConversationService } from "@services/conversation";
import { MediaService } from "@services/media";
import { queryKeys } from "@core/query/keys";
import { MessageWindow } from "../../utils/reconcile-messages";
import { OutboxEntry, useOutboxStore } from "../../store/outbox";
import { deliverOutboxEntry, flushInterruptedSends } from "../deliver";

const sendMessage = ConversationService.sendMessage as jest.Mock;
const uploadMedia = MediaService.uploadMedia as jest.Mock;

const entry = (overrides: Partial<OutboxEntry> = {}): OutboxEntry => ({
  clientMessageId: "client-1",
  conversationId: "c1",
  senderId: "me",
  kind: "text",
  text: "hello",
  attachments: [],
  createdAt: "2026-01-01T00:00:00Z",
  status: "pending",
  ...overrides,
});

const serverCopy = { ...entry(), id: "srv-1", attachments: undefined };

describe("outbox delivery", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    useOutboxStore.getState().clear();
    queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
    queryClient.setQueryData<MessageWindow>(queryKeys.messages("c1"), { items: [], olderCursor: null });
  });

  it("sends a double-tapped message once", async () => {
    sendMessage.mockResolvedValue(serverCopy);
    useOutboxStore.getState().put(entry());

    await Promise.all([
      deliverOutboxEntry(queryClient, "client-1"),
      deliverOutboxEntry(queryClient, "client-1"),
    ]);

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(useOutboxStore.getState().entries).toEqual({});
    const window = queryClient.getQueryData<MessageWindow>(queryKeys.messages("c1"));
    expect(window?.items.map((m) => m.id)).toEqual(["srv-1"]);
  });

  it("keeps failed text recoverable and retries with the same clientMessageId", async () => {
    sendMessage.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(serverCopy);
    useOutboxStore.getState().put(entry());

    await deliverOutboxEntry(queryClient, "client-1");
    expect(useOutboxStore.getState().entries["client-1"]).toMatchObject({
      status: "failed",
      text: "hello",
    });

    await deliverOutboxEntry(queryClient, "client-1");
    expect(sendMessage.mock.calls.map(([, body]) => body.clientMessageId)).toEqual([
      "client-1",
      "client-1",
    ]);
    expect(useOutboxStore.getState().entries).toEqual({});
  });

  it("does not re-upload an attachment when retrying", async () => {
    uploadMedia.mockResolvedValue({ id: "media-1" });
    sendMessage.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(serverCopy);
    useOutboxStore.getState().put(
      entry({
        kind: "image",
        attachments: [
          { type: "image", localUri: "file://a.jpg", sizeBytes: 10, fileName: "a.jpg", contentType: "image/jpeg", clientUploadId: "upload-1" },
        ],
      }),
    );

    await deliverOutboxEntry(queryClient, "client-1");
    await deliverOutboxEntry(queryClient, "client-1");

    expect(uploadMedia).toHaveBeenCalledTimes(1);
    expect(uploadMedia.mock.calls[0][0]).toMatchObject({
      clientUploadId: "upload-1",
      sizeBytes: 10,
      contentType: "image/jpeg",
    });
    expect(sendMessage.mock.calls[1][1].attachmentMediaIds).toEqual(["media-1"]);
  });

  it("resumes sends interrupted by a restart, but leaves failed ones for the user", async () => {
    sendMessage.mockResolvedValue(serverCopy);
    useOutboxStore.getState().put(entry({ clientMessageId: "interrupted", status: "pending" }));
    useOutboxStore.getState().put(entry({ clientMessageId: "failed", status: "failed" }));

    flushInterruptedSends(queryClient, "c1");
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage.mock.calls[0][1].clientMessageId).toBe("interrupted");
  });
});
