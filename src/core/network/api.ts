import { AppConfig } from "@config";
import axios from "axios";
import { log } from "@logging";

export const apiClient = axios.create({
  baseURL: AppConfig.apiBaseUrl,
});

apiClient.interceptors.request.use(
  (config) => {
    log.debug("→ HTTP REQUEST", {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL ?? ""}${config.url ?? ""}`,
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
  (error) => {
    log.error("← HTTP RESPONSE ERROR", {
      status: error.response?.status,
      method: error.config?.method?.toUpperCase(),
      url: `${error.config?.baseURL ?? ""}${error.config?.url ?? ""}`,
      data: error.response?.data,
      message: error.message,
    });

    return Promise.reject(error);
  },
);
