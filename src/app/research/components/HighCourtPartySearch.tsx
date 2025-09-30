"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Search, X, Star, Eye, Loader2 } from "lucide-react";
import {
  useHighByParty,
  useHighDetail,
  useFollowResearch,
  useUnfollowResearch,
} from "@/hooks/use-research";
import { getApiBaseUrl, getCookie } from "@/lib/utils";
import SearchBar from "./common/SearchBar";
import ResultsTable, { ColumnDef } from "./common/ResultsTable";
import Pagination from "./common/Pagination";
import FollowButton from "./common/FollowButton";
import StatusPill from "./common/StatusPill";

interface HighCourtPartyResult {
  case_no: number;
  state_cd: number;
  cino: string;
  court_code: number;
  type_name: string;
  res_name: string;
  date_of_decision: string;
}

interface CaseDetails {
  [key: string]: any;
}


// Case Details Modal
const CaseDetailsModal = ({
  caseData,
  onClose,
}: {
  caseData: CaseDetails | null;
  onClose: () => void;
}) => {
  if (!caseData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold">Case Details</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(caseData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default function HighCourtPartySearch() {
  const [partyName, setPartyName] = useState("");
  const [stage, setStage] = useState<"BOTH" | "PENDING" | "DISPOSED">("BOTH");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [courtCode, setCourtCode] = useState<number | null>(null);
  const [stateCode, setStateCode] = useState<number | null>(null);
  const [courtComplexCode, setCourtComplexCode] = useState<number | null>(null);
  const [courts, setCourts] = useState<any[]>([]);
  const [selectedCourt, setSelectedCourt] = useState("");
  const [courtSearch, setCourtSearch] = useState("");
  const [showCourtDropdown, setShowCourtDropdown] = useState(false);
  const courtInputRef = useRef<HTMLDivElement>(null);
  const [selectedBench, setSelectedBench] = useState("");
  const [benches, setBenches] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState<CaseDetails | null>(null);
  const [showCaseDetails, setShowCaseDetails] = useState(false);
  const [followedCases, setFollowedCases] = useState<Set<string>>(new Set());
  const [followLoading, setFollowLoading] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<string | null>(null);
  const [detailParams, setDetailParams] = useState<{
    case_no: number;
    state_code: number;
    cino: string;
    court_code: number;
    national_court_code: string;
    dist_cd: number;
  } | null>(null);

  const [searchParams, setSearchParams] = useState<
    | {
        court_code: number;
        state_code: number;
        court_complex_code: number;
        petres_name: string;
        rgyear: number;
        f: "BOTH" | "PENDING" | "DISPOSED";
      }
    | null
  >(null);
  const partyQuery = useHighByParty(searchParams);
  const followMutation = useFollowResearch();
  const unfollowMutation = useUnfollowResearch();

  // Generate years for dropdown (last 30 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) =>
    (currentYear - i).toString()
  );

  // Normalize results from query data
  const rawResults: HighCourtPartyResult[] = Array.isArray(partyQuery.data)
    ? (partyQuery.data as any)
    : Array.isArray((partyQuery.data as any)?.results)
    ? ((partyQuery.data as any).results as any)
    : Array.isArray((partyQuery.data as any)?.data)
    ? ((partyQuery.data as any).data as any)
    : Array.isArray((partyQuery.data as any)?.cases)
    ? ((partyQuery.data as any).cases as any)
    : [];

  // Filter search results based on searchQuery
  const filteredResults = rawResults.filter((result: any) =>
    Object.values(result).some((value: any) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const total = filteredResults.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const currentPageResults = filteredResults.slice(startIndex, endIndex);

  useEffect(() => {
    setPage(1);
  }, [partyQuery.isFetching, searchQuery, JSON.stringify(searchParams)]);

  // Handle click outside to close court dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        courtInputRef.current &&
        !courtInputRef.current.contains(event.target as Node)
      ) {
        setShowCourtDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mock court data - in real app, fetch from API
  useEffect(() => {
    setCourts([
      {
        name: "Allahabad High Court",
        benches: ["Allahabad High Court Lucknow Bench", "Allahabad High Court"],
      },
      {
        name: "Delhi High Court",
        benches: ["Delhi High Court"],
      },
      {
        name: "Bombay High Court",
        benches: ["Bombay High Court", "Bombay High Court Nagpur Bench"],
      },
    ]);
  }, []);

  const filteredCourts = courts.filter((court) =>
    court.name.toLowerCase().includes(courtSearch.toLowerCase())
  );

  const handleCourtSelect = (court: any) => {
    setSelectedCourt(court.name);
    setCourtSearch(court.name);
    setShowCourtDropdown(false);
  };

  // Update benches when selectedCourt changes
  useEffect(() => {
    if (selectedCourt) {
      const court = courts.find((c) => c.name === selectedCourt);
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

  // Mock court info fetch - in real app, fetch from API
  useEffect(() => {
    if (selectedCourt && selectedBench) {
      // Mock values - replace with actual API call
      setCourtCode(1);
      setStateCode(26);
      setCourtComplexCode(1);
    }
  }, [selectedCourt, selectedBench]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!partyName.trim()) {
      return;
    }

    if (!courtCode || !stateCode || !courtComplexCode) {
      return;
    }

    setSearchParams({
      court_code: courtCode,
      state_code: stateCode,
      court_complex_code: courtComplexCode,
      petres_name: partyName,
      rgyear: parseInt(year),
      f: stage,
    } as any);
  };

  const detailQuery = useHighDetail(detailParams);

  useEffect(() => {
    if (!detailParams) return;
    if (detailQuery.isLoading || detailQuery.isFetching) return;
    const caseId = String(detailParams.cino || detailParams.case_no);
    if (detailQuery.error) {
      console.error("Failed to fetch case details:", detailQuery.error);
      setDetailsLoading(null);
      return;
    }
    const raw: any = detailQuery.data;
    if (!raw) return;
    const details = typeof raw?.data === "string" ? raw.data : typeof raw === "string" ? raw : raw;
    setSelectedCase(details);
    setShowCaseDetails(true);
    setDetailsLoading(null);
  }, [detailQuery.data, detailQuery.error, detailQuery.isLoading, detailQuery.isFetching, detailParams]);

  const handleViewDetails = (result: HighCourtPartyResult) => {
    const caseId = result.cino || result.case_no.toString();
    setDetailsLoading(caseId);
    setDetailParams({
      case_no: Number(result.case_no),
      state_code: Number((result as any).state_cd),
      cino: result.cino,
      court_code: Number(result.court_code),
      national_court_code: (result.cino || "").substring(0, 6),
      dist_cd: 1,
    });
  };

  const handleFollowCase = async (caseData: HighCourtPartyResult) => {
    const caseId = caseData.cino || caseData.case_no.toString();
    setFollowLoading(caseId);

    try {
      if (followedCases.has(caseId)) {
        await unfollowMutation.mutateAsync(caseId);
        setFollowedCases((prev) => {
          const newSet = new Set(prev);
          newSet.delete(caseId);
          return newSet;
        });
      } else {
        await followMutation.mutateAsync({
          court: "High_Court",
          followed: caseData,
          workspaceId: "current-workspace",
        });
        setFollowedCases((prev) => new Set(prev).add(caseId));
      }
    } catch (err) {
      console.error("Follow/unfollow failed:", err);
    } finally {
      setFollowLoading(null);
    }
  };

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "1970-01-01T00:00:00.000Z") return "N/A";
    try {
      let parsedDate;
      // Handle "dd-mm-yyyy" format (e.g., "21-05-2025")
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
        const [day, month, year] = dateString.split("-");
        parsedDate = new Date(`${year}-${month}-${day}`);
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
      <h2 className="text-xl font-semibold mb-4">
        High Court Cases by Party Name
      </h2>

      <div className="bg-white p-6 rounded-md border border-gray-200 max-w-4xl">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Party Name - Full Width */}
            <div className="col-span-1 md:col-span-2">
              <label
                htmlFor="party-input"
                className="block text-sm font-medium mb-1 text-gray-700"
              >
                Party Name *
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

            {/* Court Name */}
            <div className="relative" ref={courtInputRef}>
              <label
                htmlFor="court-input"
                className="block text-sm font-medium mb-1 text-gray-700"
              >
                Court Name *
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
                  {filteredCourts.map((court) => (
                    <li
                      key={court.name}
                      onClick={() => handleCourtSelect(court)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      {court.name}
                    </li>
                  ))}
                  {filteredCourts.length === 0 && (
                    <li className="px-4 py-2 text-gray-500 text-sm">
                      No courts found
                    </li>
                  )}
                </ul>
              )}
              <div className="text-sm text-gray-500 mt-1">
                Example: Allahabad High Court
              </div>
            </div>

            {/* Bench Name */}
            <div>
              <label
                htmlFor="bench-select"
                className="block text-sm font-medium mb-1 text-gray-700"
              >
                Bench Name *
              </label>
              <select
                id="bench-select"
                value={selectedBench}
                onChange={(e) => setSelectedBench(e.target.value)}
                className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
                disabled={!selectedCourt}
                required
              >
                <option value="" disabled>
                  Select a bench
                </option>
                {benches.map((bench) => (
                  <option key={bench} value={bench}>
                    {bench}
                  </option>
                ))}
              </select>
              <div className="text-sm text-gray-500 mt-1">
                Example: Allahabad High Court Lucknow Bench
              </div>
            </div>

            {/* Stage */}
            <div>
              <label
                htmlFor="stage-select"
                className="block text-sm font-medium mb-1 text-gray-700"
              >
                Stage
              </label>
              <select
                id="stage-select"
                value={stage}
                onChange={(e) =>
                  setStage(e.target.value as "BOTH" | "PENDING" | "DISPOSED")
                }
                className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="BOTH">Both</option>
                <option value="PENDING">Pending</option>
                <option value="DISPOSED">Disposed</option>
              </select>
            </div>

            {/* Year */}
            <div>
              <label
                htmlFor="year-select"
                className="block text-sm font-medium mb-1 text-gray-700"
              >
                Year
              </label>
              <select
                id="year-select"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <div className="col-span-1 md:col-span-2 flex justify-end mt-4">
              <button
                type="submit"
                className="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                disabled={partyQuery.isLoading || partyQuery.isFetching}
              >
                {partyQuery.isLoading || partyQuery.isFetching ? (
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
      {partyQuery.error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{partyQuery.error instanceof Error ? partyQuery.error.message : 'An error occurred while searching'}</p>
        </div>
      )}

      {/* Results Section */}
      {!partyQuery.isLoading && !partyQuery.isFetching && (Array.isArray((partyQuery.data as any)?.results) ? (partyQuery.data as any).results.length : Array.isArray(partyQuery.data) ? (partyQuery.data as any[]).length : 0) > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">Search Results</h3>
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search Data..." />
          </div>

          {filteredResults.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700">
              No results found for your search criteria.
            </div>
          ) : (
            (() => {
              const columns: ColumnDef<HighCourtPartyResult>[] = [
                { key: "cino", header: "CNR", width: 160, render: (r) => r.cino },
                { key: "case_no", header: "CASE NUMBER", width: 160, render: (r) => `${r.type_name || ""} ${r.case_no || ""}` },
                { key: "title", header: "TITLE", width: 220, render: (r) => r.res_name || "N/A" },
                { key: "date_of_decision", header: "DECISION DATE", width: 140, render: (r) => formatDate(r.date_of_decision) },
                { key: "follow", header: "FOLLOW", width: 120, render: (r) => {
                  const caseId = r.cino || r.case_no.toString();
                  return (
                    <FollowButton
                      isFollowing={followedCases.has(caseId)}
                      loading={followLoading === caseId}
                      onClick={() => handleFollowCase(r)}
                      compact
                    />
                  );
                } },
                { key: "actions", header: "ACTIONS", width: 140, render: (r) => {
                  const caseId = r.cino || r.case_no.toString();
                  return (
                    <button
                      className="border border-gray-300 rounded px-2 py-1"
                      onClick={() => handleViewDetails(r)}
                      disabled={detailsLoading === caseId}
                    >
                      {detailsLoading === caseId ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span className="hidden sm:inline">Details</span>
                        </div>
                      )}
                    </button>
                  );
                } },
              ];
              return (
                <div className="w-full bg-white rounded-lg shadow-sm overflow-hidden border-4 border-white">
                  <ResultsTable columns={columns} rows={currentPageResults} rowKey={(r) => r.cino || r.case_no} />
                </div>
              );
            })()
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

      {/* Case Details Modal */}
      {showCaseDetails && (
        <CaseDetailsModal
          caseData={selectedCase}
          onClose={() => {
            setShowCaseDetails(false);
            setSelectedCase(null);
          }}
        />
      )}
    </div>
  );
}
