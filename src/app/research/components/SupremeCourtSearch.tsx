"use client";

import React, { useState, useEffect } from "react";
import { Search, Star, Eye, Loader2 } from "lucide-react";
import {
  useSupremeByParty,
  useSupremeDetail,
  useFollowResearch,
  useUnfollowResearch,
} from "@/hooks/use-research";
import { getApiBaseUrl, getCookie } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ResultsTable, { ColumnDef } from "./common/ResultsTable";
import SearchBar from "./common/SearchBar";
import FollowButton from "./common/FollowButton";
import StatusPill from "./common/StatusPill";
import SupremeCaseDetailsDialog from "./SupremeCaseDetailsDialog";
import { SupremeCaseData } from "../utils/supreme-parser";
import { createSupremeCourtCaseData } from "../utils/supreme-parser";

interface CaseResult {
  serial_number: string;
  diary_number: string;
  case_number: string;
  petitioner_name: string;
  respondent_name: string;
  status: string;
}

interface CaseDetails {
  [key: string]: any;
}

export default function SupremeCourtSearch() {
  const [partyName, setPartyName] = useState("");
  const [partyType, setPartyType] = useState("any");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [partyStatus, setPartyStatus] = useState("P");
  const [searchResults, setSearchResults] = useState<CaseResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState<SupremeCaseData | null>(
    null
  );
  const [showCaseDetails, setShowCaseDetails] = useState(false);
  const [followedCases, setFollowedCases] = useState<Set<string>>(new Set());
  const [followLoading, setFollowLoading] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useState<{
    party_type: string;
    party_name: string;
    year: number;
    party_status: string;
  } | null>(null);
  const searchQueryResult = useSupremeByParty(searchParams);
  const [detailParams, setDetailParams] = useState<{
    diary_no: number;
    diary_year: number;
  } | null>(null);
  const detailsQuery = useSupremeDetail(detailParams);
  const followMutation = useFollowResearch();
  const unfollowMutation = useUnfollowResearch();

  const rawResults = React.useMemo(() => {
    const data: any = searchQueryResult.data;
    if (!data) return [] as any[];
    if (Array.isArray(data)) return data;
    if (Array.isArray((data as any).results)) return (data as any).results;
    if (Array.isArray((data as any).data)) return (data as any).data;
    if (Array.isArray((data as any).cases)) return (data as any).cases;
    return [] as any[];
  }, [searchQueryResult.data]);

  // Generate years for dropdown (last 30 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) =>
    (currentYear - i).toString()
  );

  // Filter search results based on searchQuery
  const filteredResults = rawResults.filter((result: any) =>
    Object.values(result).some((value) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({
      party_type: partyType,
      party_name: partyName,
      year: parseInt(year),
      party_status: partyStatus,
    });
  };

  const handleViewDetails = async (result: CaseResult) => {
    const [diaryNumber, diaryYear] = result.diary_number.split("/");
    setDetailsLoading(result.diary_number);

    try {
      // Prefer our backend API using env base URL
      const base = getApiBaseUrl();
      const token = getCookie("token") || "";
      const response = await fetch(
        `${base}/research/supreme-court/case-detail`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            diary_no: parseInt(diaryNumber),
            diary_year: parseInt(diaryYear),
          }),
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      // Normalize API response: handle multiple shapes robustly
      const payload =
        data && typeof data === "object" && "data" in data
          ? (data as any).data
          : data;
      const html =
        payload && typeof payload === "object"
          ? (payload as any).case_details ||
            (payload as any).html ||
            (payload as any).content ||
            (payload as any).data?.case_details
          : undefined;
      let normalized: any = null;
      if (payload && typeof payload === "object") {
        // Server returned separate sections. Wrap each into the dialog's expected shape.
        const wrapped: Record<
          string,
          { success: boolean; data: { data: string } }
        > = {};
        Object.keys(payload as Record<string, unknown>).forEach((key) => {
          const value: any = (payload as any)[key];
          if (value == null) return;
          // Accept raw HTML string or JSON string; otherwise stringify objects safely
          const content =
            typeof value === "string" ? value : JSON.stringify(value);
          wrapped[key] = { success: true, data: { data: content } };
        });
        // If nothing was wrapped but we have a single html, fall back to html mode below
        if (Object.keys(wrapped).length > 0) {
          normalized = wrapped;
        }
      }
      if (!normalized && typeof html === "string") {
        // Fallback: single big HTML → auto-split into tabs best-effort
        normalized = createSupremeCourtCaseData(html);
      }
      if (normalized) {
        setSelectedCase(normalized);
        setShowCaseDetails(true);
      } else {
        throw new Error("Unexpected Supreme Court detail response shape");
      }
    } catch (err) {
      console.error("Failed to fetch case details:", err);
      setDetailParams({
        diary_no: parseInt(diaryNumber),
        diary_year: parseInt(diaryYear),
      });
      // Use query result when available
      if (detailsQuery.data) {
        setSelectedCase(detailsQuery.data as any);
        setShowCaseDetails(true);
      }
    } finally {
      setDetailsLoading(null);
    }
  };

  const handleFollowCase = async (caseData: CaseResult) => {
    const caseId = caseData.diary_number;
    const workspaceId = getCookie("workspaceId");

    if (!workspaceId) {
      alert("Please select a workspace to follow cases");
      return;
    }

    setFollowLoading(caseId);

    try {
      if (followedCases.has(caseId)) {
        await unfollowMutation.mutateAsync(caseId);
        setFollowedCases((prev) => {
          const next = new Set(prev);
          next.delete(caseId);
          return next;
        });
      } else {
        // Create the followed object in the format expected by the API
        const followedData = {
          "Case Number": caseData.case_number || "",
          "Petitioner versus Respondent": `${caseData.petitioner_name || ""} versus ${caseData.respondent_name || ""}`,
          View: caseData.diary_number,
        };

        await followMutation.mutateAsync({
          court: "Supreme_Court",
          followed: followedData,
          workspaceId: workspaceId,
        });
        setFollowedCases((prev) => new Set(prev).add(caseId));
      }
    } catch (err) {
      console.error("Follow/unfollow failed:", err);
    } finally {
      setFollowLoading(null);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-foreground">
        Supreme Court Cases by Party Name
      </h2>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-md border border-gray-200 dark:border-zinc-800 max-w-xl">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label
                htmlFor="party-input"
                className="block text-sm font-medium mb-1 text-gray-700 dark:text-zinc-300"
              >
                Party Name *
              </label>
              <input
                type="text"
                id="party-input"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="Enter party name"
                required
              />
              <div className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                Example: Tanishk
              </div>
            </div>

            <div>
              <label
                htmlFor="stage-select"
                className="block text-sm font-medium mb-1 text-gray-700 dark:text-zinc-300"
              >
                Stage
              </label>
              <select
                id="stage-select"
                value={partyStatus}
                onChange={(e) => setPartyStatus(e.target.value)}
                className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="P">P</option>
                <option value="C">D</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="type-select"
                className="block text-sm font-medium mb-1 text-gray-700 dark:text-zinc-300"
              >
                Type
              </label>
              <select
                id="type-select"
                value={partyType}
                onChange={(e) => setPartyType(e.target.value)}
                className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="any">any</option>
                <option value="petitioner">petitioner</option>
                <option value="respondent">respondent</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="year-select"
                className="block text-sm font-medium mb-1 text-gray-700 dark:text-zinc-300"
              >
                Year
              </label>
              <select
                id="year-select"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-black"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-start-2 md:flex md:justify-end items-end">
              <button
                type="submit"
                className="w-full md:w-auto bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
                disabled={
                  searchQueryResult.isLoading || searchQueryResult.isFetching
                }
              >
                {searchQueryResult.isLoading || searchQueryResult.isFetching ? (
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
      {searchQueryResult.error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
            <div>
              <p className="text-red-700 dark:text-red-400 font-medium">
                Search Error
              </p>
              <p className="text-red-600 dark:text-red-300 text-sm mt-1">
                {searchQueryResult.error instanceof Error
                  ? searchQueryResult.error.message
                  : "An error occurred while searching"}
              </p>
              <p className="text-red-500 dark:text-red-300/80 text-xs mt-2">
                Please check your internet connection and try again. If the
                problem persists, contact support.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {!searchQueryResult.isLoading &&
        !searchQueryResult.isFetching &&
        filteredResults.length > 0 && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-emerald-950/40 border border-green-200 dark:border-emerald-900 rounded-md">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
              <p className="text-green-700 dark:text-emerald-300">
                Found {filteredResults.length} case
                {filteredResults.length !== 1 ? "s" : ""} matching your search
                criteria.
              </p>
            </div>
          </div>
        )}

      {/* Results Section */}
      {!searchQueryResult.isLoading &&
        !searchQueryResult.isFetching &&
        filteredResults.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium">Search Results</h3>
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
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
              (() => {
                const columns: ColumnDef<any>[] = [
                  {
                    key: "serial_number",
                    header: "INDEX NO.",
                    width: 100,
                    render: (r) => (
                      <span className="text-gray-800 dark:text-zinc-200 font-medium">
                        {r.serial_number || "N/A"}
                      </span>
                    ),
                  },
                  {
                    key: "diary_number",
                    header: "DIARY NUMBER",
                    width: 120,
                    render: (r) => (
                      <div
                        className="max-w-[120px] truncate"
                        title={r.diary_number || ""}
                      >
                        {r.diary_number || "N/A"}
                      </div>
                    ),
                  },
                  {
                    key: "case_number",
                    header: "CASE NUMBER",
                    width: 120,
                    render: (r) => (
                      <div
                        className="max-w-[120px] truncate"
                        title={r.case_number || ""}
                      >
                        {r.case_number || "N/A"}
                      </div>
                    ),
                  },
                  {
                    key: "petitioner_name",
                    header: "PETITIONER",
                    width: 200,
                    render: (r) => (
                      <div
                        className="max-w-[200px] truncate"
                        title={r.petitioner_name || ""}
                      >
                        {r.petitioner_name || "N/A"}
                      </div>
                    ),
                  },
                  {
                    key: "respondent_name",
                    header: "RESPONDENT",
                    width: 200,
                    render: (r) => (
                      <div
                        className="max-w-[200px] truncate"
                        title={r.respondent_name || ""}
                      >
                        {r.respondent_name || "N/A"}
                      </div>
                    ),
                  },
                  {
                    key: "status",
                    header: "STATUS",
                    width: 100,
                    render: (r) => <StatusPill status={r.status} />,
                  },
                  {
                    key: "follow",
                    header: "FOLLOW",
                    width: 80,
                    render: (r) => {
                      const caseId = r.diary_number;
                      return (
                        <FollowButton
                          isFollowing={followedCases.has(caseId)}
                          loading={followLoading === caseId}
                          onClick={() => handleFollowCase(r)}
                          compact
                        />
                      );
                    },
                  },
                  {
                    key: "actions",
                    header: "ACTIONS",
                    width: 100,
                    render: (r) => {
                      const caseId = r.diary_number;
                      return (
                        <button
                          className="flex items-center justify-center space-x-1 px-2 py-1 text-xs font-medium text-white bg-black rounded hover:bg-gray-800 transition-colors"
                          onClick={() => handleViewDetails(r)}
                          disabled={detailsLoading === caseId}
                        >
                          {detailsLoading === caseId ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Eye className="w-3 h-3" />
                              <span className="hidden sm:inline">Details</span>
                            </>
                          )}
                        </button>
                      );
                    },
                  },
                ];
                return (
                  <div className="inline-block min-w-full bg-white dark:bg-zinc-900 rounded-xl shadow-lg overflow-hidden border-4 border-white dark:border-zinc-900">
                    <ResultsTable
                      columns={columns}
                      rows={filteredResults}
                      rowKey={(r) => r.diary_number}
                    />
                  </div>
                );
              })()
            )}
          </div>
        )}

      {/* No Data Found State */}
      {!searchQueryResult.isLoading &&
        !searchQueryResult.isFetching &&
        filteredResults.length === 0 &&
        partyName && (
          <div className="mt-6 p-8 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">
              No Data Found
            </h3>
            <p className="text-gray-600 dark:text-zinc-400 max-w-md mx-auto">
              No cases found for party name &quot;{partyName}&quot; in year{" "}
              {year}. Please verify the party name and search criteria, or try a
              different search.
            </p>
          </div>
        )}

      {/* No Search Performed State */}
      {!searchQueryResult.isLoading &&
        !searchQueryResult.isFetching &&
        filteredResults.length === 0 &&
        !partyName && (
          <div className="mt-6 p-8 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-black" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">
              Search Supreme Court Cases
            </h3>
            <p className="text-gray-600 dark:text-zinc-400 max-w-md mx-auto">
              Enter a party name and select your search criteria to find Supreme
              Court cases. Use the example &quot;Tanishk&quot; to test the
              search functionality.
            </p>
          </div>
        )}

      <SupremeCaseDetailsDialog
        open={showCaseDetails}
        onOpenChange={(open) => {
          setShowCaseDetails(open);
          if (!open) setSelectedCase(null);
        }}
        caseData={selectedCase}
      />
    </div>
  );
}
