import { QueryClient } from "@tanstack/react-query";

export const CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 7;

export const client = new QueryClient({
  defaultOptions: {
    queries: {
      // Must be at least the persisted max age, or restored queries are garbage collected immediately.
      gcTime: CACHE_MAX_AGE,
    },
  },
});

export * from "./keys";
