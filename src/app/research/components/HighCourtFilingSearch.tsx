"use client";

import React, { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useHighByFilingNumber, useFollowResearch, useUnfollowResearch, useHighDetail, useFollowedResearch } from "@/hooks/use-research";
import { getApiBaseUrl, getCookie } from "@/lib/utils";
// ResultsTable not used directly here after refactor
import SearchBar from "./common/SearchBar";
import Pagination from "./common/Pagination";
import HighCourtCaseDetailsModal from "./common/HighCourtCaseDetailsModal";
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            import {
  stateCodeMapping,
  courtComplexMapping,
  courtCodeMapping,
} from "../utils/courtMappings";
import HighCourtAdvocateResultsTable from "./common/HighCourtAdvocateResultsTable";
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
  const [courtCode, setCourtCode] = useState("1");
  const [stateCode, setStateCode] = useState("26");
  const [courtComplexCode, setCourtComplexCode] = useState("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState<HighCourtResult | null>(
    null
  );
  const [showCaseDetails, setShowCaseDetails] = useState(false);
  const [followedCases, setFollowedCases] = useState<Set<string>>(new Set());
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);
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

  const queryClient = useQueryClient();
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
    const composite = r.type_name && num && r.fil_year ? `${r.type_name}/${num}/${r.fil_year}` : "";
    const byComposite = composite ? followedCases.has(composite) : false;
    return byCino || byComposite;
  };

  // Generate years for dropdown (last 30 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) =>
    (currentYear - i).toString()
  );

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
  const currentPageResults = filteredResults.slice(startIndex, endIndex);

  React.useEffect(() => {
    setPage(1);
  }, [filingQuery.isFetching, searchQuery, JSON.stringify(searchParams)]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!caseNo.trim()) return;

    const nextParams = {
      court_code: parseInt(courtCode),
      state_code: parseInt(stateCode),
      court_complex_code: parseInt(courtComplexCode),
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
  };

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
    const normalized = typeof raw?.data === "string"
      ? parseHighCourtHtml(raw.data)
      : typeof raw === "string"
        ? parseHighCourtHtml(raw)
        : raw;
    setSelectedCase({
      ...(currentPageResults.find((r) => String(r.cino || r.case_no) === caseId) || ({} as any)),
      details: normalized,
    } as any);
    setShowCaseDetails(true);
    setLoadingDetails(null);
  }, [detailQuery.data, detailQuery.error, detailQuery.isLoading, detailQuery.isFetching, detailParams]);

  const handleViewDetails = (result: HighCourtResult) => {
    const caseId = result.cino || result.case_no;
    setLoadingDetails(caseId);
    // Build formatted case number: YYYY + SS + CCCCCCCC + YYYY
    const year = Number(result.fil_year) || new Date().getFullYear();
    const state = Number(result.state_cd) || 26;
    const rawNo = (result.fil_no ? Number(result.fil_no) : (result.case_no ? Number(result.case_no) : 0)) || 0;
    const formattedCaseNo = Number(
      `${year}${String(state).padStart(2, "0")}${String(rawNo).padStart(8, "0")}${year}`
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
  };

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
      // Send the entire row as the followed payload (preserve all fields)
      const followedData = { ...caseData } as any;

      followMutation.mutate({
        court: "High_Court",
        followed: followedData,
        workspaceId: workspaceId,
      });
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-foreground">
        High Court Cases by Filing Number
      </h2>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-md border border-gray-200 dark:border-zinc-800 max-w-2xl">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Court Configuration */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-zinc-300">
                Court Type
              </label>
              <select
                value={courtCode}
                onChange={(e) => setCourtCode(e.target.value)}
                className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-black"
              >
                {courtCodeMapping.map((court) => (
                  <option key={court.code} value={court.code}>
                    {court.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-zinc-300">
                State
              </label>
              <select
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-black"
              >
                {stateCodeMapping.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-zinc-300">
                Court Complex
              </label>
              <select
                value={courtComplexCode}
                onChange={(e) => setCourtComplexCode(e.target.value)}
                className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-black"
              >
                {courtComplexMapping.map((complex) => (
                  <option key={complex.code} value={complex.code}>
                    {complex.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-zinc-300">
                Case Number *
              </label>
              <input
                type="number"
                value={caseNo}
                onChange={(e) => setCaseNo(e.target.value)}
                className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="5293619"
                required
              />
              <div className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Example: 5293619</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-zinc-300">
                Registration Year
              </label>
              <select
                value={rgYear}
                onChange={(e) => setRgYear(e.target.value)}
                className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-black"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 md:flex md:justify-end">
              <button
                type="submit"
                className="w-full md:w-auto bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
                disabled={filingQuery.isLoading || filingQuery.isFetching}
              >
                {filingQuery.isLoading || filingQuery.isFetching ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Searching...</span>
                  </div>
                ) : (
                  <>
                    <Search size={16} />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Error Display */}
      {filingQuery.error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
            <div>
              <p className="text-red-700 dark:text-red-400 font-medium">Search Error</p>
              <p className="text-red-600 dark:text-red-300 text-sm mt-1">{filingQuery.error instanceof Error ? filingQuery.error.message : "An error occurred while searching"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {!filingQuery.isLoading && !filingQuery.isFetching && filteredResults.length > 0 && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
            <p className="text-green-700">
              Found {filteredResults.length} case
              {filteredResults.length !== 1 ? "s" : ""} matching your search
              criteria.
            </p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {!filingQuery.isLoading && !filingQuery.isFetching && filteredResults.length > 0 && (
        <div className="mt-6">
          <div className="flex flex-col gap-3 mb-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Search Results</h3>
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search" />
            </div>
          </div>

          {filteredResults.length === 0 ? (
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
              followLoading={followMutation.isPending || unfollowMutation.isPending}
            />
          )}
        {/* Footer Pagination */}
        {filteredResults.length > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
          />
        )}
        </div>
      )}

      {/* No Data Found State */}
      {!filingQuery.isLoading &&
        !filingQuery.isFetching &&
        filteredResults.length === 0 &&
        !filingQuery.error &&
        searchParams && (
          <div className="mt-6 p-8 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">
              No Data Found
            </h3>
            <p className="text-gray-600 dark:text-zinc-400 max-w-md mx-auto">
              No cases found for case number {searchParams.case_no} in year{" "}
              {searchParams.rgyear}. Please verify the case number and year, or
              try a different search.
            </p>
          </div>
        )}

      {/* No Search Performed State */}
      {!filingQuery.isLoading &&
        !filingQuery.isFetching &&
        filteredResults.length === 0 &&
        !filingQuery.error &&
        !searchParams && (
          <div className="mt-6 p-8 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-black" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">
              Search High Court Cases by Filing Number
            </h3>
            <p className="text-gray-600 dark:text-zinc-400 max-w-md mx-auto">
              Enter a case number and select the registration year to find High
              Court cases. Use the example &quot;5293619&quot; to test the
              search functionality.
            </p>
          </div>
        )}

      {/* Case Details Modal */}
      {showCaseDetails && (
        <HighCourtCaseDetailsModal
          caseData={selectedCase as any}
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
