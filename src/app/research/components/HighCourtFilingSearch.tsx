"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import {
  useHighByFilingNumber,
  useFollowResearch,
  useUnfollowResearch,
  useHighDetail,
  useFollowedResearch,
} from "@/hooks/use-research";
import { getCookie } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import HighCourtCaseDetailsModal from "./common/HighCourtCaseDetailsModal";
import HighCourtSearchForm from "./common/HighCourtSearchForm";
import HighCourtResultsSection from "./common/HighCourtResultsSection";
import { parseHighCourtHtml } from "../utils/highCourtParser";

interface HighCourtResult {
  orderurlpath?: string;
  case_no: string;
  pet_name?: string;
  filing_no?: string;
  res_name?: string;
  lpet_name?: string;
  lres_name?: string;
  cino: string;
  party_name1?: string;
  party_name2?: string;
  fil_year?: string;
  fil_no?: string;
  type_name?: string;
  state_cd?: string;
  court_code?: string;
  details?: any; // For storing detailed case information from API
}

interface CaseDetails {
  [key: string]: any;
}

// Case Details Modal moved to shared component

export default function HighCourtFilingSearch() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [caseNo, setCaseNo] = useState("");
  const [rgYear, setRgYear] = useState(new Date().getFullYear().toString());
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
    case_no: number;
    rgyear: number;
  } | null>(null);

  const filingQuery = useHighByFilingNumber(searchParams);
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

  // Helper to check if a result row is already followed
  const isRowFollowed = (r: HighCourtResult): boolean => {
    const byCino = r.cino ? followedCases.has(String(r.cino)) : false;
    const num = r.fil_no || (r.case_no ? String(parseInt(r.case_no)) : "");
    const composite =
      r.type_name && num && r.fil_year
        ? `${r.type_name}/${num}/${r.fil_year}`
        : "";
    const byComposite = composite ? followedCases.has(composite) : false;
    return byCino || byComposite;
  };

  const rawResults: HighCourtResult[] = Array.isArray(filingQuery.data)
    ? (filingQuery.data as HighCourtResult[])
    : Array.isArray((filingQuery.data as any)?.results)
      ? ((filingQuery.data as any).results as HighCourtResult[])
      : Array.isArray((filingQuery.data as any)?.data)
        ? ((filingQuery.data as any).data as HighCourtResult[])
        : Array.isArray((filingQuery.data as any)?.cases)
          ? ((filingQuery.data as any).cases as HighCourtResult[])
          : [];

  // Filter search results based on searchQuery
  const filteredResults = rawResults.filter((result: HighCourtResult) =>
    Object.values(result).some((value: any) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Pagination
  const total = filteredResults.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const currentPageResults = React.useMemo(
    () => filteredResults.slice(startIndex, endIndex),
    [filteredResults, startIndex, endIndex]
  );

  React.useEffect(() => {
    setPage(1);
  }, [filingQuery.isFetching, searchQuery, searchParams]);

  const handleFormSubmit = useCallback(
    (params: {
      courtCode: number;
      stateCode: number;
      courtComplexCode: number;
      selectedCourt: string;
      selectedBench: string;
    }) => {
      if (!caseNo.trim()) return;

      const nextParams = {
        court_code: params.courtCode,
        state_code: params.stateCode,
        court_complex_code: params.courtComplexCode,
        case_no: parseInt(caseNo),
        rgyear: parseInt(rgYear),
      } as const;

      // If the params did not change, force a refetch so the Search button works repeatedly
      if (
        searchParams &&
        JSON.stringify(searchParams) === JSON.stringify(nextParams)
      ) {
        filingQuery.refetch();
      } else {
        setSearchParams({ ...nextParams });
      }
    },
    [caseNo, rgYear, searchParams, filingQuery]
  );

  const detailQuery = useHighDetail(detailParams);
  const lastProcessedCaseRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!detailParams) return;
    if (detailQuery.isLoading || detailQuery.isFetching) return;
    const caseId = String(detailParams.cino || detailParams.case_no);
    if (lastProcessedCaseRef.current === caseId) return;
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
    const baseCase = currentPageResults.find(
      (r) => String(r.cino || r.case_no) === caseId
    );
    if (!baseCase) {
      // If the case is no longer in the current page, just attach identifiers
      setSelectedCase({
        cino: String(detailParams.cino || ""),
        case_no: String(detailParams.case_no || ""),
        details: normalized,
      } as any);
    } else {
      setSelectedCase({ ...(baseCase as any), details: normalized } as any);
    }
    setShowCaseDetails(true);
    lastProcessedCaseRef.current = caseId;
    setLoadingDetails(null);
  }, [
    detailQuery.data,
    detailQuery.error,
    detailParams,
    currentPageResults,
    detailQuery.isFetching,
    detailQuery.isLoading,
  ]);

  const handleViewDetails = useCallback((result: HighCourtResult) => {
    const caseId = result.cino || result.case_no;

    // If user clicks the same case again and we already processed it, just reopen without refetch
    if (lastProcessedCaseRef.current === String(caseId) && selectedCase) {
      setShowCaseDetails(true);
      setLoadingDetails(null);
      return;
    }

    setLoadingDetails(caseId);
    // Build formatted case number: prefer existing case_no else YYYY + SS + CCCCCCCC + YYYY
    const year =
      Number((result as any).case_year) ||
      Number(result.fil_year) ||
      new Date().getFullYear();
    const state = Number(result.state_cd) || 26;
    const rawNo =
      (result as any).fil_no != null
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
  // (already declared above)

  const handleFollowCase = (caseData: HighCourtResult) => {
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
  };

  // Generate years for dropdown (last 30 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) =>
    (currentYear - i).toString()
  );

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground">
        High Court Cases by Filing Number
      </h2>

      {/* Search Form */}
      <HighCourtSearchForm
        title="Search by Filing Number"
        onSubmit={handleFormSubmit}
        isLoading={filingQuery.isLoading || filingQuery.isFetching}
      >
        {/* Case Number */}
        <div className="space-y-2">
          <Label htmlFor="case-number">Case Number</Label>
          <Input
            id="case-number"
            type="number"
            value={caseNo}
            onChange={(e) => setCaseNo(e.target.value)}
            placeholder="5293619"
            required
          />
          <div className="text-sm text-muted-foreground">
            Example: 5293619
          </div>
        </div>

        {/* Registration Year */}
        <div className="space-y-2">
          <Label htmlFor="registration-year">Registration Year</Label>
          <select
            id="registration-year"
            value={rgYear}
            onChange={(e) => setRgYear(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </HighCourtSearchForm>

      {/* Error Display */}
      {filingQuery.error && (
        <Alert variant="destructive">
          <AlertDescription>
            <strong>Search Error:</strong>{" "}
            {filingQuery.error instanceof Error
              ? filingQuery.error.message
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
        isLoading={filingQuery.isLoading || filingQuery.isFetching}
        error={filingQuery.error}
        searchParams={searchParams}
        searchType="filing"
      />

      {/* Case Details Modal */}
      {showCaseDetails && (
        <HighCourtCaseDetailsModal
          caseData={selectedCase as any}
          onClose={() => {
            setShowCaseDetails(false);
            setSelectedCase(null);
            // Clear params to prevent the effect from reopening the modal immediately
            setDetailParams(null);
            // Allow the same case to be opened again cleanly
            lastProcessedCaseRef.current = null;
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
