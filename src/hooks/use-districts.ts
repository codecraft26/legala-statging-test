"use client";

import { useQuery } from "@tanstack/react-query";
import { getApiBaseUrl, getCookie } from "@/lib/utils";

export type DistrictsApiResponse = {
  status: number;
  data: Array<{ state: string; districts: string[] }>;
};

export function useDistrictsIndex() {
  return useQuery({
    queryKey: ["districts-index"],
    queryFn: async (): Promise<DistrictsApiResponse> => {
      const base = getApiBaseUrl();
      const token = getCookie("token") || "";
      const res = await fetch(`${base}/research/district-court/districts`, {
        cache: "no-store",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as DistrictsApiResponse;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    retry: 1,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}


