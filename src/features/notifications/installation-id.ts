import StorageService from "@services/storage";
import * as Crypto from "expo-crypto";

const KEY = "push_installation_id";
let cached: Promise<string> | null = null;

/**
 * A random id for this app installation, persisted so the server can rotate this
 * device's push token in place. Not a hardware identifier, and deliberately kept
 * across logouts (registrations themselves are per login).
 */
export function getInstallationId(): Promise<string> {
  cached ??= (async () => {
    const existing = await StorageService.get<string>(KEY);
    if (existing) return existing;
    const id = Crypto.randomUUID();
    await StorageService.save(KEY, id);
    return id;
  })().catch((error) => {
    cached = null;
    throw error;
  });
  return cached;
}
