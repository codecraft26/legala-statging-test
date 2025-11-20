import { getResearchApiBaseUrl } from "@/lib/utils";

type ResearchHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ResearchRequestOptions<TBody = unknown> {
  path: string;
  method?: ResearchHttpMethod;
  body?: TBody;
  headers?: Record<string, string>;
  cache?: RequestCache;
}

export async function researchApiRequest<
  TResponse = unknown,
  TBody = unknown
>(options: ResearchRequestOptions<TBody>): Promise<TResponse> {
  const { path, method = "GET", body, headers = {}, cache } = options;
  const baseUrl = getResearchApiBaseUrl();
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const requestHeaders: HeadersInit = new Headers({
    Accept: "application/json",
  });
  Object.entries(headers).forEach(([key, value]) =>
    requestHeaders.set(key, value)
  );

  let requestBody: BodyInit | undefined;
  if (body instanceof FormData) {
    requestBody = body;
  } else if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: method === "GET" || method === "DELETE" ? undefined : requestBody,
    cache,
  });

  if (!response.ok) {
    let errorMessage = `${response.status} ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (typeof errorJson === "string") {
        errorMessage = errorJson;
      } else if (errorJson?.message) {
        errorMessage = errorJson.message;
      }
    } catch {
      // ignore parse errors and fall back to default message
    }
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as TResponse;
  }

  const textResponse = await response.text();
  try {
    return JSON.parse(textResponse) as TResponse;
  } catch {
    return textResponse as unknown as TResponse;
  }
}

export const ResearchApi = {
  get: <T = unknown>(path: string, cache?: RequestCache) =>
    researchApiRequest<T>({ path, method: "GET", cache }),
  post: <T = unknown, B = unknown>(path: string, body?: B) =>
    researchApiRequest<T, B>({ path, method: "POST", body }),
  patch: <T = unknown, B = unknown>(path: string, body?: B) =>
    researchApiRequest<T, B>({ path, method: "PATCH", body }),
  put: <T = unknown, B = unknown>(path: string, body?: B) =>
    researchApiRequest<T, B>({ path, method: "PUT", body }),
  delete: <T = unknown>(path: string) =>
    researchApiRequest<T>({ path, method: "DELETE" }),
};

export interface HCDelhiJudgementRequest {
  party_name: string;
  from_date?: string;
  to_date?: string;
  year?: number;
}

export interface HCDelhiJudgement {
  s_no: string;
  case_no: string;
  neutral_citation: string;
  judgement_date: string;
  pdf_link: string;
  txt_link: string;
  petitioner: string;
  respondent: string;
  corrigendum: string;
  remarks: string;
}

export interface HCDelhiJudgementResponse {
  judgements: HCDelhiJudgement[];
}

export function fetchHCDelhiJudgements(
  payload: HCDelhiJudgementRequest
): Promise<HCDelhiJudgementResponse> {
  return ResearchApi.post<HCDelhiJudgementResponse, HCDelhiJudgementRequest>(
    "/hcdelhi/search-judgement",
    payload
  );
}

