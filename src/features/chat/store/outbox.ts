import AsyncStorage from "@react-native-async-storage/async-storage";
import { MessageKind } from "@shared/types/models";
import { AllowedContentType } from "@shared/utils/file-types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type OutboxAttachment = {
  type: "audio" | "image" | "video" | "document";
  localUri: string;
  sizeBytes: number;
  fileName: string;
  contentType: AllowedContentType | undefined;
  /** Set once uploaded, so a retry doesn't upload the file again. */
  mediaId?: string;
};

/**
 * A message the user sent that the server hasn't confirmed yet. Persisted so it
 * survives restarts, and always retried with the same `clientMessageId`.
 */
export type OutboxEntry = {
  clientMessageId: string;
  conversationId: string;
  senderId: string;
  kind: MessageKind;
  text: string;
  attachments: OutboxAttachment[];
  createdAt: string;
  /** `pending` was in flight (possibly interrupted by a restart); `failed` needs a retry. */
  status: "pending" | "failed";
};

type OutboxState = {
  entries: Record<string, OutboxEntry>;
  put: (entry: OutboxEntry) => void;
  update: (clientMessageId: string, patch: Partial<OutboxEntry>) => void;
  remove: (clientMessageId: string) => void;
  clear: () => void;
};

export const useOutboxStore = create<OutboxState>()(
  persist(
    (set) => ({
      entries: {},
      put: (entry) =>
        set((s) => ({ entries: { ...s.entries, [entry.clientMessageId]: entry } })),
      update: (id, patch) =>
        set((s) =>
          s.entries[id] ? { entries: { ...s.entries, [id]: { ...s.entries[id], ...patch } } } : s,
        ),
      remove: (id) =>
        set((s) => {
          const { [id]: _removed, ...entries } = s.entries;
          return { entries };
        }),
      clear: () => set({ entries: {} }),
    }),
    {
      name: "chat_outbox",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ entries: s.entries }),
    },
  ),
);
