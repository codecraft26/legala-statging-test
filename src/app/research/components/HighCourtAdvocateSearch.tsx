"use client";

import React, { useState } from "react";
import { Search, Star, Eye, Loader2, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useResearchAPI } from "@/hooks/use-research";
import {
  stateCodeMapping,
  courtComplexMapping,
  courtCodeMapping,
} from "../utils/courtMappings";

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
  caseData: HighCourtResult | null;
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
        <div className="p-6 space-y-6">
          {/* Basic Case Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                Case Information
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Case Number:</span>{" "}
                  {caseData.case_no}
                </div>
                <div>
                  <span className="font-medium">CINO:</span> {caseData.cino}
                </div>
                <div>
                  <span className="font-medium">Case Type:</span>{" "}
                  {caseData.type_name}
                </div>
                <div>
                  <span className="font-medium">Case Year:</span>{" "}
                  {caseData.case_year}
                </div>
                <div>
                  <span className="font-medium">Case No 2:</span>{" "}
                  {caseData.case_no2}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                Court Information
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">State Code:</span>{" "}
                  {caseData.state_cd}
                </div>
                <div>
                  <span className="font-medium">Court Code:</span>{" "}
                  {caseData.court_code}
                </div>
                <div>
                  <span className="font-medium">Decision Date:</span>{" "}
                  {caseData.date_of_decision
                    ? new Date(caseData.date_of_decision).toLocaleDateString(
                        "en-IN"
                      )
                    : "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Parties Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                Petitioner Information
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Petitioner Name:</span>{" "}
                  {caseData.pet_name || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Local Petitioner:</span>{" "}
                  {caseData.lpet_name || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Party Name 1:</span>{" "}
                  {caseData.party_name1 || "N/A"}
                </div>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                Respondent Information
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Respondent Name:</span>{" "}
                  {caseData.res_name || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Local Respondent:</span>{" "}
                  {caseData.lres_name || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Party Name 2:</span>{" "}
                  {caseData.party_name2 || "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Advocate Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                Advocate 1 Information
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Advocate Name:</span>{" "}
                  {caseData.adv_name1 || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Local Advocate:</span>{" "}
                  {caseData.ladv_name1 || "N/A"}
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                Advocate 2 Information
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Advocate Name:</span>{" "}
                  {caseData.adv_name2 || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Local Advocate:</span>{" "}
                  {caseData.ladv_name2 || "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {caseData.orderurlpath && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                Order Information
              </h4>
              <div className="text-sm">
                <div>
                  <span className="font-medium">Order URL Path:</span>{" "}
                  {caseData.orderurlpath}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function HighCourtAdvocateSearch() {
  const [advocateName, setAdvocateName] = useState("");
  const [courtCode, setCourtCode] = useState("1");
  const [stateCode, setStateCode] = useState("26");
  const [courtComplexCode, setCourtComplexCode] = useState("1");
  const [filterType, setFilterType] = useState<"P" | "R" | "Both">("Both");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState<HighCourtResult | null>(
    null
  );
  const [showCaseDetails, setShowCaseDetails] = useState(false);
  const [followedCases, setFollowedCases] = useState<Set<string>>(new Set());
  const [searchParams, setSearchParams] = useState<{
    court_code: number;
    state_code: number;
    court_complex_code: number;
    advocate_name: string;
    f: "P" | "R" | "Both";
  } | null>(null);

  const queryClient = useQueryClient();
  const { searchHighCourtByAdvocate, followResearch, unfollowResearch } =
    useResearchAPI();

  // TanStack Query for search results
  const {
    data: searchResults = [],
    isLoading,
    error,
    isFetching,
  } = useQuery<HighCourtResult[]>({
    queryKey: ["highCourtAdvocateSearch", searchParams],
    queryFn: async (): Promise<HighCourtResult[]> => {
      if (!searchParams) return [];

      console.warn("Searching High Court by advocate:", searchParams);
      const data = await searchHighCourtByAdvocate(searchParams);

      // Handle different possible response structures
      let results: HighCourtResult[] = [];
      if (data) {
        if (Array.isArray(data)) {
          results = data;
        } else if (data.results && Array.isArray(data.results)) {
          results = data.results;
        } else if (data.data && Array.isArray(data.data)) {
          results = data.data;
        } else if (data.cases && Array.isArray(data.cases)) {
          results = data.cases;
        } else {
          console.warn(
            "No search results found or unexpected API response structure:",
            data
          );
          results = [];
        }
      } else {
        console.warn("No data returned from API");
        results = [];
      }

      console.warn("Processed results:", results);
      return results;
    },
    enabled: !!searchParams,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (replaced cacheTime)
  });

  // Filter search results based on searchQuery
  const filteredResults = searchResults.filter((result: HighCourtResult) =>
    Object.values(result).some((value: any) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!advocateName.trim()) return;

    setSearchParams({
      court_code: parseInt(courtCode),
      state_code: parseInt(stateCode),
      court_complex_code: parseInt(courtComplexCode),
      advocate_name: advocateName.trim(),
      f: filterType,
    });
  };

  const handleViewDetails = (result: HighCourtResult) => {
    setSelectedCase(result);
    setShowCaseDetails(true);
  };

  // TanStack Query mutations for follow/unfollow
  const followMutation = useMutation({
    mutationFn: async (caseData: HighCourtResult) => {
      return await followResearch({
        court: "High_Court",
        followed: caseData,
        workspaceId: "current-workspace", // Replace with actual workspace ID
      });
    },
    onSuccess: (_, caseData) => {
      const caseId = caseData.cino || caseData.case_no;
      setFollowedCases((prev) => new Set(prev).add(caseId));
    },
    onError: (error) => {
      console.error("Follow failed:", error);
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (caseId: string) => {
      return await unfollowResearch(caseId);
    },
    onSuccess: (_, caseId) => {
      setFollowedCases((prev) => {
        const newSet = new Set(prev);
        newSet.delete(caseId);
        return newSet;
      });
    },
    onError: (error) => {
      console.error("Unfollow failed:", error);
    },
  });

  const handleFollowCase = (caseData: HighCourtResult) => {
    const caseId = caseData.cino || caseData.case_no;

    if (followedCases.has(caseId)) {
      unfollowMutation.mutate(caseId);
    } else {
      followMutation.mutate(caseData);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">
        High Court Cases by Advocate Name
      </h2>

      <div className="bg-white p-6 rounded-md border border-gray-200 max-w-2xl">
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
                className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
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
                className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
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
                className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                {courtComplexMapping.map((complex) => (
                  <option key={complex.code} value={complex.code}>
                    {complex.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Advocate Name *
              </label>
              <input
                type="text"
                value={advocateName}
                onChange={(e) => setAdvocateName(e.target.value)}
                className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
                placeholder="Enter advocate name"
                required
              />
              <div className="text-sm text-gray-500 mt-1">
                Example: John Doe
              </div>
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
                className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="Both">Both</option>
                <option value="P">Petitioner</option>
                <option value="R">Respondent</option>
              </select>
            </div>

            <div className="md:col-span-2 md:flex md:justify-end">
              <button
                type="submit"
                className="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                disabled={isLoading || isFetching}
              >
                {isLoading || isFetching ? (
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
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
            <div>
              <p className="text-red-700 font-medium">Search Error</p>
              <p className="text-red-600 text-sm mt-1">
                {error instanceof Error
                  ? error.message
                  : "An error occurred while searching"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {!isLoading && !isFetching && searchResults.length > 0 && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
            <p className="text-green-700">
              Found {searchResults.length} case
              {searchResults.length !== 1 ? "s" : ""} matching your search
              criteria.
            </p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {!isLoading && !isFetching && searchResults.length > 0 && (
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
            <div className="w-full overflow-x-auto">
              <div className="inline-block min-w-full bg-white rounded-xl shadow-lg overflow-hidden border-4 border-white">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-300 to-gray-300 border-b-4 border-white">
                      <th className="px-3 py-3 text-xs font-semibold text-black text-left min-w-[100px]">
                        CASE NO.
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold text-black text-left min-w-[120px]">
                        CINO
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold text-black text-left min-w-[150px]">
                        PETITIONER
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold text-black text-left min-w-[150px]">
                        RESPONDENT
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold text-black text-left min-w-[120px]">
                        ADVOCATE 1
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold text-black text-left min-w-[120px]">
                        ADVOCATE 2
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold text-black text-left min-w-[100px]">
                        CASE TYPE
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold text-black text-left min-w-[100px]">
                        YEAR
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold text-black text-left min-w-[100px]">
                        DECISION DATE
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold text-black text-left min-w-[80px]">
                        FOLLOW
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold text-black text-left min-w-[80px]">
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="border-y-4 border-white">
                    {filteredResults.map(
                      (result: HighCourtResult, index: number) => {
                        const caseId = result.cino || result.case_no;
                        return (
                          <tr
                            key={caseId}
                            className={`transition-colors hover:bg-blue-50 ${
                              index % 2 === 0 ? "bg-white" : "bg-blue-50"
                            } border-b-2 border-gray-100 last:border-b-0`}
                          >
                            <td className="px-3 py-3 text-xs text-gray-800 font-medium">
                              {result.case_no}
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-700">
                              {result.cino}
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-700">
                              <div
                                className="max-w-[150px] truncate"
                                title={result.pet_name || ""}
                              >
                                {result.pet_name || "N/A"}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-700">
                              <div
                                className="max-w-[150px] truncate"
                                title={result.res_name || ""}
                              >
                                {result.res_name || "N/A"}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-700">
                              <div
                                className="max-w-[120px] truncate"
                                title={result.adv_name1 || ""}
                              >
                                {result.adv_name1 || "N/A"}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-700">
                              <div
                                className="max-w-[120px] truncate"
                                title={result.adv_name2 || ""}
                              >
                                {result.adv_name2 || "N/A"}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-700">
                              {result.type_name || "N/A"}
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-700">
                              {result.case_year || "N/A"}
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-700">
                              {result.date_of_decision
                                ? new Date(
                                    result.date_of_decision
                                  ).toLocaleDateString("en-IN")
                                : "N/A"}
                            </td>
                            <td className="px-3 py-3">
                              <button
                                className={`flex items-center justify-center space-x-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                                  followedCases.has(caseId)
                                    ? "text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
                                    : "text-gray-700 bg-gray-100 hover:bg-gray-200"
                                }`}
                                onClick={() => handleFollowCase(result)}
                                disabled={
                                  followMutation.isPending ||
                                  unfollowMutation.isPending
                                }
                              >
                                {followMutation.isPending ||
                                unfollowMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <Star
                                      size={12}
                                      className={
                                        followedCases.has(caseId)
                                          ? "text-yellow-600 fill-yellow-500"
                                          : ""
                                      }
                                    />
                                    <span className="hidden sm:inline">
                                      {followedCases.has(caseId)
                                        ? "Following"
                                        : "Follow"}
                                    </span>
                                  </>
                                )}
                              </button>
                            </td>
                            <td className="px-3 py-3">
                              <button
                                className="flex items-center justify-center space-x-1 px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                                onClick={() => handleViewDetails(result)}
                              >
                                <Eye className="w-3 h-3" />
                                <span className="hidden sm:inline">
                                  Details
                                </span>
                              </button>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Data Found State */}
      {!isLoading &&
        !isFetching &&
        searchResults.length === 0 &&
        !error &&
        searchParams && (
          <div className="mt-6 p-8 bg-white rounded-lg border border-gray-200 text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Data Found
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              No cases found for advocate &quot;{searchParams.advocate_name}
              &quot;. Please verify the advocate name and search criteria, or
              try a different search.
            </p>
          </div>
        )}

      {/* No Search Performed State */}
      {!isLoading &&
        !isFetching &&
        searchResults.length === 0 &&
        !error &&
        !searchParams && (
          <div className="mt-6 p-8 bg-white rounded-lg border border-gray-200 text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Search High Court Cases by Advocate Name
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Enter an advocate name and select your search criteria to find
              High Court cases. Use the example &quot;Rajesh&quot; to test the
              search functionality.
            </p>
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
