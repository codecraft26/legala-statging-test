import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditApi, CreditDetail, UpdateCreditPayload } from "@/lib/credit-api";
export type { CreditRenewCycle } from "@/lib/credit-api";

// Query keys for consistent cache management
export const creditKeys = {
  all: ['credit'] as const,
  detail: () => [...creditKeys.all, 'detail'] as const,
  extraction: (ownerId: string) => [...creditKeys.all, 'extraction', ownerId] as const,
  research: (ownerId: string) => [...creditKeys.all, 'research', ownerId] as const,
};

// Hook to fetch credit details
export function useCreditDetail(enabled: boolean = true) {
  return useQuery<CreditDetail | null>({
    queryKey: creditKeys.detail(),
    queryFn: async () => {
      try {
        const data = await CreditApi.getDetail();
        return data || null;
      } catch (error) {
        console.error("Failed to fetch credit detail:", error);
        return null;
      }
    },
    enabled,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

// Hook to update extraction credits
export function useUpdateExtractionCredit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ownerId, payload }: { ownerId: string; payload: UpdateCreditPayload }) => {
      if (!ownerId) throw new Error("ownerId is required");
      return await CreditApi.updateExtraction(ownerId, payload);
    },
    onSuccess: () => {
      // Invalidate and refetch credit detail
      queryClient.invalidateQueries({ queryKey: creditKeys.detail() });
      queryClient.invalidateQueries({ queryKey: creditKeys.extraction('*') });
    },
    onError: (error) => {
      console.error("Failed to update extraction credit:", error);
    },
  });
}

// Hook to update research credits
export function useUpdateResearchCredit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ownerId, payload }: { ownerId: string; payload: UpdateCreditPayload }) => {
      if (!ownerId) throw new Error("ownerId is required");
      return await CreditApi.updateResearch(ownerId, payload);
    },
    onSuccess: () => {
      // Invalidate and refetch credit detail
      queryClient.invalidateQueries({ queryKey: creditKeys.detail() });
      queryClient.invalidateQueries({ queryKey: creditKeys.research('*') });
    },
    onError: (error) => {
      console.error("Failed to update research credit:", error);
    },
  });
}

// Combined hook for all credit operations
export function useCredit() {
  const creditDetail = useCreditDetail();
  const updateExtraction = useUpdateExtractionCredit();
  const updateResearch = useUpdateResearchCredit();

  return {
    // Query state
    detail: creditDetail.data,
    isLoading: creditDetail.isLoading,
    isError: creditDetail.isError,
    error: creditDetail.error,
    
    // Mutations
    updateExtraction: updateExtraction.mutateAsync,
    updateResearch: updateResearch.mutateAsync,
    
    // Mutation states
    isUpdatingExtraction: updateExtraction.isPending,
    isUpdatingResearch: updateResearch.isPending,
    updateExtractionError: updateExtraction.error,
    updateResearchError: updateResearch.error,
    
    // Utilities
    refetch: creditDetail.refetch,
  };
}


