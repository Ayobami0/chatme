import * as Contacts from "expo-contacts";
import { useCallback, useEffect, useRef, useState } from "react";
import { DiscoveryService } from "@services/discovery";
import { formatPhoneNumber, validatePhoneNumber } from "@shared/utils/phone";
import { log } from "@logging";
import {
  applyContactMatches,
  chunk,
  CONTACT_MATCH_BATCH_SIZE,
  DeviceContact,
} from "../utils/contact-matching";

export type ContactMatchStatus = "loading" | "denied" | "error" | "ready";

const toDeviceContact = (c: Contacts.ExistingContact): DeviceContact => {
  const phone = c.phoneNumbers?.find((e) => e.isPrimary) ?? c.phoneNumbers?.[0];
  return {
    deviceContactId: c.id,
    displayName: [c.firstName, c.lastName].filter(Boolean).join(" ") || c.name || "",
    phoneNumber:
      formatPhoneNumber(phone?.number ?? "", { country: phone?.countryCode }) ?? undefined,
  };
};

/**
 * Loads the device address book and links each contact to its ChatMe user, matching
 * every valid number in batches the API accepts. Results are merged into the contacts
 * loaded by the same run, so a slow response can never overwrite newer state.
 */
export function useDeviceContactMatches() {
  const [contacts, setContacts] = useState<DeviceContact[]>([]);
  const [status, setStatus] = useState<ContactMatchStatus>("loading");
  const runId = useRef(0);

  const load = useCallback(async () => {
    const run = ++runId.current;
    const isCurrent = () => run === runId.current;
    setStatus("loading");

    try {
      const { status: permission } = await Contacts.requestPermissionsAsync();
      if (!isCurrent()) return;
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const { data } = await Contacts.getContactsAsync({ sort: "firstName" });
      const loaded = data.map(toDeviceContact);
      if (!isCurrent()) return;
      setContacts(loaded);

      const phones = [
        ...new Set(
          loaded
            .map((c) => c.phoneNumber)
            .filter((p): p is string => Boolean(p) && validatePhoneNumber(p!)),
        ),
      ];

      const results = await Promise.allSettled(
        chunk(phones, CONTACT_MATCH_BATCH_SIZE).map((phoneNumbers) =>
          DiscoveryService.matchContacts({ phoneNumbers }),
        ),
      );
      if (!isCurrent()) return;

      const matches = results.flatMap((r) => (r.status === "fulfilled" ? r.value.matches : []));
      setContacts(applyContactMatches(loaded, matches));
      setStatus(results.some((r) => r.status === "rejected") ? "error" : "ready");
    } catch (error) {
      log.warn("Unable to load contacts", (error as Error)?.message);
      if (isCurrent()) setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      runId.current++;
    };
  }, [load]);

  return { contacts, status, retry: load };
}
