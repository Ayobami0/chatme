import { StoredAuthTokens } from "@shared/types/authState";
import { create } from "zustand";
import { combine } from "zustand/middleware";

export const useTokenStore = create(
  combine(
    {
      accessToken: undefined as string | undefined,
      refreshToken: undefined as string | undefined,
    } as StoredAuthTokens,
    (set) => ({
      setAuth: (tokens: StoredAuthTokens) => set(tokens),
      clearAuth: () => set({ accessToken: undefined, refreshToken: undefined }),
    }),
  ),
);
