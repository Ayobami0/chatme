import { applyContactMatches, chunk, CONTACT_MATCH_BATCH_SIZE } from "../contact-matching";
import { describeBulkOutcome } from "../../components/bulk-outcome-toast";

describe("chunk", () => {
  it("splits 250 numbers into API-sized batches", () => {
    const sizes = chunk(Array.from({ length: 250 }, (_, i) => i), CONTACT_MATCH_BATCH_SIZE).map(
      (c) => c.length,
    );
    expect(sizes).toEqual([100, 100, 50]);
  });
});

describe("applyContactMatches", () => {
  it("links the server user while keeping the device contact id separate", () => {
    const [matched, unmatched] = applyContactMatches(
      [
        { deviceContactId: "device-1", displayName: "Ada", phoneNumber: "+2348000000001" },
        { deviceContactId: "device-2", displayName: "Bo", phoneNumber: "+2348000000002" },
      ],
      [
        {
          matchedPhoneNumber: "+2348000000001",
          user: { id: "user-9", displayName: "Ada L", avatarUrl: null },
        },
      ],
    );

    expect(matched.deviceContactId).toBe("device-1");
    expect(matched.user?.id).toBe("user-9");
    expect(unmatched.user).toBeUndefined();
  });
});

describe("describeBulkOutcome", () => {
  const label = { verb: "pin", past: "pinned" };

  it("reports full success", () => {
    expect(describeBulkOutcome({ succeeded: [1, 2], failed: [] }, label)).toBe("2 chats pinned");
  });

  it("reports partial failure", () => {
    expect(describeBulkOutcome({ succeeded: [1, 2], failed: [3] }, label)).toBe(
      "2 pinned, 1 failed",
    );
  });

  it("reports total failure", () => {
    expect(describeBulkOutcome({ succeeded: [], failed: [1] }, label)).toBe(
      "Unable to pin chat. Try again.",
    );
  });
});
