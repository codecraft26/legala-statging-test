"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import {
  useHighByAdvocate,
  useFollowResearch,
  useUnfollowResearch,
  useHighDetail,
  useFollowedResearch,
  researchKeys,
} from "@/hooks/use-research";
import { useQueryClient } from "@tanstack/react-query";
import { getCookie } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  parseHighCourtHtml,
  ParsedHighCourtDetails,
} from "../utils/highCourtParser";
import HighCourtCaseDetailsModal from "./common/HighCourtCaseDetailsModal";
import HighCourtSearchForm from "./common/HighCourtSearchForm";
import HighCourtResultsSection from "./common/HighCourtResultsSection";

interface HighCourtResult {
  orderurlpath?: string;
  cino: string;
  case_no: string;
  case_type: number;
  case_year: number;
  case_no2: number;
  pet_name?: string;
  res_name?: string;
  lpet_name?: string;
  lres_name?: string;
  party_name1?: string;
  party_name2?: string;
  adv_name1?: string;
  adv_name2?: string;
  ladv_name1?: string;
  ladv_name2?: string;
  date_of_decision?: string;
  type_name?: string;
  state_cd?: string;
  court_code?: string;
  details?: any; // For storing detailed case information from API
}

// moved parseHighCourtHtml to ../utils/highCourtParser

// moved to ./common/HighCourtCaseDetailsModal

