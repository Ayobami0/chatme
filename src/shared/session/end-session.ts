import { removePersistedQueryCache } from "@core/query/persistence";
import StorageService, { StorageKey } from "@services/storage";
import { QueryClient } from "@tanstack/react-query";

/**
 * Removes everything owned by the signed-in account, in order, so a later
 * account cannot see it:
 * 1. Cancel in-flight queries so their results are discarded.
 * 2. Clear the in-memory query and mutation caches.
 * 3. Delete the account's persisted cache and per-account flags.
 *
 * Credentials are cleared separately by `TokenManager.clearTokens`.
 */
export async function endSession(queryClient: QueryClient, userId?: string) {
  await queryClient.cancelQueries();
  queryClient.clear();

  await Promise.allSettled([
    removePersistedQueryCache(userId),
    StorageService.remove(StorageKey.ProfileFlowStage),
    StorageService.remove(StorageKey.CachedUser),
  ]);
}
