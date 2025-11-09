import { getApiBaseUrl, getCookie, deleteCookie } from "@/lib/utils";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiRequestOptions<TBody = unknown> {
  path: string;
  method?: HttpMethod;
  body?: TBody;
  headers?: Record<string, string>;
  isMultipart?: boolean;
  cache?: RequestCache;
}

export async function apiRequest<TResponse = unknown, TBody = unknown>(
  options: ApiRequestOptions<TBody>
): Promise<TResponse> {
  const {
    path,
    method = "GET",
    body,
    headers = {},
    isMultipart,
    cache,
  } = options;
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const requestHeaders: HeadersInit = new Headers();
  Object.entries(headers).forEach(([k, v]) => requestHeaders.set(k, v));

  // Attach token from cookie if available (client-side only)
  if (typeof window !== "undefined") {
    try {
      const token = getCookie("token");
      if (token) requestHeaders.set("Authorization", `Bearer ${token}`);
    } catch {}
  }

  let requestBody: BodyInit | undefined;
  if (body instanceof FormData) {
    requestBody = body;
  } else if (body !== undefined) {
    if (!isMultipart) requestHeaders.set("Content-Type", "application/json");
    requestBody = isMultipart
      ? (body as unknown as BodyInit)
      : JSON.stringify(body);
  }

  const res = await fetch(url, {
    method,
    headers: requestHeaders,
    body: method === "GET" || method === "DELETE" ? undefined : requestBody,
    cache,
  });

  if (!res.ok) {
    // Handle 401 Unauthorized (expired token)
    if (res.status === 401 && typeof window !== "undefined") {
      // Clear token and localStorage
      deleteCookie("token");
      try {
        localStorage.removeItem("user");
      } catch {}
      // Redirect to login
      window.location.href = "/login";
      throw new Error("Token expired. Please login again.");
    }
    
    let errorMessage = `${res.status} ${res.statusText}`;
    try {
      const errJson = (await res.json()) as { message?: string };
      if (errJson?.message) errorMessage = errJson.message;
    } catch {}
    throw new Error(errorMessage);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as TResponse;
  }
  // Fallback to text for non-JSON
  return (await res.text()) as unknown as TResponse;
}

export const Api = {
  get: <T = unknown>(path: string, cache?: RequestCache) =>
    apiRequest<T>({ path, method: "GET", cache }),
  post: <T = unknown, B = unknown>(
    path: string,
    body?: B,
    isMultipart?: boolean
  ) => apiRequest<T, B>({ path, method: "POST", body, isMultipart }),
  patch: <T = unknown, B = unknown>(path: string, body?: B) =>
    apiRequest<T, B>({ path, method: "PATCH", body }),
  put: <T = unknown, B = unknown>(path: string, body?: B) =>
    apiRequest<T, B>({ path, method: "PUT", body }),
  delete: <T = unknown>(path: string) =>
    apiRequest<T>({ path, method: "DELETE" }),
};
