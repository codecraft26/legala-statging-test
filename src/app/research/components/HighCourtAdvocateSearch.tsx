"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Search, Eye, Loader2 } from "lucide-react";
import {
  useHighByAdvocate,
  useFollowResearch,
  useUnfollowResearch,
  useHighDetail,
  useFollowedResearch,
  useHighCourts,
  useHighCourtInfo,
  researchKeys,
} from "@/hooks/use-research";
import { useQueryClient } from "@tanstack/react-query";
import { getCookie } from "@/lib/utils";
import SearchBar from "./common/SearchBar";
import Pagination from "./common/Pagination";

import {
  parseHighCourtHtml,
  ParsedHighCourtDetails,
} from "../utils/highCourtParser";
import HighCourtCaseDetailsModal from "./common/HighCourtCaseDetailsModal";
import HighCourtAdvocateResultsTable from "./common/HighCourtAdvocateResultsTable";

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
  const [selectedCase, setSelectedCase] = useState<HighCourtResult | null>(
    null
  );
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

  // Court and bench selection states
  const [selectedCourt, setSelectedCourt] = useState("");
  const [courtSearch, setCourtSearch] = useState("");
  const [showCourtDropdown, setShowCourtDropdown] = useState(false);
  const [benches, setBenches] = useState<string[]>([]);
  const [selectedBench, setSelectedBench] = useState("");
  const [courtCode, setCourtCode] = useState<number | null>(null);
  const [stateCode, setStateCode] = useState<number | null>(null);
  const [courtComplexCode, setCourtComplexCode] = useState<number | null>(null);

  const courtInputRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const advocateQuery = useHighByAdvocate(searchParams);
  const followMutation = useFollowResearch();
  const unfollowMutation = useUnfollowResearch();
  const followedQuery = useFollowedResearch(workspaceId || "", "High_Court");

  // Use the courts hook
  const courtsQuery = useHighCourts();
  const courts = useMemo(() => courtsQuery.data?.courts || [], [courtsQuery.data?.courts]);

  // Use the court info hook
  const courtInfoQuery = useHighCourtInfo(selectedCourt, selectedBench);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setWorkspaceId(getCookie("workspaceId"));
    }
  }, []);

  // Handle click outside to close court dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (courtInputRef.current && !courtInputRef.current.contains(event.target as Node)) {
        setShowCourtDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update benches when selectedCourt changes
  useEffect(() => {
    if (selectedCourt) {
      const court = courts.find((c: any) => c.name === selectedCourt);
      setBenches(court ? court.benches : []);
      setSelectedBench(""); // Reset bench selection when court changes
      setCourtCode(null); // Reset court code
      setStateCode(null); // Reset state code
    } else {
      setBenches([]);
      setSelectedBench("");
      setCourtCode(null);
      setStateCode(null);
    }
  }, [selectedCourt, courts]);

  // Update court codes when court info is fetched
  useEffect(() => {
    if (courtInfoQuery.data) {
      const courtInfo = courtInfoQuery.data;
      setCourtCode(courtInfo.court_code || null);
      setStateCode(courtInfo.state_cd || null);
      setCourtComplexCode(courtInfo.court_code || null); // Use court_code for court complex code
    } else if (courtInfoQuery.error) {
      setCourtCode(null);
      setStateCode(null);
      setCourtComplexCode(null);
    }
  }, [courtInfoQuery.data, courtInfoQuery.error]);

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

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!advocateName.trim()) return;
      if (!selectedCourt || !selectedBench) {
        alert("Please select both court and bench");
        return;
      }
      if (!courtCode || !stateCode || !courtComplexCode) {
        alert("Court details are still loading. Please wait a moment and try again.");
        return;
      }

      const nextParams = {
        court_code: courtCode,
        state_code: stateCode,
        court_complex_code: courtComplexCode,
        advocate_name: advocateName.trim(),
        f: filterType,
      } as const;

      setSearchParams(nextParams as any);
      // Force refetch even if searching the same inputs again
      queryClient.invalidateQueries({
        queryKey: researchKeys.list(researchKeys.high(), nextParams),
      });
    },
    [
      advocateName,
      selectedCourt,
      selectedBench,
      courtCode,
      stateCode,
      courtComplexCode,
      filterType,
      queryClient,
    ]
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
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-foreground">
        High Court Cases by Advocate Name
      </h2>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-md border border-gray-200 dark:border-zinc-800 max-w-2xl">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Court Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Court
              </label>
              <div className="relative" ref={courtInputRef}>
                <input
                  type="text"
                  value={courtSearch}
                  onChange={(e) => {
                    setCourtSearch(e.target.value);
                    setShowCourtDropdown(true);
                  }}
                  onFocus={() => setShowCourtDropdown(true)}
                  placeholder="Search for a court..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-800 dark:text-white"
                />
                {showCourtDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                    {courts
                      .filter((court: any) =>
                        court.name.toLowerCase().includes(courtSearch.toLowerCase())
                      )
                      .map((court: any) => (
                        <div
                          key={court.name}
                          className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => {
                            setSelectedCourt(court.name);
                            setCourtSearch(court.name);
                            setShowCourtDropdown(false);
                          }}
                        >
                          {court.name}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bench Selection */}
            {selectedCourt && benches.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bench
                </label>
                <select
                  value={selectedBench}
                  onChange={(e) => setSelectedBench(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select a bench</option>
                  {benches.map((bench) => (
                    <option key={bench} value={bench}>
                      {bench}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Advocate Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Advocate Name
              </label>
              <input
                type="text"
                value={advocateName}
                onChange={(e) => setAdvocateName(e.target.value)}
                placeholder="Enter advocate name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-800 dark:text-white"
                required
              />
            </div>

            {/* Filter Type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as "P" | "R" | "Both")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-800 dark:text-white"
              >
                <option value="Both">Both</option>
                <option value="P">Petitioner</option>
                <option value="R">Respondent</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={advocateQuery.isLoading || advocateQuery.isFetching || !selectedCourt || !selectedBench || !courtCode || !stateCode || !courtComplexCode}
              className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {advocateQuery.isLoading || advocateQuery.isFetching ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </div>
              ) : courtInfoQuery.isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading Court Details...
                </div>
              ) : (
                "Search Cases"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error Display */}
      {advocateQuery.error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
            <div>
              <p className="text-red-700 dark:text-red-400 font-medium">
                Search Error
              </p>
              <p className="text-red-600 dark:text-red-300 text-sm mt-1">
                {advocateQuery.error instanceof Error
                  ? advocateQuery.error.message
                  : "An error occurred while searching"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {!advocateQuery.isLoading &&
        !advocateQuery.isFetching &&
        filteredResults.length > 0 && (
          <div className="mt-4 p-4 bg-muted border border-border rounded-md">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-muted-foreground rounded-full flex-shrink-0"></div>
              <p className="text-foreground">
                Found {filteredResults.length} case
                {filteredResults.length !== 1 ? "s" : ""} matching your search
                criteria.
              </p>
            </div>
          </div>
        )}

      {/* Results Section */}
      {!advocateQuery.isLoading &&
        !advocateQuery.isFetching &&
        filteredResults.length > 0 && (
          <div className="mt-6">
            <div className="flex flex-col gap-3 mb-3">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Search Results</h3>
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search cases..."
                  className="w-64"
                />
              </div>
            </div>

            {currentPageResults.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full flex-shrink-0"></div>
                  <div>
                    <p className="text-yellow-700 font-medium">
                      No results found
                    </p>
                    <p className="text-yellow-600 text-sm mt-1">
                      {searchQuery
                        ? "No cases match your search filter."
                        : "No cases found for your search criteria."}
                    </p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="text-yellow-600 hover:text-yellow-800 text-sm underline mt-1"
                      >
                        Clear search filter
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <HighCourtAdvocateResultsTable
                rows={currentPageResults as any}
                isRowFollowed={isRowFollowed as any}
                loadingDetailsId={loadingDetails}
                onClickDetails={handleViewDetails as any}
                onClickFollow={handleFollowCase as any}
                followLoading={loadingFollow}
              />
            )}
            {/* Footer Pagination */}
            {currentPageResults.length > 0 && (
              <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
                onPageSizeChange={(newPageSize) => {
                  setPageSize(newPageSize);
                  setPage(1);
                }}
              />
            )}
          </div>
        )}

      {/* No Data Found State */}
      {!advocateQuery.isLoading &&
        !advocateQuery.isFetching &&
        filteredResults.length === 0 &&
        !advocateQuery.error &&
        searchParams && (
          <div className="mt-6 p-8 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">
              No Data Found
            </h3>
            <p className="text-gray-600 dark:text-zinc-400 max-w-md mx-auto">
              No cases found for advocate &quot;{searchParams.advocate_name}
              &quot;. Please verify the advocate name and search criteria, or
              try a different search.
            </p>
          </div>
        )}

      {/* No Search Performed State */}
      {!advocateQuery.isLoading &&
        !advocateQuery.isFetching &&
        filteredResults.length === 0 &&
        !advocateQuery.error &&
        !searchParams && (
          <div className="mt-6 p-8 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-black" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">
              Search High Court Cases by Advocate Name
            </h3>
            <p className="text-gray-600 dark:text-zinc-400 max-w-md mx-auto">
              Enter an advocate name and select your search criteria to find
              High Court cases. Use the example &quot;Rajesh&quot; to test the
              search functionality.
            </p>
          </div>
        )}

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
