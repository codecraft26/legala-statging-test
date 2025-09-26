import { useState, useCallback } from "react";
import {
  SupremeCourtAPI,
  HighCourtAPI,
  DistrictCourtAPI,
  ResearchAPI,
  handleAPIError,
} from "@/lib/research-api";

export const useResearchAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeAPI = useCallback(async (apiCall: () => Promise<any>) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      handleAPIError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,

    // Supreme Court methods
    searchSupremeCourtByParty: (data: {
      party_type: string;
      party_name: string;
      year: number;
      party_status: string;
    }) => executeAPI(() => SupremeCourtAPI.searchByParty(data)),

    searchSupremeCourtByDiary: (data: { diary_no: number; year: number }) =>
      executeAPI(() => SupremeCourtAPI.searchByDiary(data)),

    getSupremeCourtCaseDetail: (data: {
      diary_no: number;
      diary_year: number;
    }) => executeAPI(() => SupremeCourtAPI.getCaseDetail(data)),

    // High Court methods
    searchHighCourtByAdvocate: (data: {
      court_code: number;
      state_code: number;
      court_complex_code: number;
      advocate_name: string;
      f: "P" | "R" | "Both";
    }) => executeAPI(() => HighCourtAPI.searchByAdvocate(data)),

    searchHighCourtByFilingNumber: (data: {
      court_code: number;
      state_code: number;
      court_complex_code: number;
      case_no: number;
      rgyear: number;
    }) => executeAPI(() => HighCourtAPI.searchByFilingNumber(data)),

    searchHighCourtByParty: (data: {
      court_code: number;
      state_code: number;
      court_complex_code: number;
      petres_name: string;
      rgyear: number;
      f: "BOTH" | "PENDING" | "DISPOSED";
    }) => executeAPI(() => HighCourtAPI.searchByParty(data)),

    getHighCourtCaseDetail: (data: {
      case_no: number;
      state_code: number;
      cino: string;
      court_code: number;
      national_court_code: string;
      dist_cd: number;
    }) => executeAPI(() => HighCourtAPI.getCaseDetail(data)),

    // District Court methods
    searchDistrictCourtByParty: (data: {
      district_name: string;
      litigant_name: string;
      reg_year: number;
      case_status: string;
      est_code: string;
    }) => executeAPI(() => DistrictCourtAPI.searchByParty(data)),

    getDistrictCourtCaseDetail: (data: {
      cino: string;
      district_name: string;
    }) => executeAPI(() => DistrictCourtAPI.getCaseDetail(data)),

    // Research management methods
    followResearch: (data: {
      court: "Supreme_Court" | "High_Court" | "District_Court";
      followed: any;
      workspaceId: string;
    }) => executeAPI(() => ResearchAPI.followResearch(data)),

    unfollowResearch: (id: string) =>
      executeAPI(() => ResearchAPI.unfollowResearch(id)),

    getFollowedResearch: (workspaceId: string, court: string) =>
      executeAPI(() => ResearchAPI.getFollowedResearch(workspaceId, court)),
  };
};