export default function HighCourtAdvocateSearch() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [advocateName, setAdvocateName] = useState("");
  const [filterType, setFilterType] = useState<"P" | "R" | "Both">("Both");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState<HighCourtResult | null>(null);
  const [showCaseDetails, setShowCaseDetails] = useState(false);
  const [followedCases, setFollowedCases] = useState<Set<string>>(new Set());
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);
  const [loadingFollow, setLoadingFollow] = useState<string | null>(null);
  const [detailParams, setDetailParams] = useState<{
    case_no: number;
    state_code: number;
    cino: string;
    court_code: number;
    national_court_code: string;
    dist_cd: number;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchParams, setSearchParams] = useState<{
    court_code: number;
    state_code: number;
    court_complex_code: number;
    advocate_name: string;
    f: "P" | "R" | "Both";
  } | null>(null);

  const queryClient = useQueryClient();
  const advocateQuery = useHighByAdvocate(searchParams);
  const followMutation = useFollowResearch();
  const unfollowMutation = useUnfollowResearch();
  const followedQuery = useFollowedResearch(workspaceId || "", "High_Court");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setWorkspaceId(getCookie("workspaceId"));
    }
  }, []);

  // Build followed set using cino and reconstructed case_no (TYPE/NO/YEAR)
  React.useEffect(() => {
    const items = (followedQuery.data as any)?.data || followedQuery.data || [];
    if (Array.isArray(items)) {
      const ids = new Set<string>();
      items.forEach((item: any) => {
        const f = item?.followed || {};
        const cino = f.cino || f["cino"] || "";
        if (cino) ids.add(String(cino));
        const type = f.type_name || "";
        const no = f.case_no2 != null ? String(f.case_no2) : "";
        const year = f.case_year != null ? String(f.case_year) : "";
        const composite = type && no && year ? `${type}/${no}/${year}` : "";
        if (composite) ids.add(composite);
      });
      setFollowedCases(ids);
    }
  }, [followedQuery.data]);

  // Helper to check if a row is already followed
  const isRowFollowed = useCallback(
    (r: HighCourtResult): boolean => {
      const byCino = r.cino ? followedCases.has(String(r.cino)) : false;
      const num =
        r.case_no2 != null
          ? String(r.case_no2)
          : r.case_no
            ? String(parseInt(r.case_no))
            : "";
      const composite =
        r.type_name && num && r.case_year != null
          ? `${r.type_name}/${num}/${r.case_year}`
          : "";
      const byComposite = composite ? followedCases.has(composite) : false;
      return byCino || byComposite;
    },
    [followedCases]
  );

  // Filter search results based on searchQuery
  const rawResults: HighCourtResult[] = useMemo(() => {
    const d: any = advocateQuery.data as any;
    if (Array.isArray(d)) return d as HighCourtResult[];
    if (Array.isArray(d?.results)) return d.results as HighCourtResult[];
    if (Array.isArray(d?.data)) return d.data as HighCourtResult[];
    if (Array.isArray(d?.cases)) return d.cases as HighCourtResult[];
    return [];
  }, [advocateQuery.data]);

  const filteredResults = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return rawResults;
    return rawResults.filter((result: HighCourtResult) =>
      Object.values(result).some((value: any) =>
        String(value).toLowerCase().includes(q)
      )
    );
  }, [rawResults, searchQuery]);

  // Pagination calculations
  const total = filteredResults.length;
  const { totalPages, currentPageResults } = useMemo(() => {
    const totalPagesCalc = Math.max(1, Math.ceil(total / pageSize));
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, total);
    return {
      totalPages: totalPagesCalc,
      currentPageResults: filteredResults.slice(startIndex, endIndex),
    };
  }, [filteredResults, page, pageSize, total]);

  // Reset page when results change
  React.useEffect(() => {
    setPage(1);
  }, [advocateQuery.isFetching, searchQuery, searchParams]);

  const handleFormSubmit = useCallback(
    (params: {
      courtCode: number;
      stateCode: number;
      courtComplexCode: number;
      selectedCourt: string;
      selectedBench: string;
    }) => {
      if (!advocateName.trim()) return;

      const nextParams = {
        court_code: params.courtCode,
        state_code: params.stateCode,
        court_complex_code: params.courtComplexCode,
        advocate_name: advocateName.trim(),
        f: filterType,
      } as const;

      setSearchParams(nextParams as any);
      // Force refetch even if searching the same inputs again
      queryClient.invalidateQueries({
        queryKey: researchKeys.list(researchKeys.high(), nextParams),
      });
    },
    [advocateName, filterType, queryClient]
  );

  const detailQuery = useHighDetail(detailParams);

  React.useEffect(() => {
    if (!detailParams) return;
    if (detailQuery.isLoading || detailQuery.isFetching) return;
    const caseId = String(detailParams.cino || detailParams.case_no);
    if (detailQuery.error) {
      console.error("Failed to fetch case details:", detailQuery.error);
      setLoadingDetails(null);
      return;
    }
    const raw: any = detailQuery.data;
    if (!raw) return;
    const normalized =
      typeof raw?.data === "string"
        ? parseHighCourtHtml(raw.data)
        : typeof raw === "string"
          ? parseHighCourtHtml(raw)
          : raw;
    setSelectedCase({
      ...(currentPageResults.find(
        (r) => String(r.cino || r.case_no) === caseId
      ) || ({} as any)),
      details: normalized,
    } as any);
    setShowCaseDetails(true);
    setLoadingDetails(null);
  }, [
    detailQuery.data,
    detailQuery.error,
    detailQuery.isLoading,
    detailQuery.isFetching,
    detailParams,
    currentPageResults,
  ]);

  const handleViewDetails = useCallback((result: HighCourtResult) => {
    const caseId = result.cino || result.case_no;
    setLoadingDetails(caseId);
    // Build formatted case number: YYYY + SS + CCCCCCCC + YYYY
    const year =
      Number(result.case_year) ||
      Number((result as any).fil_year) ||
      new Date().getFullYear();
    const state = Number(result.state_cd) || 26;
    const rawNo =
      result.case_no2 != null
        ? Number(result.case_no2)
        : (result as any).fil_no != null
          ? Number((result as any).fil_no)
          : result.case_no
            ? Number(result.case_no)
            : 0;
    const formattedCaseNo = result.case_no
      ? Number(result.case_no)
      : Number(
          `${year}${String(state).padStart(2, "0")}${String(rawNo || 0).padStart(8, "0")}${year}`
        );
    const natCode = (result.cino && result.cino.substring(0, 6)) || "DLHC01";
    setDetailParams({
      case_no: formattedCaseNo,
      state_code: state,
      cino: result.cino,
      court_code: Number(result.court_code) || 1,
      national_court_code: natCode,
      dist_cd: 1,
    });
  }, []);

  // TanStack Query mutations for follow/unfollow
  // (defined above)

  const handleFollowCase = useCallback(
    (caseData: HighCourtResult) => {
      const caseId = caseData.cino || caseData.case_no;
      const workspaceId = getCookie("workspaceId");

      if (!workspaceId) {
        alert("Please select a workspace to follow cases");
        return;
      }

      if (isRowFollowed(caseData)) {
        return;
      } else {
        // Set loading state for this specific case
        setLoadingFollow(caseId);
        
        // Send the entire row as the followed payload (preserve all fields)
        const followedData = { ...caseData } as any;

        followMutation.mutate(
          {
            court: "High_Court",
            followed: followedData,
            workspaceId: workspaceId,
          },
          {
            onSuccess: () => {
              // Clear loading state
              setLoadingFollow(null);
            },
            onError: (error) => {
              console.error("Failed to follow case:", error);
              // Clear loading state on error
              setLoadingFollow(null);
            },
          }
        );
      }
    },
    [followMutation, isRowFollowed]
  );

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground">
        High Court Cases by Advocate Name
      </h2>

      {/* Search Form */}
      <HighCourtSearchForm
        title="Search by Advocate Name"
        onSubmit={handleFormSubmit}
        isLoading={advocateQuery.isLoading || advocateQuery.isFetching}
      >
        {/* Advocate Name */}
        <div className="space-y-2">
          <Label htmlFor="advocate-name">Advocate Name</Label>
          <Input
            id="advocate-name"
            type="text"
            value={advocateName}
            onChange={(e) => setAdvocateName(e.target.value)}
            placeholder="Enter advocate name"
            required
          />
        </div>

        {/* Filter Type */}
        <div className="space-y-2">
          <Label htmlFor="filter-type">Filter Type</Label>
          <select
            id="filter-type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as "P" | "R" | "Both")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="Both">Both</option>
            <option value="P">Petitioner</option>
            <option value="R">Respondent</option>
          </select>
        </div>
      </HighCourtSearchForm>

      {/* Error Display */}
      {advocateQuery.error && (
        <Alert variant="destructive">
          <AlertDescription>
            <strong>Search Error:</strong>{" "}
            {advocateQuery.error instanceof Error
              ? advocateQuery.error.message
              : "An error occurred while searching"}
          </AlertDescription>
        </Alert>
      )}

      {/* Results Section */}
      <HighCourtResultsSection
        results={rawResults}
        filteredResults={filteredResults}
        currentPageResults={currentPageResults}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(newPageSize) => {
          setPageSize(newPageSize);
          setPage(1);
        }}
        isRowFollowed={isRowFollowed}
        loadingDetailsId={loadingDetails}
        onViewDetails={handleViewDetails}
        onFollow={handleFollowCase}
        followLoading={loadingFollow}
        isLoading={advocateQuery.isLoading || advocateQuery.isFetching}
        error={advocateQuery.error}
        searchParams={searchParams}
        searchType="advocate"
      />

      {/* Case Details Modal */}
      {showCaseDetails && (
        <HighCourtCaseDetailsModal
          caseData={selectedCase}
          onClose={() => {
            setShowCaseDetails(false);
            setSelectedCase(null);
          }}
          followedCases={followedCases}
          handleFollowCase={handleFollowCase}
          followMutation={followMutation}
          unfollowMutation={unfollowMutation}
        />
      )}
    </div>
  );
}
