export type BulkResult<T> = { succeeded: T[]; failed: T[] };

/** Runs `operation` for every item concurrently and reports which items succeeded or failed. */
export async function runBulk<T>(
  items: T[],
  operation: (item: T) => Promise<unknown>,
): Promise<BulkResult<T>> {
  const results = await Promise.allSettled(items.map((item) => operation(item)));

  return results.reduce<BulkResult<T>>(
    (acc, result, index) => {
      (result.status === "fulfilled" ? acc.succeeded : acc.failed).push(items[index]);
      return acc;
    },
    { succeeded: [], failed: [] },
  );
}
