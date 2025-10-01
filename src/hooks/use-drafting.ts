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

export type DraftingDetail = DraftingItem & { content?: string; error?: string | null };

export function useDraftingDetail(id?: string | null) {
  return useQuery({
    queryKey: ["drafting-detail", id],
    enabled: !!id,
    queryFn: async (): Promise<DraftingDetail | null> => {
      if (!id) return null;
      const base = getApiBaseUrl();
      const token = getCookie("token") || "";
      const res = await fetch(`${base}/drafting/detail?id=${encodeURIComponent(id)}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { success: boolean; data: DraftingDetail } | DraftingDetail;
      return (json as any)?.data ?? (json as DraftingDetail);
    },
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export type CreateEmptyDraftRequest = {
  name: string;
  workspaceId: string;
};

export type CreateEmptyDraftResponse = {
  success: boolean;
  data: DraftingItem;
};

export function useCreateEmptyDraft(workspaceId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: CreateEmptyDraftRequest): Promise<DraftingItem> => {
      const base = getApiBaseUrl();
      const token = getCookie("token") || "";
      const res = await fetch(`${base}/drafting/empty`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(request),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as CreateEmptyDraftResponse;
      return json.data;
    },
    onSuccess: (newDraft) => {
      // Update the draft list cache with the new draft
      const key = ["drafting", workspaceId];
      queryClient.setQueryData<DraftingItem[]>(key, (old) => {
        const existing = old || [];
        return [newDraft, ...existing];
      });
      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: key });
    },
    onError: (error) => {
      console.error("Error creating empty draft:", error);
    },
  });
}

export type UpdateDraftRequest = {
  id: string;
  name?: string;
  content?: string;
};

export type UpdateDraftResponse = {
  success: boolean;
  data: DraftingItem;
};

export function useUpdateDraft(workspaceId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: UpdateDraftRequest): Promise<DraftingItem> => {
      const base = getApiBaseUrl();
      const token = getCookie("token") || "";
      const res = await fetch(`${base}/drafting?id=${encodeURIComponent(request.id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: request.name,
          content: request.content,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as UpdateDraftResponse;
      return json.data;
    },
    onSuccess: (updatedDraft) => {
      // Update the draft list cache
      const key = ["drafting", workspaceId];
      queryClient.setQueryData<DraftingItem[]>(key, (old) => {
        const existing = old || [];
        return existing.map((draft) =>
          draft.id === updatedDraft.id ? updatedDraft : draft
        );
      });
      // Update the detail cache if it exists
      queryClient.setQueryData(["drafting-detail", updatedDraft.id], updatedDraft);
    },
    onError: (error) => {
      console.error("Error updating draft:", error);
    },
  });
}


