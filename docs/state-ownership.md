# State ownership

Each kind of data has exactly one writable owner. Other layers read from that owner; they never keep an independent copy.

| Data | Owner | Persistence | Written by |
|---|---|---|---|
| Conversations (active, archived, details) | TanStack Query (`queryKeys.conversations`, `archivedConversations`, `conversation(id)`) | Query persister, AsyncStorage key `query_cache_<userId>` | Query fetches; mutations through `setQueryData` |
| Messages | TanStack Query (`queryKeys.messages(id)`): a `MessageWindow` holding oldest-first `items` and an `olderCursor` | Same persister | Only through `reconcileMessages`: the latest page (`mergeLatestPage`), older pages (`mergeOlderPage`), send responses and socket events (`applyMessages`) |
| Read receipts | TanStack Query (`queryKeys.receipts(id)`) + screen-local socket updates | Same persister | Query fetches; socket `receipt.*` |
| Pending / failed sends | `useOutboxStore` (`features/chat/store/outbox.ts`) | AsyncStorage `chat_outbox` | `useMessageSender` / `deliverOutboxEntry`. An entry is removed once a confirmed message carries its `clientMessageId`. |
| Drafts | `useDraftsStore` (`features/chat/store/drafts.ts`) | AsyncStorage `chat_drafts` | Composer |
| Session (tokens, user) | `TokenManager` (tokens) + `AuthContext` (user, status) | SecureStore `authToken` | Auth flows; `endSession` on logout or rejected credentials |

## Ordering rules

- **Restore before fetch.** `usePersistedQueryCache` restores the signed-in user's cache and feeds `IsRestoringProvider`. Queries don't fetch, and the `(app)` group, including the realtime socket, doesn't mount, until the restore finishes.
- **A late restore never wins over newer data.** TanStack's `hydrate` overwrites a query only when the persisted copy is newer than what's in memory. This is covered by `session-cache.test.ts`.
- **Merge, don't replace.** A fetched message page is merged into the cached list, so socket messages and older cached messages survive a refetch. If the newest page doesn't overlap the cache and older pages exist, messages were missed while away. In that case the stale history is dropped instead of leaving a silent gap.
- **Catch up on reconnect.** `useConversationSync` refetches the newest page whenever the socket reconnects.
- **One logical send, one message.** Retries reuse the outbox entry's `clientMessageId`, and attachments already uploaded keep their `mediaId`. A send whose HTTP response is lost is reconciled by its own socket echo.
- **Only success is authoritative.** Persisted queries are restricted to `status === "success"`. A loading or failed query keeps its previous data instead of writing an empty list.

## Account isolation

`endSession(queryClient, userId)` (`src/shared/session/end-session.ts`) is the only teardown path. `logout()` and the unauthenticated listener both use it, and concurrent calls share one run.

1. `cancelQueries()`: results of in-flight requests are discarded.
2. `clear()`: the query and mutation caches are emptied.
3. The outbox and drafts are emptied.
4. The account's persisted cache, the legacy `cache_*` keys and `profileFlowStage` are removed from disk.

Each account persists under its own storage key, so account B never restores account A's snapshot. The realtime socket lives inside the `(app)` group and disconnects when the session ends.

Query keys are not prefixed with the user id. Isolation relies on the steps above. Phase 3 adds a session generation counter, so token refreshes that resolve after logout are also rejected.
