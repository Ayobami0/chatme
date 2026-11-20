import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CloudinaryUploadAuthorizationDto,
  MediaAssetResponseDto,
} from "@shared/types/api";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * How far one upload (identified by its `clientUploadId`) has got, so a retry only
 * repeats what remains:
 * - `authorized`: the server issued storage credentials; the file isn't transferred yet.
 * - `transferred`: the file is in storage; the server hasn't verified it yet.
 * - `completed`: the server marked the asset ready.
 */
export type UploadProgress =
  | { stage: "authorized"; mediaId: string; authorization: CloudinaryUploadAuthorizationDto }
  | { stage: "transferred"; mediaId: string }
  | { stage: "completed"; mediaId: string; asset: MediaAssetResponseDto };

type UploadProgressState = {
  uploads: Record<string, UploadProgress>;
  set: (clientUploadId: string, progress: UploadProgress) => void;
  remove: (clientUploadId: string) => void;
  clear: () => void;
};

export const useUploadProgressStore = create<UploadProgressState>()(
  persist(
    (set) => ({
      uploads: {},
      set: (id, progress) => set((s) => ({ uploads: { ...s.uploads, [id]: progress } })),
      remove: (id) =>
        set((s) => {
          const { [id]: _removed, ...uploads } = s.uploads;
          return { uploads };
        }),
      clear: () => set({ uploads: {} }),
    }),
    {
      name: "media_upload_progress",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ uploads: s.uploads }),
    },
  ),
);
