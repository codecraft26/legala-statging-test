"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Search, Star, Eye, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCookie, getApiBaseUrl } from "@/lib/utils";
import { HighCourtAPI } from "@/lib/research-api";
import HighCourtCaseDetailsModal from "./common/HighCourtCaseDetailsModal";
import { parseHighCourtHtml, ParsedHighCourtDetails } from "../utils/highCourtParser";
import { useFollowResearch, useUnfollowResearch, useFollowedResearch, useHighCourts, useHighCourtInfo, useHighCaseStatusByParty } from "@/hooks/use-research";
import SearchBar from "./common/SearchBar";
import Pagination from "./common/Pagination";
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

  // Use the courts hook
  const courtsQuery = useHighCourts();
  const courts = useMemo(() => courtsQuery.data?.courts || [], [courtsQuery.data?.courts]);

  // Use the court info hook
  const courtInfoQuery = useHighCourtInfo(selectedCourt, selectedBench);

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
      setCourtCode(courtInfoQuery.data.court_code || null);
      setStateCode(courtInfoQuery.data.state_cd || null);
      setCourtComplexCode(courtInfoQuery.data.court_code || null);
    } else if (courtInfoQuery.error) {
      setCourtCode(null);
      setStateCode(null);
      setCourtComplexCode(null);
    }
  }, [courtInfoQuery.data, courtInfoQuery.error]);

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


  const filteredCourts = courts.filter((court: any) =>
    court.name.toLowerCase().includes(courtSearch.toLowerCase())
  );

  const handleCourtSelect = (court: any) => {
    setSelectedCourt(court.name);
    setCourtSearch(court.name);
    setShowCourtDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName.trim() || !courtCode || !stateCode || !courtComplexCode) {
      return;
    }

    setSearchParams({
      court_code: courtCode.toString(),
      state_code: stateCode.toString(),
      court_complex_code: courtComplexCode.toString(),
      petres_name: partyName,
      rgyear: rgYear,
    });
    setPage(1);
  };

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
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">High Court Cases by Party Name</h2>
      
      {/* Search Form */}
      <div className="bg-white p-6 rounded-md border border-gray-200 max-w-4xl">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label htmlFor="party-input" className="block text-sm font-medium mb-1 text-gray-700">
                Party Name
              </label>
              <input
                type="text"
                id="party-input"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
                placeholder="Enter party name"
                required
              />
              <div className="text-sm text-gray-500 mt-1">Example: Tanishk</div>
            </div>

            <div className="flex gap-5 w-full">
              <div className="w-1/2 relative" ref={courtInputRef}>
                <label htmlFor="court-input" className="block text-sm font-medium mb-1 text-gray-700">
                  Court Name
                </label>
                <input
                  type="text"
                  id="court-input"
                  value={courtSearch}
                  onChange={(e) => {
                    setCourtSearch(e.target.value);
                    setShowCourtDropdown(true);
                  }}
                  onFocus={() => setShowCourtDropdown(true)}
                  className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  placeholder="Search court..."
                  required
                />
                {showCourtDropdown && (
                  <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {courtsQuery.isLoading ? (
                      <li className="px-4 py-2 text-gray-500 text-sm flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading courts...</span>
                      </li>
                    ) : courtsQuery.error ? (
                      <li className="px-4 py-2 text-red-500 text-sm">
                        Error loading courts: {courtsQuery.error.message}
                      </li>
                    ) : (
                      <>
                        {filteredCourts.map((court: any) => (
                          <li
                            key={court.name}
                            onClick={() => handleCourtSelect(court)}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          >
                            {court.name}
                          </li>
                        ))}
                        {filteredCourts.length === 0 && (
                          <li className="px-4 py-2 text-gray-500 text-sm">No courts found</li>
                        )}
                      </>
                    )}
                  </ul>
                )}
                <div className="text-sm text-gray-500 mt-1">Example: Allahabad High Court</div>
              </div>

              <div className="w-1/2">
                <label htmlFor="bench-select" className="block text-sm font-medium mb-1 text-gray-700">
                  Bench Name
                </label>
                <select
                  id="bench-select"
                  value={selectedBench}
                  onChange={(e) => setSelectedBench(e.target.value)}
                  className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  disabled={!selectedCourt}
                  required
                >
                  <option value="" disabled>Select a bench</option>
                  {benches.map((bench) => (
                    <option key={bench} value={bench}>
                      {bench}
                    </option>
                  ))}
                </select>
                <div className="text-sm text-gray-500 mt-1">Example: Allahabad High Court Lucknow Bench</div>
              </div>
            </div>


            <div>
              <label htmlFor="year-select" className="block text-sm font-medium mb-1 text-gray-700">
                Year
              </label>
              <select
                id="year-select"
                value={rgYear}
                onChange={(e) => setRgYear(e.target.value)}
                className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
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

            <div className="md:col-start-2 md:flex md:justify-end items-end">
              <button
                type="submit"
                className="w-full md:w-auto bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
                disabled={partyQuery.isLoading || !courtCode || !stateCode}
              >
                {partyQuery.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Court Info Status */}
      {selectedCourt && selectedBench && (
        <div className="mt-4">
          {courtInfoQuery.isLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-blue-700 flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading court information...</span>
            </div>
          )}
          {courtInfoQuery.error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-700">
              <span className="text-sm">
                Warning: Could not load court information. Search may not work properly.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {partyQuery.error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          <div className="font-medium mb-2">Search Error</div>
          <div className="text-sm mb-3">
            {partyQuery.error.message || "An error occurred during search"}
          </div>
          {partyQuery.error.message?.includes("captcha") && (
            <div className="text-sm bg-yellow-50 border border-yellow-200 rounded p-3 mt-3">
              <div className="font-medium text-yellow-800 mb-1">What does this mean?</div>
              <div className="text-yellow-700">
                The court database requires captcha verification to prevent automated requests. 
                This is a temporary issue. Please try again in a few minutes or contact support if the problem persists.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success Message */}
      {!partyQuery.isLoading &&
        !partyQuery.isFetching &&
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
      {!partyQuery.isLoading &&
        !partyQuery.isFetching &&
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
