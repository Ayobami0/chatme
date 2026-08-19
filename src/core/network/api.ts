import { AppConfig } from "@core/config";
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { log } from "@logging";
import StorageService, { StorageKey } from "@services/storage";
import { VerifyPhoneVerificationResponse } from "@shared/types/api";
import { useTokenStore } from "@shared/store/auth";

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
      const accessToken = useTokenStore.getState().accessToken;

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

      useTokenStore.getState().clearAuth();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshToken = useTokenStore.getState().refreshToken;

      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      /**
       * IMPORTANT:
       *
       * Use plain axios here rather than apiClient.
       * Otherwise the refresh request itself would
       * go through the 401 interceptor.
       */
      const response = await axios.post<VerifyPhoneVerificationResponse>(
        `${AppConfig.apiBaseUrl}/auth/refresh`,
        {
          refreshToken,
        },
      );

      const {
        accessToken,
        refreshToken: newRefreshToken,
      } = response.data;

      const storedTokens = {
        accessToken,
        refreshToken: newRefreshToken,
      };

      useTokenStore.getState().setAuth(storedTokens);

      await StorageService.secureSave(StorageKey.AuthToken, storedTokens);

      return apiClient(originalRequest);
    } catch (refreshError) {
      log.error("→ TOKEN REFRESH ERROR", refreshError);

      return Promise.reject(refreshError);
    }
  },
);
