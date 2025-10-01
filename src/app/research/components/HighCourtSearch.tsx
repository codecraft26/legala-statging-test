"use client";

import React, { useState } from "react";
import { Search, Star, Eye, Loader2, X } from "lucide-react";
import SearchBar from "./common/SearchBar";
import FollowButton from "./common/FollowButton";
import ResultsTable, { ColumnDef } from "./common/ResultsTable";
import Pagination from "./common/Pagination";
import {
  useHighByAdvocate,
  useHighByFilingNumber,
  useHighDetail,
  useFollowResearch,
  useUnfollowResearch,
} from "@/hooks/use-research";
import { getApiBaseUrl } from "@/lib/utils";
import { hcBench } from "../utils/hcBench";
import {
  stateCodeMapping,
  courtComplexMapping,
  courtCodeMapping,
} from "../utils/courtMappings";

interface HighCourtResult {
  case_no: number;
  state_code: number;
  cino: string;
  court_code: number;
  national_court_code: string;
  dist_cd: number;
  petitioner_name?: string;
  respondent_name?: string;
  status?: string;
}

interface CaseDetails {
  [key: string]: any;
}

// (status pill not required in this simplified modal)

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center border-b border-border p-4 sticky top-0 bg-background z-10">
          <h3 className="text-lg font-semibold text-foreground">Case Details</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <pre className="whitespace-pre-wrap text-sm text-foreground bg-muted/50 p-4 rounded-md">
            {JSON.stringify(caseData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default function HighCourtSearch() {
  const [searchType, setSearchType] = useState<"filing" | "advocate">(
    "advocate"
  );
  const [partyName, setPartyName] = useState("");
  const [advocateName, setAdvocateName] = useState("");
  const [caseNo, setCaseNo] = useState("");
  const [rgYear, setRgYear] = useState(new Date().getFullYear().toString());
  const [courtCode, setCourtCode] = useState("1");
  const [stateCode, setStateCode] = useState("26");
  const [courtComplexCode, setCourtComplexCode] = useState("1");
  const [filterType, setFilterType] = useState<"P" | "R" | "Both">("Both");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState<CaseDetails | null>(null);
  const [showCaseDetails, setShowCaseDetails] = useState(false);
  const [followedCases, setFollowedCases] = useState<Set<string>>(new Set());
  const [followLoading, setFollowLoading] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [advocateParams, setAdvocateParams] = useState<
    | {
        court_code: number;
        state_code: number;
        court_complex_code: number;
        advocate_name: string;
        f: "P" | "R" | "Both";
      }
    | null
  >(null);
  const [filingParams, setFilingParams] = useState<
    | {
        court_code: number;
        state_code: number;
        court_complex_code: number;
        case_no: number;
        rgyear: number;
      }
    | null
  >(null);
  const [detailParams, setDetailParams] = useState<
    | {
        case_no: number;
        state_code: number;
        cino: string;
        court_code: number;
        national_court_code: string;
        dist_cd: number;
      }
    | null
  >(null);

  const advocateQuery = useHighByAdvocate(advocateParams);
  const filingQuery = useHighByFilingNumber(filingParams);
  const detailQuery = useHighDetail(detailParams);
  const followMutation = useFollowResearch();
  const unfollowMutation = useUnfollowResearch();

  // Handle detail query response
  React.useEffect(() => {
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

  // Reset page when search changes
  React.useEffect(() => {
    setPage(1);
  }, [advocateQuery.isFetching, filingQuery.isFetching, searchQuery]);

  // Generate years for dropdown (last 30 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) =>
    (currentYear - i).toString()
  );

  // Filtered results will be computed from query data below

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchType === "advocate") {
      setAdvocateParams({
        court_code: parseInt(courtCode),
        state_code: parseInt(stateCode),
        court_complex_code: parseInt(courtComplexCode),
        advocate_name: advocateName,
        f: filterType,
      });
    } else {
      setFilingParams({
        court_code: parseInt(courtCode),
        state_code: parseInt(stateCode),
        court_complex_code: parseInt(courtComplexCode),
        case_no: parseInt(caseNo),
        rgyear: parseInt(rgYear),
      });
    }
  };

  const handleViewDetails = (result: HighCourtResult) => {
    const caseId = result.cino || result.case_no.toString();
    setDetailsLoading(caseId);
    setDetailParams({
      case_no: result.case_no,
      state_code: result.state_code,
      cino: result.cino,
      court_code: result.court_code,
      national_court_code: result.national_court_code,
      dist_cd: result.dist_cd,
    });
  };

  const handleFollowCase = async (caseData: HighCourtResult) => {
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

  const activeQuery = searchType === "advocate" ? advocateQuery : filingQuery;
  const rawResults: HighCourtResult[] = Array.isArray(activeQuery.data)
    ? (activeQuery.data as any)
    : Array.isArray((activeQuery.data as any)?.results)
    ? ((activeQuery.data as any).results as any)
    : Array.isArray((activeQuery.data as any)?.data)
    ? ((activeQuery.data as any).data as any)
    : Array.isArray((activeQuery.data as any)?.cases)
    ? ((activeQuery.data as any).cases as any)
    : [];

  const loading = activeQuery.isLoading || activeQuery.isFetching;
  const error = activeQuery.error as any;
  const filteredResults = rawResults.filter((result: any) =>
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

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">High Court Cases Search</h2>

      <div className="bg-white p-6 rounded-md border border-gray-200 max-w-2xl">
        {/* Search Type Toggle */}
        <div className="mb-4">
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setSearchType("advocate")}
              className={`px-4 py-2 rounded-md ${
                searchType === "advocate"
                  ? "bg-black text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Search by Advocate Name
            </button>
            <button
              type="button"
              onClick={() => setSearchType("filing")}
              className={`px-4 py-2 rounded-md ${
                searchType === "filing"
                  ? "bg-black text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Search by Filing Number
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Court Configuration */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Court Type
              </label>
              <select
                value={courtCode}
                onChange={(e) => setCourtCode(e.target.value)}
                className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-black"
              >
                {courtCodeMapping.map((court) => (
                  <option key={court.code} value={court.code}>
                    {court.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                State
              </label>
              <select
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-black"
              >
                {stateCodeMapping.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Court Complex
              </label>
              <select
                value={courtComplexCode}
                onChange={(e) => setCourtComplexCode(e.target.value)}
                className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-black"
              >
                {courtComplexMapping.map((complex) => (
                  <option key={complex.code} value={complex.code}>
                    {complex.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Conditional Fields */}
            {searchType === "advocate" ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Advocate Name *
                  </label>
                  <input
                    type="text"
                    value={advocateName}
                    onChange={(e) => setAdvocateName(e.target.value)}
                    className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="Enter advocate name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Filter Type
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) =>
                      setFilterType(e.target.value as "P" | "R" | "Both")
                    }
                    className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="Both">Both</option>
                    <option value="P">Petitioner</option>
                    <option value="R">Respondent</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Case Number *
                  </label>
                  <input
                    type="number"
                    value={caseNo}
                    onChange={(e) => setCaseNo(e.target.value)}
                    className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="5293619"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Registration Year
                  </label>
                  <select
                    value={rgYear}
                    onChange={(e) => setRgYear(e.target.value)}
                    className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="md:col-span-2 md:flex md:justify-end">
              <button
                type="submit"
                className="w-full md:w-auto bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
                disabled={loading}
              >
                {loading ? (
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
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error instanceof Error ? error.message : String(error)}</p>
        </div>
      )}

      {/* Results Section */}
      {!loading && filteredResults.length > 0 && (
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
              const columns: ColumnDef<HighCourtResult>[] = [
                { key: "case_no", header: "CASE NO.", width: 120, render: (r) => r.case_no },
                { key: "cino", header: "CINO", width: 120, render: (r) => r.cino },
                { key: "state_code", header: "STATE CODE", width: 100, render: (r) => r.state_code },
                { key: "court_code", header: "COURT CODE", width: 100, render: (r) => r.court_code },
                { key: "national_court_code", header: "NATIONAL COURT CODE", width: 150, render: (r) => r.national_court_code },
                { key: "follow", header: "FOLLOW", width: 120, render: (r) => {
                  const caseId = r.cino || String(r.case_no);
                  return (
                    <FollowButton
                      isFollowing={followedCases.has(caseId)}
                      loading={followLoading === caseId}
                      onClick={() => handleFollowCase(r)}
                      compact
                    />
                  );
                } },
                { key: "actions", header: "ACTIONS", width: 120, render: (r) => {
                  const caseId = r.cino || String(r.case_no);
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
                <div className="w-full overflow-x-auto">
                  <ResultsTable columns={columns} rows={currentPageResults} rowKey={(r) => r.cino || String(r.case_no)} />
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
