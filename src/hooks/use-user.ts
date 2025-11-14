"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Api } from "@/lib/api-client";

// Query keys
export const userKeys = {
  all: ["users"] as const,
  members: () => [...userKeys.all, "members"] as const,
  member: (id: string) => [...userKeys.all, "member", id] as const,
};

export interface Member {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  ownerId?: string;
}

export interface UpdateUserRoleRequest {
  userId: string;
  role: "Owner" | "Admin" | "Member";
}

export interface UpdateUserRoleResponse {
  success: boolean;
  data: Member;
}

// Get all members (for owner)
export function useMembers() {
  return useQuery({
    queryKey: userKeys.members(),
    queryFn: async () => {
      const res = await Api.get<any>("/user/owner/members", "no-store");
      const list: Member[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];
      return list;
    },
  });
}

// Update user role mutation
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateUserRoleRequest): Promise<UpdateUserRoleResponse> => {
      const response = await Api.patch<UpdateUserRoleResponse>(
        `/user/role?userId=${encodeURIComponent(data.userId)}`,
        {
          userId: data.userId,
          role: data.role,
        }
      );
      
      // Handle different response formats
      if (response?.success && response?.data) {
        return response;
      }
      // If response is the data directly
      if (response && typeof response === "object" && "id" in response) {
        return {
          success: true,
          data: response as Member,
        };
      }
      throw new Error("Invalid response format");
    },
    onSuccess: (data, variables) => {
      // Invalidate members list to refetch
      queryClient.invalidateQueries({
        queryKey: userKeys.members(),
      });
      
      // Update the specific member in cache if it exists
      queryClient.setQueryData(userKeys.member(variables.userId), {
        data: data.data,
      });
    },
  });
}

// Remove member mutation
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string): Promise<void> => {
      await Api.delete(`/user/remove?userId=${encodeURIComponent(userId)}`);
    },
    onSuccess: (_, userId) => {
      // Invalidate members list to refetch
      queryClient.invalidateQueries({
        queryKey: userKeys.members(),
      });
      
      // Remove the member from cache
      queryClient.removeQueries({
        queryKey: userKeys.member(userId),
      });
    },
  });
}

