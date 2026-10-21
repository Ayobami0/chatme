import { logger } from "react-native-logs";

export const log = logger.createLogger({
  severity: __DEV__ ? "debug" : "warn",
});

const SENSITIVE_KEYS = new Set([
  "accesstoken",
  "refreshtoken",
  "token",
  "otp",
  "code",
  "pin",
  "authorization",
  "text",
  "phonenumber",
]);

/** Returns a copy of `value` with sensitive fields masked, safe to pass to the logger. */
export function redact(value: unknown, depth = 0): unknown {
  if (value == null || typeof value !== "object" || depth > 5) return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));

  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? "[REDACTED]" : redact(v, depth + 1);
  }
  return out;
}
