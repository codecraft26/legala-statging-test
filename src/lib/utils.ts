import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Backend URLs from env
export const getBackendBaseUrl = (): string => {
  const url =
    process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) {
    return "http://localhost:4242";
  }
  return url.replace(/\/$/, "");
};

export const getApiBaseUrl = (): string => {
  const base = getBackendBaseUrl();
  const api = process.env.NEXT_PUBLIC_API_BASE_PATH || "/api";
  return `${base}${api.startsWith("/") ? api : `/${api}`}`.replace(/\/$/, "");
};
