import { AppConfig } from "@core/config";
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { log, redact } from "@logging";
import { TokenManager } from "@services/token-manager";
import { StaleSessionError } from "./errors";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const apiClient = axios.create({
  baseURL: AppConfig.apiBaseUrl,
  timeout: 15_000,
});

const publicEndpoints = [
  "auth/refresh",
  "auth/otp/request",
  "auth/otp/verify",
  "auth/otp/resend",
  "auth/logout",
];

const normalizePath = (url?: string) => (url ?? "").replace(/^\/+/, "");

const isPublicEndpoint = (url?: string) =>
  publicEndpoints.includes(normalizePath(url));

const describe = (config?: InternalAxiosRequestConfig) =>
  `${config?.method?.toUpperCase() ?? ""} /${normalizePath(config?.url)}`;

/** Requests that act for the signed-in session (not public, not explicit cleanup). */
const isSessionBound = (config?: InternalAxiosRequestConfig) =>
  !!config && !config.authOverride && !isPublicEndpoint(config.url);

/** True when the session that sent this request has since ended. */
const isStale = (config?: InternalAxiosRequestConfig) =>
  isSessionBound(config) &&
  config!.sessionGeneration !== undefined &&
  !TokenManager.isCurrentSession(config!.sessionGeneration);

apiClient.interceptors.request.use(
  (config) => {
    if (config.authOverride) {
      config.headers.Authorization = `Bearer ${config.authOverride}`;
    } else if (!isPublicEndpoint(config.url)) {
      // Bind the request to the session sending it. A caller-pinned generation that has
      // already ended is refused here, before old work can act with a newer session's token.
      config.sessionGeneration ??= TokenManager.getSessionGeneration();
      if (!TokenManager.isCurrentSession(config.sessionGeneration)) {
        throw new StaleSessionError();
      }

      const accessToken = TokenManager.getAccessToken();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    if (__DEV__) {
      log.debug(`→ ${describe(config)}`, redact({ params: config.params, data: config.data }));
    }

    return config;
  },

  (error) => {
    log.error("→ HTTP REQUEST ERROR", error?.message);
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response) => {
    log.debug(`← ${response.status} ${describe(response.config)}`);

    // Data for an ended session must not reach the newer session's caches.
    if (isStale(response.config)) throw new StaleSessionError();

    return response;
  },

  async (error: AxiosError) => {
    if (error instanceof StaleSessionError) return Promise.reject(error);

    const originalRequest = error.config as RetryableRequestConfig | undefined;

    log.error(`← ${error.response?.status ?? "NETWORK"} ${describe(originalRequest)}`, {
      message: error.message,
      data: __DEV__ ? redact(error.response?.data) : undefined,
    });

    // Never refresh, retry or clean up on behalf of a session that has ended: the
    // 401 belongs to the old session, and acting on it would touch the current one.
    if (isStale(originalRequest)) return Promise.reject(new StaleSessionError());

    if (error.response?.status !== 401 || !isSessionBound(originalRequest)) {
      return Promise.reject(error);
    }

    const generation = originalRequest!.sessionGeneration!;

    if (originalRequest!._retry) {
      log.warn("Request failed with 401 after token refresh");
      if (TokenManager.isCurrentSession(generation)) {
        await TokenManager.clearTokens().catch(() => undefined);
      }
      return Promise.reject(error);
    }

    originalRequest!._retry = true;

    try {
      const newTokens = await TokenManager.refreshToken();
      // The session may have ended while refreshing; don't replay into a newer one.
      if (!TokenManager.isCurrentSession(generation)) throw new StaleSessionError();
      if (newTokens?.accessToken) {
        return apiClient(originalRequest!);
      }
      return Promise.reject(error);
    } catch (refreshError) {
      if (!(refreshError instanceof StaleSessionError)) {
        log.error("→ TOKEN REFRESH ERROR", (refreshError as Error)?.message);
      }
      return Promise.reject(refreshError);
    }
  },
);
