import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type DraftsState = {
  drafts: Record<string, string>;
  setDraft: (conversationId: string, text: string) => void;
  clear: () => void;
};

/** Unsent composer text per conversation, kept across navigation and restarts. */
export const useDraftsStore = create<DraftsState>()(
  persist(
    (set) => ({
      drafts: {},
      setDraft: (conversationId, text) =>
        set((s) => {
          const { [conversationId]: _previous, ...rest } = s.drafts;
          return { drafts: text ? { ...rest, [conversationId]: text } : rest };
        }),
      clear: () => set({ drafts: {} }),
    }),
    {
      name: "chat_drafts",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ drafts: s.drafts }),
    },
  ),
);
