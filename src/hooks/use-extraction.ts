"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  extractionApi,
  CreateExtractionFilesRequest,
  CreateExtractionDocumentsRequest,
} from "@/lib/extraction-api";

// Query keys
export const extractionKeys = {
  all: ["extractions"] as const,
  lists: () => [...extractionKeys.all, "list"] as const,
  list: (workspaceId: string) =>
    [...extractionKeys.lists(), workspaceId] as const,
  details: () => [...extractionKeys.all, "detail"] as const,
  detail: (id: string) => [...extractionKeys.details(), id] as const,
  results: () => [...extractionKeys.all, "result"] as const,
  result: (id: string) => [...extractionKeys.results(), id] as const,
};

// Get all extractions for a workspace
export function useExtractions(workspaceId: string | undefined) {
  return useQuery({
    queryKey: extractionKeys.list(workspaceId || ""),
    queryFn: () => extractionApi.getExtractions(workspaceId!),
    enabled: !!workspaceId,
    select: (data) => data.data,
  });
}

// Get extraction detail
export function useExtractionDetail(id: string | undefined) {
  return useQuery({
    queryKey: extractionKeys.detail(id || ""),
    queryFn: () => extractionApi.getExtractionDetail(id!),
    enabled: !!id,
    select: (data) => data.data,
  });
}

// Get extraction result detail
export function useExtractionResultDetail(id: string | undefined) {
  return useQuery({
    queryKey: extractionKeys.result(id || ""),
    queryFn: () => extractionApi.getExtractionResultDetail(id!),
    enabled: !!id,
    select: (data) => data.data,
  });
}

// Create extraction from files
export function useCreateExtractionFiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExtractionFilesRequest) =>
      extractionApi.extractFiles(data),
    onSuccess: (data, variables) => {
      // Invalidate the extractions list for this workspace
      queryClient.invalidateQueries({
        queryKey: extractionKeys.list(variables.workspaceId),
      });

      // Add the new extraction to the cache
      queryClient.setQueryData(extractionKeys.detail(data.data.id), {
        data: data.data,
      });
    },
  });
}

// Create extraction from documents
export function useCreateExtractionDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExtractionDocumentsRequest) =>
      extractionApi.extractDocuments(data),
    onSuccess: (data, variables) => {
      // Invalidate the extractions list for this workspace
      queryClient.invalidateQueries({
        queryKey: extractionKeys.list(variables.workspaceId),
      });

      // Add the new extraction to the cache
      queryClient.setQueryData(extractionKeys.detail(data.data.id), {
        data: data.data,
      });
    },
  });
}

// Remove extraction agent
export function useRemoveExtractionAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => extractionApi.removeExtractionAgent(id),
    onSuccess: (data, id) => {
      // Remove from all relevant queries
      queryClient.removeQueries({
        queryKey: extractionKeys.detail(id),
      });

      // Invalidate lists to refresh them
      queryClient.invalidateQueries({
        queryKey: extractionKeys.lists(),
      });
    },
  });
}

// Remove extraction result
export function useRemoveExtractionResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => extractionApi.removeExtractionResult(id),
    onSuccess: (data, id) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: extractionKeys.result(id),
      });

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: extractionKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: extractionKeys.details(),
      });
    },
  });
}

// Poll extraction status (for pending/processing extractions)
export function useExtractionPolling(
  id: string | undefined,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: extractionKeys.detail(id || ""),
    queryFn: () => extractionApi.getExtractionDetail(id!),
    enabled: !!id && enabled,
    refetchInterval: (query) => {
      // Poll every 2 seconds if status is PENDING or PROCESSING
      const status = query.state.data?.data?.status;
      return status === "PENDING" || status === "PROCESSING" ? 2000 : false;
    },
    select: (data) => data.data,
  });
}
