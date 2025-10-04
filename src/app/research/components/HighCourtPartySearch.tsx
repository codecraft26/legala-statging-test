"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCookie } from "@/lib/utils";
import { HighCourtAPI } from "@/lib/research-api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import HighCourtCaseDetailsModal from "./common/HighCourtCaseDetailsModal";
import { parseHighCourtHtml, ParsedHighCourtDetails } from "../utils/highCourtParser";
import { useFollowResearch, useUnfollowResearch, useFollowedResearch, useHighCaseStatusByParty } from "@/hooks/use-research";
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
  details?: ParsedHighCourtDetails | any;
}

interface CaseDetails {
  [key: string]: any;
}

export default function HighCourtPartySearch() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [partyName, setPartyName] = useState("");
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
    court_code: string;
    state_code: string;
    court_complex_code: string;
    petres_name: string;
    rgyear: string;
  } | null>(null);
  const queryClient = useQueryClient();

  // Queries
  const partyQuery = useHighCaseStatusByParty(searchParams);

  const detailQuery = useQuery({
    queryKey: ["highCourtDetail", detailParams],
    queryFn: () => HighCourtAPI.getCaseDetail({
      case_no: detailParams!.case_no,
      state_code: detailParams!.state_code,
      dist_cd: detailParams!.dist_cd,
      court_code: detailParams!.court_code,
      national_court_code: detailParams!.national_court_code,
      cino: detailParams!.cino,
    }),
    enabled: !!detailParams,
  });

  const followMutation = useFollowResearch();
  const unfollowMutation = useUnfollowResearch();
  const followedQuery = useFollowedResearch(workspaceId || "", "High_Court");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWorkspaceId(getCookie("workspaceId"));
    }
  }, []);

  // Build followed set using cino and composite keys (same as advocate search)
  useEffect(() => {
    if (followedQuery.data?.success) {
      // Handle different possible response structures
      const cases = followedQuery.data.cases || followedQuery.data.data || followedQuery.data;
      
      if (Array.isArray(cases)) {
        const ids = new Set<string>();
        cases.forEach((item: any) => {
          const f = item?.followed || item?.case_data || item || {};
          // Add CINO if available
          const cino = f.cino || f["cino"] || f.cnr || "";
          if (cino) ids.add(String(cino));
          
          // Add composite key: type_name/case_no2/case_year
          const type = f.type_name || "";
          const no = f.case_no2 != null ? String(f.case_no2) : "";
          const year = f.case_year != null ? String(f.case_year) : "";
          const composite = type && no && year ? `${type}/${no}/${year}` : "";
          if (composite) ids.add(composite);
        });
        
        
        setFollowedCases(ids);
      } else {
        // If success but no cases array, set empty set
        setFollowedCases(new Set<string>());
      }
    } else if (followedQuery.data && !followedQuery.data.success) {
      // If there's data but not successful, set empty set
      setFollowedCases(new Set<string>());
    }
  }, [followedQuery.data]);


  const handleFormSubmit = useCallback(
    (params: {
      courtCode: number;
      stateCode: number;
      courtComplexCode: number;
      selectedCourt: string;
      selectedBench: string;
    }) => {
      if (!partyName.trim()) return;

      setSearchParams({
        court_code: params.courtCode.toString(),
        state_code: params.stateCode.toString(),
        court_complex_code: params.courtComplexCode.toString(),
        petres_name: partyName,
        rgyear: rgYear,
      });
      setPage(1);
    },
    [partyName, rgYear]
  );

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
              // Force refresh of followed cases
              queryClient.invalidateQueries({
                queryKey: ["followedResearch", workspaceId, "High_Court"],
              });
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
    [followMutation, isRowFollowed, queryClient]
  );

  const filteredResults = useMemo(() => {
    const results = partyQuery.data?.data?.filter((result: HighCourtResult) =>
      Object.values(result).some((value) =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    ) || [];
    
    
    return results;
  }, [partyQuery.data?.data, searchQuery]);

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

  // Handle detail query and HTML parsing
  useEffect(() => {
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
        (r: any) => String(r.cino || r.case_no) === caseId
      ) || {}),
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

  // Reset page when results change
  React.useEffect(() => {
    setPage(1);
  }, [partyQuery.isFetching, searchQuery, searchParams]);

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "1970-01-01T00:00:00.000Z") return "N/A";
    try {
      let parsedDate;
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
        const [day, month, year] = dateString.split("-");
        parsedDate = new Date(`${year}-${month}-${day}`);
      } else if (/^\d{1,2}(st|nd|rd|th)\s+[A-Za-z]+\s+\d{4}$/.test(dateString)) {
        const [dayWithSuffix, month, year] = dateString.split(/[\s-]+/);
        const day = dayWithSuffix.replace(/(st|nd|rd|th)/, "");
        const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
        parsedDate = new Date(
          `${year}-${String(monthIndex + 1).padStart(2, "0")}-${day.padStart(2, "0")}`
        );
      } else if (/^\d{2}-[A-Za-z]+-\d{4}$/.test(dateString)) {
        const [day, month, year] = dateString.split("-");
        const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
        parsedDate = new Date(`${year}-${String(monthIndex + 1).padStart(2, "0")}-${day}`);
      } else {
        parsedDate = new Date(dateString);
      }

      if (isNaN(parsedDate.getTime())) throw new Error("Invalid date");
      return parsedDate.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      console.warn(`Invalid date format: ${dateString}`, error);
      return "N/A";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground">
        High Court Cases by Party Name
      </h2>

      {/* Search Form */}
      <HighCourtSearchForm
        title="Search by Party Name"
        onSubmit={handleFormSubmit}
        isLoading={partyQuery.isLoading || partyQuery.isFetching}
      >
        {/* Party Name */}
        <div className="space-y-2">
          <Label htmlFor="party-name">Party Name</Label>
          <Input
            id="party-name"
            type="text"
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            placeholder="Enter party name"
            required
          />
          <div className="text-sm text-muted-foreground">
            Example: Tanishk
          </div>
        </div>

        {/* Year */}
        <div className="space-y-2">
          <Label htmlFor="year-select">Year</Label>
          <select
            id="year-select"
            value={rgYear}
            onChange={(e) => setRgYear(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {Array.from({ length: 30 }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              );
            })}
          </select>
        </div>
      </HighCourtSearchForm>

      {/* Error Display */}
      {partyQuery.error && (
        <Alert variant="destructive">
          <AlertDescription>
            <strong>Search Error:</strong>{" "}
            {partyQuery.error.message || "An error occurred during search"}
            {partyQuery.error.message?.includes("captcha") && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="font-medium text-yellow-800 mb-1">What does this mean?</div>
                <div className="text-yellow-700 text-sm">
                  The court database requires captcha verification to prevent automated requests. 
                  This is a temporary issue. Please try again in a few minutes or contact support if the problem persists.
                </div>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Results Section */}
      <HighCourtResultsSection
        results={filteredResults}
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
        isLoading={partyQuery.isLoading || partyQuery.isFetching}
        error={partyQuery.error}
        searchParams={searchParams}
        searchType="party"
      />

      {/* Case Details Modal */}
      {showCaseDetails && selectedCase && (
        <HighCourtCaseDetailsModal
          caseData={selectedCase}
          onClose={() => {
            setShowCaseDetails(false);
            setSelectedCase(null);
            setDetailParams(null);
            setLoadingDetails(null);
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
