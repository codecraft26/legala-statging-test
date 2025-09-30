"use client";

import { useQuery } from "@tanstack/react-query";
import { Api } from "@/lib/api-client";
import { CreditApi, type CreditDetail } from "@/lib/credit-api";

export function useProfileDetail() {
  return useQuery<any>({
    queryKey: ["profile", "me"],
    queryFn: async () => {
      const detailResponse: any = await Api.get("/user/detail");
      return (detailResponse && (detailResponse.data ?? detailResponse)) as any;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useCreditDetail(enabled: boolean) {
  return useQuery<CreditDetail | null>({
    enabled,
    queryKey: ["credit", "me"],
    queryFn: async () => {
      try {
        const c = await CreditApi.getDetail();
        return c || null;
      } catch (e) {
        return null;
      }
    },
    staleTime: 60 * 1000,
  });
}


