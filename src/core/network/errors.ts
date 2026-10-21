import axios from "axios";

/**
 * True only when the server explicitly rejected the credentials. Network failures,
 * timeouts and 5xx responses are not rejections: the session may still be valid.
 */
export function isCredentialRejection(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 401 || status === 403;
}
