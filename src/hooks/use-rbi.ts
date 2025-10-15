"use client";

import { useQuery } from "@tanstack/react-query";
import { RBIAPI } from "@/lib/research-api";

export type RBICategory =
  | "Financial Market"
  | "Foreign Exchange Management"
  | "Commercial Banking"
  | "Financial Inclusion and Development"
  | "Banker and Debt Manager to Government"
  | "Co-operative Banking"
  | "Consumer Education and Protection"
  | "Issuer of Currency"
  | "Non-banking"
  | "Payment and Settlement System"
  | "ALL";

export function useRBIRepo(category: RBICategory) {
  return useQuery({
    queryKey: ["rbi-repo", category],
    queryFn: async () => RBIAPI.fetchRepo(category),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useRBIUpdates() {
  return useQuery({
    queryKey: ["rbi-updates"],
    queryFn: async () => RBIAPI.fetchUpdates(),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: false, // opt-in when opening the panel
  });
}


