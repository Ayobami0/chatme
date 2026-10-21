jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import AsyncStorage from "@react-native-async-storage/async-storage";
import { queryKeys } from "@core/query/keys";
import { applyMessages } from "@features/chat/query/message-cache";
import { MessageModel } from "@shared/types/models";
import { dehydrate, QueryClient } from "@tanstack/react-query";
import {
  PersistedClient,
  Persister,
  persistQueryClientRestore,
} from "@tanstack/react-query-persist-client";
import { endSession } from "../end-session";

const message = (id: string, createdAt: string): MessageModel => ({
  id,
  conversationId: "c1",
  clientMessageId: `client-${id}`,
  senderId: "u2",
  kind: "text",
  text: id,
  createdAt,
});

const newClient = () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });

describe("cache ordering", () => {
  it("a slow disk restore does not erase a message received meanwhile", async () => {
    // Snapshot written to disk earlier, containing only an old message.
    const diskClient = newClient();
    diskClient.setQueryData(queryKeys.messages("c1"), [message("old", "2026-01-01T00:00:00Z")]);
    const snapshot: PersistedClient = {
      timestamp: Date.now(),
      buster: "v1",
      clientState: dehydrate(diskClient),
    };

    const queryClient = newClient();
    let finishRead!: () => void;
    const persister: Persister = {
      persistClient: async () => undefined,
      removeClient: async () => undefined,
      restoreClient: () => new Promise((resolve) => (finishRead = () => resolve(snapshot))),
    };

    const restoring = persistQueryClientRestore({ queryClient, persister, buster: "v1" });
    applyMessages(queryClient, "c1", [message("new", "2026-01-01T00:00:10Z")]);
    finishRead();
    await restoring;

    const ids = queryClient
      .getQueryData<MessageModel[]>(queryKeys.messages("c1"))
      ?.map((m) => m.id);
    expect(ids).toContain("new");
  });
});

describe("endSession", () => {
  beforeEach(() => AsyncStorage.clear());

  it("clears account A's memory and disk cache without touching account B", async () => {
    await AsyncStorage.multiSet([
      ["query_cache_userA", "{}"],
      ["query_cache_userB", "{}"],
      ["cache_conversations", "[]"],
      ["cache_messages_c1", "[]"],
      ["profileFlowStage", '"image"'],
    ]);

    const queryClient = newClient();
    queryClient.setQueryData(queryKeys.conversations, [{ id: "c1" }]);

    await endSession(queryClient, "userA");

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(await AsyncStorage.getAllKeys()).toEqual(["query_cache_userB"]);
  });

  it("discards a request that resolves after logout", async () => {
    const queryClient = newClient();
    let resolveFetch!: (value: unknown) => void;

    void queryClient
      .fetchQuery({
        queryKey: queryKeys.conversations,
        queryFn: () => new Promise((resolve) => (resolveFetch = resolve)),
      })
      .catch(() => undefined);

    await endSession(queryClient, "userA");
    resolveFetch([{ id: "account-A-chat" }]);
    await Promise.resolve();

    expect(queryClient.getQueryData(queryKeys.conversations)).toBeUndefined();
  });
});
