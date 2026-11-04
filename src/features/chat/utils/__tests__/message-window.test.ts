import { MessageModel } from "@shared/types/models";
import { mergeLatestPage, mergeOlderPage } from "../reconcile-messages";

const msg = (n: number): MessageModel => ({
  id: `m${n}`,
  clientMessageId: `c${n}`,
  conversationId: "conv",
  senderId: "u1",
  kind: "text",
  text: `${n}`,
  createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, n)).toISOString(),
});

// The API returns pages newest-first.
const page = (ids: number[], nextCursor: string | null) => ({
  items: ids.map(msg).reverse(),
  pageInfo: { nextCursor, hasNextPage: nextCursor !== null },
});

describe("message window", () => {
  it("keeps the older cursor when the latest page overlaps the cache", () => {
    const cached = { items: [3, 4, 5].map(msg), olderCursor: "before-3" };
    const merged = mergeLatestPage(cached, page([5, 6, 7], "before-5"));

    expect(merged.items.map((m) => m.id)).toEqual(["m3", "m4", "m5", "m6", "m7"]);
    expect(merged.olderCursor).toBe("before-3");
  });

  it("drops stale history when a reconnect reveals a gap", () => {
    const cached = { items: [1, 2].map(msg), olderCursor: null };
    const merged = mergeLatestPage(cached, page([50, 51], "before-50"));

    expect(merged.items.map((m) => m.id)).toEqual(["m50", "m51"]);
    expect(merged.olderCursor).toBe("before-50");
  });

  it("keeps cached messages when the latest page is the whole history", () => {
    const merged = mergeLatestPage({ items: [msg(1)], olderCursor: null }, page([], null));
    expect(merged.items).toHaveLength(1);
  });

  it("prepends older pages and advances the cursor", () => {
    const cached = { items: [5, 6].map(msg), olderCursor: "before-5" };
    const merged = mergeOlderPage(cached, page([3, 4], null));

    expect(merged.items.map((m) => m.id)).toEqual(["m3", "m4", "m5", "m6"]);
    expect(merged.olderCursor).toBeNull();
  });
});
