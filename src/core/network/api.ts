import { AppConfig } from "@core/config";
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { log, redact } from "@logging";
import { TokenManager } from "@services/token-manager";

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

apiClient.interceptors.request.use(
  (config) => {
    if (!isPublicEndpoint(config.url)) {
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

    return response;
  },

  async (error: AxiosError) => {
    log.error(`← ${error.response?.status ?? "NETWORK"} ${describe(error.config)}`, {
      message: error.message,
      data: __DEV__ ? redact(error.response?.data) : undefined,
    });

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetryableRequestConfig;

    if (originalRequest._retry) {
      log.warn("Request failed with 401 after token refresh");

      TokenManager.clearTokens();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newTokens = await TokenManager.refreshToken();
      if (newTokens?.accessToken) {
        return apiClient(originalRequest);
      }
      return Promise.reject(error);
    } catch (refreshError) {
      log.error("→ TOKEN REFRESH ERROR", (refreshError as Error)?.message);
      return Promise.reject(refreshError);
    }
  },
);
