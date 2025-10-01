"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiBaseUrl, getCookie } from "@/lib/utils";

export type DraftingItem = {
  id: string;
  name: string;
  instruction: string;
  usage: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: string;
  updatedAt: string;
  user?: { name?: string; email?: string; role?: string };
};

export type DraftingListResponse = {
  success: boolean;
  data: DraftingItem[];
};

export function useDraftingList(workspaceId?: string | null) {
  return useQuery({
    queryKey: ["drafting", workspaceId],
    enabled: !!workspaceId,
    queryFn: async (): Promise<DraftingItem[]> => {
      const base = getApiBaseUrl();
      const token = getCookie("token") || "";
      const res = await fetch(`${base}/drafting?workspaceId=${workspaceId}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as DraftingListResponse | DraftingItem[];
      if (Array.isArray(json)) return json;
      return json.data || [];
    },
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useDeleteDrafting(workspaceId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const base = getApiBaseUrl();
      const token = getCookie("token") || "";
      const res = await fetch(`${base}/drafting?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return id;
    },
    onMutate: async (id: string) => {
      const key = ["drafting", workspaceId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<DraftingItem[]>(key) || [];
      queryClient.setQueryData<DraftingItem[]>(key, (old) =>
        (old || []).filter((it) => it.id !== id)
      );
      return { previous } as { previous: DraftingItem[] };
    },
    onError: (_err, _id, context) => {
      const key = ["drafting", workspaceId];
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["drafting", workspaceId] });
    },
  });
}


