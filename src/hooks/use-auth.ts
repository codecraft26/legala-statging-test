"use client";

import { useQuery } from "@tanstack/react-query";
import { Api } from "@/lib/api-client";
import { getCookie, deleteCookie } from "@/lib/utils";

export interface AuthUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

export function useAuth() {
  const token = typeof window !== "undefined" ? getCookie("token") : undefined;

  const query = useQuery<{ data?: AuthUser } | AuthUser | null>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      if (!token) return null;
      try {
        const res = await Api.get<any>("/user/detail");
        return res?.data || res || null;
      } catch (_) {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const user: AuthUser | undefined = query.data
    ? ((query.data as any).data || (query.data as any))
    : undefined;

  const signOut = () => {
    if (typeof window !== "undefined") deleteCookie("token");
  };

  return {
    token,
    user,
    isLoading: query.isLoading || query.isFetching,
    refetch: query.refetch,
    signOut,
  } as const;
}


