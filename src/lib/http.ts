import axios from "axios";
import { getBackendBaseUrl, getCookie } from "@/lib/utils";

// Central axios instance reading base URL from env via utils
export const http = axios.create({
  baseURL: getBackendBaseUrl(),
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Authorization header from cookie (client-side)
http.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      const token = getCookie("token");
      if (token) {
        config.headers = config.headers ?? {};
        (config.headers as any)["Authorization"] = `Bearer ${token}`;
      }
    } catch {}
  }
  return config;
});

// Optional: basic error normalization
http.interceptors.response.use(
  (resp) => resp,
  (error) => {
    const message =
      error?.response?.data?.message || error?.message || "Request failed";
    return Promise.reject(new Error(message));
  }
);
