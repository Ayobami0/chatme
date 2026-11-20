jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("@services/conversation", () => ({
  ConversationService: { sendMessage: jest.fn() },
}));
jest.mock("@services/media", () => ({
  MediaService: { uploadMedia: jest.fn(), forgetUpload: jest.fn() },
  UploadExpiredError: class UploadExpiredError extends Error {},
}));
jest.mock("@services/storage", () => ({
  __esModule: true,
  default: { secureSave: jest.fn(), secureGet: jest.fn(), secureRemove: jest.fn() },
  StorageKey: { AuthToken: "authToken" },
}));

import { QueryClient } from "@tanstack/react-query";
import { ConversationService } from "@services/conversation";
import { MediaService } from "@services/media";
import { queryKeys } from "@core/query/keys";
import { MessageWindow } from "../../utils/reconcile-messages";
import { OutboxEntry, useOutboxStore } from "../../store/outbox";
import { deliverOutboxEntry, flushInterruptedSends } from "../deliver";
import { TokenManager } from "@services/token-manager";
import { UploadExpiredError } from "@services/media";

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
      deliverOutboxEntry(queryClient, "client-1", "me"),
      deliverOutboxEntry(queryClient, "client-1", "me"),
    ]);

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(useOutboxStore.getState().entries).toEqual({});
    const window = queryClient.getQueryData<MessageWindow>(queryKeys.messages("c1"));
    expect(window?.items.map((m) => m.id)).toEqual(["srv-1"]);
  });

  it("keeps failed text recoverable and retries with the same clientMessageId", async () => {
    sendMessage.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(serverCopy);
    useOutboxStore.getState().put(entry());

    await deliverOutboxEntry(queryClient, "client-1", "me");
    expect(useOutboxStore.getState().entries["client-1"]).toMatchObject({
      status: "failed",
      text: "hello",
    });

    await deliverOutboxEntry(queryClient, "client-1", "me");
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

    await deliverOutboxEntry(queryClient, "client-1", "me");
    await deliverOutboxEntry(queryClient, "client-1", "me");

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

    flushInterruptedSends(queryClient, "c1", "me");
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage.mock.calls[0][1].clientMessageId).toBe("interrupted");
  });

  it("does not deliver another account's entry", async () => {
    useOutboxStore.getState().put(entry({ senderId: "someone-else" }));

    await deliverOutboxEntry(queryClient, "client-1", "me");

    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("retries an expired upload once with a fresh upload id", async () => {
    uploadMedia.mockRejectedValueOnce(new UploadExpiredError()).mockResolvedValueOnce({ id: "media-2" });
    sendMessage.mockResolvedValue(serverCopy);
    useOutboxStore.getState().put(
      entry({
        kind: "image",
        attachments: [
          { type: "image", localUri: "file://a.jpg", sizeBytes: 10, fileName: "a.jpg", contentType: "image/jpeg", clientUploadId: "upload-1" },
        ],
      }),
    );

    await deliverOutboxEntry(queryClient, "client-1", "me");

    const [first, second] = uploadMedia.mock.calls.map(([input]) => input.clientUploadId);
    expect(first).toBe("upload-1");
    expect(second).not.toBe("upload-1");
    expect(sendMessage.mock.calls[0][1].attachmentMediaIds).toEqual(["media-2"]);
  });
});

describe("outbox delivery across sessions", () => {
  let queryClient: QueryClient;
  const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((r) => (resolve = r));
    return { promise, resolve };
  };
  const signIn = (name: string) =>
    TokenManager.setTokens({ accessToken: `${name}-access`, refreshToken: `${name}-refresh` });
  const cachedIds = () =>
    queryClient.getQueryData<MessageWindow>(queryKeys.messages("c1"))?.items.map((m) => m.id);

  beforeEach(async () => {
    jest.clearAllMocks();
    useOutboxStore.getState().clear();
    queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
    queryClient.setQueryData<MessageWindow>(queryKeys.messages("c1"), { items: [], olderCursor: null });
    await signIn("A");
  });

  it("stops A's paused upload before sending once B has signed in", async () => {
    const upload = deferred<{ id: string }>();
    uploadMedia.mockReturnValue(upload.promise);
    useOutboxStore.getState().put(
      entry({
        senderId: "A",
        kind: "image",
        attachments: [
          { type: "image", localUri: "file://a.jpg", sizeBytes: 10, fileName: "a.jpg", contentType: "image/jpeg", clientUploadId: "upload-1" },
        ],
      }),
    );

    const delivering = deliverOutboxEntry(queryClient, "client-1", "A");
    await Promise.resolve();
    const before = JSON.stringify(useOutboxStore.getState().entries);

    await signIn("B");
    upload.resolve({ id: "media-1" });
    await delivering;

    // The upload was pinned to A's session, and nothing continued after it.
    expect(uploadMedia.mock.calls[0][1].session.isCurrent()).toBe(false);
    expect(sendMessage).not.toHaveBeenCalled();
    expect(JSON.stringify(useOutboxStore.getState().entries)).toBe(before);
    expect(cachedIds()).toEqual([]);
  });

  it("pins the send to its session and drops a result that lands after re-login", async () => {
    const send = deferred<typeof serverCopy>();
    sendMessage.mockReturnValue(send.promise);
    useOutboxStore.getState().put(entry({ senderId: "A" }));

    const delivering = deliverOutboxEntry(queryClient, "client-1", "A");
    await Promise.resolve();
    const pinned = sendMessage.mock.calls[0][2].sessionGeneration;

    await signIn("A"); // logout followed by login to the same account
    send.resolve(serverCopy);
    await delivering;

    expect(TokenManager.isCurrentSession(pinned)).toBe(false);
    expect(cachedIds()).toEqual([]);
    expect(useOutboxStore.getState().entries["client-1"]?.status).toBe("pending");
  });
});
