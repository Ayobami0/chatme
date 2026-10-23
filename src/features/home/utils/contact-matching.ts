import { ConversationUser } from "@shared/types/models";
import { ContactMatchDto } from "@shared/types/api";

/** The API accepts at most this many phone numbers per `/contacts/match` request. */
export const CONTACT_MATCH_BATCH_SIZE = 100;

/** A contact from the device address book, optionally matched to a ChatMe user. */
export type DeviceContact = {
  /** Address-book id; never use it as a server user id. */
  deviceContactId: string;
  displayName: string;
  phoneNumber?: string;
  /** The matched server user, if the phone number belongs to one. */
  user?: ConversationUser;
};

export function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/** Returns `contacts` with each matched phone number linked to its server user. */
export function applyContactMatches(
  contacts: readonly DeviceContact[],
  matches: readonly ContactMatchDto[],
): DeviceContact[] {
  const usersByPhone = new Map(matches.map((m) => [m.matchedPhoneNumber, m.user]));

  return contacts.map((contact) => {
    const user = contact.phoneNumber ? usersByPhone.get(contact.phoneNumber) : undefined;
    return user
      ? {
          ...contact,
          user: {
            id: user.id,
            displayName: user.displayName ?? null,
            avatarUrl: user.avatarUrl ?? null,
          },
        }
      : contact;
  });
}
