import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { useEffect, useState } from "react";
import { log } from "@logging";
import { CACHE_MAX_AGE } from "./index";
import { PERSISTED_QUERY_ROOTS } from "./keys";

/** Bump when the shape of persisted query data changes, so old caches are discarded. */
const CACHE_BUSTER = "v1";

/** Keys written by the pre-TanStack Zustand cache; removed so old data cannot leak across accounts. */
const LEGACY_CACHE_KEYS = ["cache_conversations"];
const LEGACY_MESSAGES_PREFIX = "cache_messages_";

const storageKeyFor = (userId: string) => `query_cache_${userId}`;

/**
 * Restores the signed-in user's persisted query cache and keeps it saved.
 *
 * Returns `true` until restoration for `userId` finishes. Pass the result to
 * `IsRestoringProvider` so queries wait for the restored data instead of racing it.
 */
export function usePersistedQueryCache(queryClient: QueryClient, userId?: string) {
  const [restoredUserId, setRestoredUserId] = useState<string>();

  useEffect(() => {
    if (!userId) return;

    let active = true;
    const [unsubscribe, restored] = persistQueryClient({
      queryClient,
      persister: createAsyncStoragePersister({
        storage: AsyncStorage,
        key: storageKeyFor(userId),
        throttleTime: 1000,
      }),
      maxAge: CACHE_MAX_AGE,
      buster: CACHE_BUSTER,
      dehydrateOptions: {
        shouldDehydrateQuery: (query) =>
          query.state.status === "success" &&
          PERSISTED_QUERY_ROOTS.includes(String(query.queryKey[0])),
      },
    });

    restored
      .catch((error) => log.warn("Unable to restore query cache", error?.message))
      .finally(() => {
        if (active) setRestoredUserId(userId);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [queryClient, userId]);

  // Derived rather than set in the effect so there is no render where queries can fetch before restore.
  return Boolean(userId) && restoredUserId !== userId;
}

export async function removePersistedQueryCache(userId?: string) {
  const allKeys = await AsyncStorage.getAllKeys();
  const keys = allKeys.filter(
    (key) =>
      (userId && key === storageKeyFor(userId)) ||
      LEGACY_CACHE_KEYS.includes(key) ||
      key.startsWith(LEGACY_MESSAGES_PREFIX),
  );
  if (keys.length > 0) await AsyncStorage.multiRemove(keys);
}
