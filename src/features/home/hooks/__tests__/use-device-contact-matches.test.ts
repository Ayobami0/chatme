jest.mock("expo-contacts", () => ({
  requestPermissionsAsync: jest.fn(),
  getContactsAsync: jest.fn(),
}));
jest.mock("@services/discovery", () => ({
  DiscoveryService: { matchContacts: jest.fn() },
}));

import * as Contacts from "expo-contacts";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { DiscoveryService } from "@services/discovery";
import { useDeviceContactMatches } from "../use-device-contact-matches";

const matchContacts = DiscoveryService.matchContacts as jest.Mock;
const phone = (i: number) => `+23480${String(30000000 + i)}`;

const deviceContacts = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `device-${i}`,
    firstName: `Contact${i}`,
    phoneNumbers: [{ number: phone(i), isPrimary: true }],
  }));

describe("useDeviceContactMatches", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Contacts.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
  });

  it("keeps every loaded contact after a slow match response", async () => {
    (Contacts.getContactsAsync as jest.Mock).mockResolvedValue({ data: deviceContacts(3) });
    let respond!: (value: unknown) => void;
    matchContacts.mockReturnValue(new Promise((resolve) => (respond = resolve)));

    const { result } = await renderHook(() => useDeviceContactMatches());
    await waitFor(() => expect(result.current.contacts).toHaveLength(3));

    await act(async () =>
      respond({
        matches: [{ matchedPhoneNumber: phone(1), user: { id: "user-1", displayName: "U", avatarUrl: null } }],
      }),
    );

    expect(result.current.status).toBe("ready");
    expect(result.current.contacts).toHaveLength(3);
    expect(result.current.contacts[1].user?.id).toBe("user-1");
    expect(result.current.contacts[1].deviceContactId).toBe("device-1");
  });

  it("matches more than 100 contacts in batches of at most 100", async () => {
    (Contacts.getContactsAsync as jest.Mock).mockResolvedValue({ data: deviceContacts(205) });
    matchContacts.mockResolvedValue({ matches: [] });

    const { result } = await renderHook(() => useDeviceContactMatches());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    const batchSizes = matchContacts.mock.calls.map(([req]) => req.phoneNumbers.length);
    expect(batchSizes).toEqual([100, 100, 5]);
  });

  it("reports a partial failure but keeps the contacts that matched", async () => {
    (Contacts.getContactsAsync as jest.Mock).mockResolvedValue({ data: deviceContacts(150) });
    matchContacts
      .mockResolvedValueOnce({
        matches: [{ matchedPhoneNumber: phone(0), user: { id: "user-0", displayName: null, avatarUrl: null } }],
      })
      .mockRejectedValueOnce(new Error("timeout"));

    const { result } = await renderHook(() => useDeviceContactMatches());
    await waitFor(() => expect(result.current.status).toBe("error"));

    expect(result.current.contacts).toHaveLength(150);
    expect(result.current.contacts[0].user?.id).toBe("user-0");
  });

  it("reports denied permission", async () => {
    (Contacts.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: "denied" });

    const { result } = await renderHook(() => useDeviceContactMatches());
    await waitFor(() => expect(result.current.status).toBe("denied"));
    expect(matchContacts).not.toHaveBeenCalled();
  });
});
