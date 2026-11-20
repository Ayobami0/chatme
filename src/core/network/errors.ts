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

export function isNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

/**
 * Thrown when work started by one session tries to continue after the session
 * changed (logout, login, switching account). Callers should drop the work silently.
 */
export class StaleSessionError extends Error {
  constructor() {
    super("The session that started this work has ended");
    this.name = "StaleSessionError";
  }
}

export const isStaleSession = (error: unknown): error is StaleSessionError =>
  error instanceof StaleSessionError;
