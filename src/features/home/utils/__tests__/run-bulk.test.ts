import { runBulk } from "../run-bulk";

describe("runBulk", () => {
  it("reports partial failures instead of overall success", async () => {
    const result = await runBulk(["a", "b", "c"], async (id) => {
      if (id === "b") throw new Error("nope");
    });

    expect(result).toEqual({ succeeded: ["a", "c"], failed: ["b"] });
  });
});
