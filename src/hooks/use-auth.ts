"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Api, apiRequest } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { getCookie, deleteCookie } from "@/lib/utils";

export interface AuthUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  remainingInvite?: number;
  invite?: number;
  workspace?: Array<{
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  }>;
  [key: string]: any;
}

// Query keys for consistent cache management
export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
  profile: () => [...authKeys.all, "profile"] as const,
};

export function useAuth() {
  const token = typeof window !== "undefined" ? getCookie("token") : undefined;

  const query = useQuery<{ data?: AuthUser } | AuthUser | null>({
    queryKey: authKeys.me(),
    queryFn: async () => {
      if (!token) return null;
      try {
        const res = await Api.get<any>("/user/detail");
        return res?.data || res || null;
      } catch (_) {
        return null;
      }
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });

  const user: AuthUser | undefined = query.data
    ? (query.data as any).data || (query.data as any)
    : undefined;

  const signOut = () => {
    if (typeof window !== "undefined") deleteCookie("token");
  };

  return {
    token,
    user,
    isLoading: query.isLoading || query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    signOut,
  } as const;
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { token: string; password: string }) => {
      const { token, password } = args;
      return await Api.post("/user/accept-invite", { token, password });
    },
    onSuccess: () => {
      // Invalidate auth queries after successful invite acceptance
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (error) => {
      console.error("Failed to accept invite:", error);
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (args: { email: string }) => {
      return await Api.post<{ message: string; token?: string }>(
        "/user/forgot-password",
        args
      );
    },
    onError: (error) => {
      console.error("Failed to send forgot password request:", error);
    },
  });
}

export function useResetPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { token: string; password: string }) => {
      const { token, password } = args;
      return await apiRequest({
        path: "/user/reset-password",
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: { password },
      });
    },
    onSuccess: () => {
      // Invalidate auth queries after successful password reset
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (error) => {
      console.error("Failed to reset password:", error);
    },
  });
}

export function useSignup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: {
      name: string;
      email: string;
      password: string;
    }) => {
      return await Api.post("/user/signup", args);
    },
    onSuccess: () => {
      // Invalidate auth queries after successful signup
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (error) => {
      console.error("Failed to sign up:", error);
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (args: { email: string; password: string }) => {
      return await Api.post<{ token: string }>("/user/login", args);
    },
    onSuccess: (data) => {
      // Set the token in cookie and invalidate auth queries
      if (typeof window !== "undefined" && data?.token) {
        document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days
      }
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (error: any) => {
      const message = error?.message || "Login failed";
      try {
        showToast(message, "error");
      } catch {
        // fallback
        console.error("Failed to login:", error);
      }
    },
  });
}

// Profile-related hooks moved from use-profile.ts
export function useProfileDetail() {
  const token = typeof window !== "undefined" ? getCookie("token") : undefined;

  return useQuery<any>({
    queryKey: authKeys.profile(),
    queryFn: async () => {
      const detailResponse: any = await Api.get("/user/detail");
      return (detailResponse && (detailResponse.data ?? detailResponse)) as any;
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });
}

// Logout mutation hook
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Clear the token cookie
      if (typeof window !== "undefined") {
        deleteCookie("token");
      }
      return true;
    },
    onSuccess: () => {
      // Clear all auth-related queries from cache
      queryClient.removeQueries({ queryKey: authKeys.all });
      queryClient.clear(); // Clear all queries for a complete logout
    },
    onError: (error) => {
      console.error("Failed to logout:", error);
    },
  });
}

// Combined auth hook that provides both auth and profile data
export function useAuthWithProfile() {
  const auth = useAuth();
  const profile = useProfileDetail();

  return {
    ...auth,
    profile: profile.data,
    isProfileLoading: profile.isLoading,
    isProfileError: profile.isError,
    profileError: profile.error,
    refetchProfile: profile.refetch,
  };
}
