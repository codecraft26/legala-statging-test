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

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const bgColor =
    status === "COMPLETED" || status === "DISPOSED"
      ? "bg-green-100 text-green-800"
      : "bg-yellow-100 text-yellow-800";

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor}`}>
      {status}
    </span>
  );
};

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
  const [searchResults, setSearchResults] = useState<HighCourtPartyResult[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState<CaseDetails | null>(null);
  const [showCaseDetails, setShowCaseDetails] = useState(false);
  const [followedCases, setFollowedCases] = useState<Set<string>>(new Set());
  const [followLoading, setFollowLoading] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<string | null>(null);

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

  // Filter search results based on searchQuery
  const filteredResults = searchResults.filter((result) =>
    Object.values(result).some((value) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

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

  const handleViewDetails = async (result: HighCourtPartyResult) => {
    const caseId = result.cino || result.case_no.toString();
    setDetailsLoading(caseId);

    try {
      const base = getApiBaseUrl();
      const token = getCookie("token") || "";
      const response = await fetch(`${base}/research/high-court/case-detail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          case_no: Number(result.case_no),
          state_code: Number(result.state_cd),
          cino: result.cino,
          court_code: Number(result.court_code),
          national_court_code: (result.cino || "").substring(0, 6),
          dist_cd: 1,
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const details = await response.json();
      setSelectedCase(details);
      setShowCaseDetails(true);
    } catch (err) {
      console.error("Failed to fetch case details:", err);
    } finally {
      setDetailsLoading(null);
    }
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
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Data..."
                className="w-64 border border-black shadow-md rounded-md pl-10 p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-900" />
              </div>
            </div>
          </div>

          {filteredResults.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700">
              No results found for your search criteria.
            </div>
          ) : (
            <div className="w-full bg-white rounded-lg shadow-sm overflow-hidden border-4 border-white">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white bg-gray-300">
                    <th className="px-6 py-4 text-sm font-medium text-black text-left">
                      CNR
                    </th>
                    <th className="px-6 py-4 text-sm font-medium text-black text-left">
                      CASE NUMBER
                    </th>
                    <th className="px-6 py-4 text-sm font-medium text-black text-left">
                      TITLE
                    </th>
                    <th className="px-6 py-4 text-sm font-medium text-black text-left">
                      DECISION DATE
                    </th>
                    <th className="px-6 py-4 text-sm font-medium text-black text-left">
                      FOLLOW
                    </th>
                    <th className="px-6 py-4 text-sm font-medium text-black text-left">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(partyQuery.data)
                    ? (partyQuery.data as any[])
                    : (partyQuery.data as any)?.results || [])
                    .filter((result: any) =>
                      Object.values(result).some((value: any) =>
                        String(value)
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())
                      )
                    )
                    .map((result: any, index: number) => {
                    const caseId = result.cino || result.case_no.toString();
                    return (
                      <tr
                        key={index}
                        className="border-b hover:bg-gray-50 last:border-b-0"
                      >
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {result.cino}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {`${result.type_name || ""} ${result.case_no || ""}`}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {result.res_name || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {formatDate(result.date_of_decision)}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            className={`flex items-center justify-center space-x-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm ${
                              followedCases.has(caseId)
                                ? "text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
                                : "text-gray-700 bg-gray-100 hover:bg-gray-200"
                            }`}
                            onClick={() => handleFollowCase(result)}
                            disabled={followLoading === caseId}
                          >
                            {followLoading === caseId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Star
                                  size={16}
                                  className={
                                    followedCases.has(caseId)
                                      ? "text-yellow-600 fill-yellow-500"
                                      : ""
                                  }
                                />
                                <span>
                                  {followedCases.has(caseId)
                                    ? "Following"
                                    : "Follow"}
                                </span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            className="flex items-center justify-center w-32 h-10 space-x-2 px-5 py-2 text-sm text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                            onClick={() => handleViewDetails(result)}
                            disabled={detailsLoading === caseId}
                          >
                            {detailsLoading === caseId ? (
                              <div className="flex items-center space-x-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Loading...</span>
                              </div>
                            ) : (
                              <>
                                <Eye className="w-4 h-4" />
                                <span>Details</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
