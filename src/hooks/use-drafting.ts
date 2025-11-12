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

export type DraftingDetail = DraftingItem & {
  content?: string;
  error?: string | null;
};

export function useDraftingDetail(id?: string | null) {
  return useQuery({
    queryKey: ["drafting-detail", id],
    enabled: !!id,
    queryFn: async (): Promise<DraftingDetail | null> => {
      if (!id) return null;
      const base = getApiBaseUrl();
      const token = getCookie("token") || "";
      const res = await fetch(
        `${base}/drafting/detail?id=${encodeURIComponent(id)}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: "no-store",
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as
        | { success: boolean; data: DraftingDetail }
        | DraftingDetail;
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
    mutationFn: async (
      request: CreateEmptyDraftRequest
    ): Promise<DraftingItem> => {
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
      const res = await fetch(
        `${base}/drafting?id=${encodeURIComponent(request.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            name: request.name,
            content: request.content,
          }),
        }
      );
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
      queryClient.setQueryData(
        ["drafting-detail", updatedDraft.id],
        updatedDraft
      );
    },
    onError: (error) => {
      console.error("Error updating draft:", error);
    },
  });
}

// Create draft from documents (Ask AI flow)
export type DraftFromDocumentsRequest = {
  documentId?: string[];
  draftIds?: string[];
  instruction: string;
  workspaceId: string;
  name?: string;
};

export type DraftFromDocumentsResponse = {
  success?: boolean;
  data: DraftingItem;
} | DraftingItem;

export function useDraftFromDocuments(workspaceId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      request: DraftFromDocumentsRequest
    ): Promise<DraftingItem> => {
      const base = getApiBaseUrl();
      const token = getCookie("token") || "";
      const payload: Record<string, unknown> = {
        instruction: request.instruction,
        workspaceId: request.workspaceId,
      };
      if (request.name?.trim()) {
        payload.name = request.name.trim();
      }
      if (request.documentId?.length) {
        payload.documentId = request.documentId;
      }
      if (request.draftIds?.length) {
        payload.draftIds = request.draftIds;
      }

      const res = await fetch(`${base}/drafting`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as DraftFromDocumentsResponse;
      const item = (json as any)?.data ?? (json as DraftingItem);
      return item as DraftingItem;
    },
    onSuccess: () => {
      if (workspaceId) {
        queryClient.invalidateQueries({ queryKey: ["drafting", workspaceId] });
      }
    },
  });
}

// Helper to fetch a draft detail via query client (imperative usage)
export async function fetchDraftingDetailViaClient(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string
): Promise<DraftingDetail | null> {
  return await queryClient.fetchQuery({
    queryKey: ["drafting-detail", id],
    queryFn: async (): Promise<DraftingDetail | null> => {
      if (!id) return null;
      const base = getApiBaseUrl();
      const token = getCookie("token") || "";
      const res = await fetch(`${base}/drafting/detail?id=${encodeURIComponent(id)}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: "no-store",
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as
        | { success: boolean; data: DraftingDetail }
        | DraftingDetail;
      return (json as any)?.data ?? (json as DraftingDetail);
    },
  });
}

// Drafting Instructions (for AskAI section slash commands)
export type DraftingInstruction = {
  id: string;
  instruction: string;
};

export type DraftingInstructionListResponse = {
  success: boolean;
  data: DraftingInstruction[];
};

export type CreateDraftingInstructionRequest = {
  instruction: string;
  workspaceId: string;
};

export type CreateDraftingInstructionResponse = {
  success: boolean;
  data: DraftingInstruction;
};

export function useDraftingInstructions(workspaceId?: string | null) {
  return useQuery({
    queryKey: ["drafting-instructions", workspaceId],
    enabled: !!workspaceId,
    queryFn: async (): Promise<DraftingInstruction[]> => {
      const base = getApiBaseUrl();
      const token = getCookie("token") || "";
      const res = await fetch(
        `${base}/drafting/instruction?workspaceId=${encodeURIComponent(workspaceId!)}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: "no-store",
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as DraftingInstructionListResponse;
      return json.data || [];
    },
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useCreateDraftingInstruction(workspaceId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      request: CreateDraftingInstructionRequest
    ): Promise<DraftingInstruction> => {
      const base = getApiBaseUrl();
      const token = getCookie("token") || "";
      const res = await fetch(`${base}/drafting/instruction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(request),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as CreateDraftingInstructionResponse;
      return json.data;
    },
    onSuccess: () => {
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: ["drafting-instructions", workspaceId],
        });
      }
    },
    onError: (error) => {
      console.error("Error creating drafting instruction:", error);
    },
  });
}

export function useDeleteDraftingInstruction(workspaceId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const base = getApiBaseUrl();
      const token = getCookie("token") || "";
      const res = await fetch(
        `${base}/drafting/instruction?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return id;
    },
    onMutate: async (id: string) => {
      const key = ["drafting-instructions", workspaceId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<DraftingInstruction[]>(key) || [];
      queryClient.setQueryData<DraftingInstruction[]>(key, (old) =>
        (old || []).filter((it) => it.id !== id)
      );
      return { previous } as { previous: DraftingInstruction[] };
    },
    onError: (_err, _id, context) => {
      const key = ["drafting-instructions", workspaceId];
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["drafting-instructions", workspaceId],
      });
    },
  });
}
