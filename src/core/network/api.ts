import { AppConfig } from "@core/config";
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { log } from "@logging";
import { VerifyPhoneVerificationResponse } from "@shared/types/api";
import { TokenManager } from "@services/token-manager";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const apiClient = axios.create({
  baseURL: AppConfig.apiBaseUrl,
});

const publicEndpoints = [
  "/auth/refresh",
  "/auth/otp/request",
  "/auth/otp/verify",
  "/auth/logout",
];

apiClient.interceptors.request.use(
  (config) => {
    if (!publicEndpoints.includes(config.url ?? "")) {
      const accessToken = TokenManager.getAccessToken();

      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    log.debug("→ HTTP REQUEST", {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL ?? ""}/${config.url ?? ""}`,
      params: config.params,
      data: config.data,
    });

    return config;
  },

  (error) => {
    log.error("→ HTTP REQUEST ERROR", error);
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response) => {
    log.debug("← HTTP RESPONSE", {
      status: response.status,
      method: response.config.method?.toUpperCase(),
      url: `${response.config.baseURL ?? ""}${response.config.url ?? ""}`,
      data: response.data,
    });

    return response;
  },

  async (error: AxiosError) => {
    log.error("← HTTP RESPONSE ERROR", {
      status: error.response?.status,
      method: error.config?.method?.toUpperCase(),
      url: `${error.config?.baseURL ?? ""}${error.config?.url ?? ""}`,
      data: error.response?.data,
      message: error.message,
    });

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetryableRequestConfig;
    log.debug(originalRequest);

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
      log.error("→ TOKEN REFRESH ERROR", refreshError);
      return Promise.reject(refreshError);
    }
  },
);
