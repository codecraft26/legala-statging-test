"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
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

export function useAcceptInvite() {
  return useMutation({
    mutationFn: async (args: { token: string; password: string }) => {
      const { token, password } = args;
      return await Api.post("/user/accept-invite", { token, password });
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (args: { email: string }) => {
      return await Api.post<{ message: string; token?: string }>("/user/forgot-password", args);
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (args: { token: string; password: string }) => {
      return await Api.post("/user/reset-password", args);
    },
  });
}

export function useSignup() {
  return useMutation({
    mutationFn: async (args: { name: string; email: string; password: string }) => {
      return await Api.post("/user/signup", args);
    },
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: async (args: { email: string; password: string }) => {
      return await Api.post<{ token: string }>("/user/login", args);
    },
  });
}


