"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  SupremeCourtAPI,
  HighCourtAPI,
  DistrictCourtAPI,
  ResearchAPI,
} from "@/lib/research-api";

export const researchKeys = {
  all: ["research"] as const,
  supreme: () => [...researchKeys.all, "supreme"] as const,
  high: () => [...researchKeys.all, "high"] as const,
  district: () => [...researchKeys.all, "district"] as const,
  list: (scope: readonly unknown[], params: unknown) =>
    [...scope, "list", params] as const,
  detail: (scope: readonly unknown[], id: unknown) =>
    [...scope, "detail", id] as const,
  followed: (workspaceId: string, court: string) =>
    [...researchKeys.all, "followed", workspaceId, court] as const,
};

export function useSupremeByParty(params: {
  party_type: string;
  party_name: string;
  year: number;
  party_status: string;
} | null) {
  return useQuery({
    queryKey: researchKeys.list(researchKeys.supreme(), params),
    queryFn: () => SupremeCourtAPI.searchByParty(params!),
    enabled: !!params,
  });
}

export function useSupremeDetail(params: {
  diary_no: number;
  diary_year: number;
} | null) {
  return useQuery({
    queryKey: researchKeys.detail(
      researchKeys.supreme(),
      params ? `${params.diary_no}/${params.diary_year}` : ""
    ),
    queryFn: () => SupremeCourtAPI.getCaseDetail(params!),
    enabled: !!params,
  });
}

export function useHighByAdvocate(params: {
  court_code: number;
  state_code: number;
  court_complex_code: number;
  advocate_name: string;
  f: "P" | "R" | "Both";
} | null) {
  return useQuery({
    queryKey: researchKeys.list(researchKeys.high(), params),
    queryFn: () => HighCourtAPI.searchByAdvocate(params!),
    enabled: !!params,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useHighByParty(params: {
  court_code: number;
  state_code: number;
  court_complex_code: number;
  petres_name: string;
  rgyear: number;
  f: "BOTH" | "PENDING" | "DISPOSED";
} | null) {
  return useQuery({
    queryKey: researchKeys.list(researchKeys.high(), params),
    queryFn: () => HighCourtAPI.searchByParty(params!),
    enabled: !!params,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useHighByFilingNumber(params: {
  court_code: number;
  state_code: number;
  court_complex_code: number;
  case_no: number;
  rgyear: number;
} | null) {
  return useQuery({
    queryKey: researchKeys.list(researchKeys.high(), params),
    queryFn: () => HighCourtAPI.searchByFilingNumber(params!),
    enabled: !!params,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useHighDetail(params: {
  case_no: number;
  state_code: number;
  cino: string;
  court_code: number;
  national_court_code: string;
  dist_cd: number;
} | null) {
  return useQuery({
    queryKey: researchKeys.detail(
      researchKeys.high(),
      params ? `${params.case_no}-${params.cino}` : ""
    ),
    queryFn: () => HighCourtAPI.getCaseDetail(params!),
    enabled: !!params,
  });
}

export function useDistrictByParty(params: {
  district_name: string;
  litigant_name: string;
  reg_year: number;
  case_status: string;
  est_code: string;
} | null) {
  return useQuery({
    queryKey: researchKeys.list(researchKeys.district(), params),
    queryFn: () => DistrictCourtAPI.searchByParty(params!),
    enabled: !!params,
  });
}

export function useDistrictDetail(params: {
  cino: string;
  district_name: string;
} | null) {
  return useQuery({
    queryKey: researchKeys.detail(
      researchKeys.district(),
      params ? `${params.cino}-${params.district_name}` : ""
    ),
    queryFn: () => DistrictCourtAPI.getCaseDetail(params!),
    enabled: !!params,
  });
}

export function useFollowResearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      court: "Supreme_Court" | "High_Court" | "District_Court";
      followed: any;
      workspaceId: string;
    }) => ResearchAPI.followResearch(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: researchKeys.followed(variables.workspaceId, variables.court),
      });
    },
  });
}

export function useUnfollowResearch(workspaceId?: string, court?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ResearchAPI.unfollowResearch(id),
    onSuccess: () => {
      if (workspaceId && court) {
        queryClient.invalidateQueries({
          queryKey: researchKeys.followed(workspaceId, court),
        });
      }
    },
  });
}

export function useFollowedResearch(workspaceId: string, court: string) {
  return useQuery({
    queryKey: researchKeys.followed(workspaceId, court),
    queryFn: () => ResearchAPI.getFollowedResearch(workspaceId, court),
    enabled: !!workspaceId && !!court,
  });
}

// Backwards-compat shim for legacy code using useResearchAPI
export function useResearchAPI() {
  return {
    loading: false as boolean,
    error: null as string | null,

    // Supreme Court
    searchSupremeCourtByParty: (data: {
      party_type: string;
      party_name: string;
      year: number;
      party_status: string;
    }) => SupremeCourtAPI.searchByParty(data),
    searchSupremeCourtByDiary: (data: { diary_no: number; year: number }) =>
      SupremeCourtAPI.searchByDiary(data),
    getSupremeCourtCaseDetail: (data: {
      diary_no: number;
      diary_year: number;
    }) => SupremeCourtAPI.getCaseDetail(data),

    // High Court
    searchHighCourtByAdvocate: (data: {
      court_code: number;
      state_code: number;
      court_complex_code: number;
      advocate_name: string;
      f: "P" | "R" | "Both";
    }) => HighCourtAPI.searchByAdvocate(data),
    searchHighCourtByFilingNumber: (data: {
      court_code: number;
      state_code: number;
      court_complex_code: number;
      case_no: number;
      rgyear: number;
    }) => HighCourtAPI.searchByFilingNumber(data),
    searchHighCourtByParty: (data: {
      court_code: number;
      state_code: number;
      court_complex_code: number;
      petres_name: string;
      rgyear: number;
      f: "BOTH" | "PENDING" | "DISPOSED";
    }) => HighCourtAPI.searchByParty(data),
    getHighCourtCaseDetail: (data: {
      case_no: number;
      state_code: number;
      cino: string;
      court_code: number;
      national_court_code: string;
      dist_cd: number;
    }) => HighCourtAPI.getCaseDetail(data),

    // District Court
    searchDistrictCourtByParty: (data: {
      district_name: string;
      litigant_name: string;
      reg_year: number;
      case_status: string;
      est_code: string;
    }) => DistrictCourtAPI.searchByParty(data),
    getDistrictCourtCaseDetail: (data: {
      cino: string;
      district_name: string;
    }) => DistrictCourtAPI.getCaseDetail(data),

    // Follow / Unfollow
    followResearch: (data: {
      court: "Supreme_Court" | "High_Court" | "District_Court";
      followed: any;
      workspaceId: string;
    }) => ResearchAPI.followResearch(data),
    unfollowResearch: (id: string) => ResearchAPI.unfollowResearch(id),
  };
}
