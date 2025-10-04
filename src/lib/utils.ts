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

export const getResearchApiBaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_CC_BASE_URL || "https://researchengineinh.infrahive.ai";
  return url.replace(/\/$/, "");
};

// Cookie helpers (client-side)
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(
      "(?:^|; )" + name.replace(/[.$?*|{}()\[\]\\\/\+^]/g, "\\$&") + "=([^;]*)"
    )
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(
  name: string,
  value: string,
  days = 7,
  options?: {
    path?: string;
    secure?: boolean;
    sameSite?: "lax" | "strict" | "none";
  }
): void {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const path = options?.path ?? "/";
  const secure = options?.secure ?? true;
  const sameSite = options?.sameSite ?? "lax";
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=${path}; ${secure ? "Secure; " : ""}SameSite=${sameSite}`;
}

export function deleteCookie(name: string, options?: { path?: string }): void {
  if (typeof document === "undefined") return;
  const path = options?.path ?? "/";
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
}
