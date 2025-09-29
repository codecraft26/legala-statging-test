"use client";

import React, { useState } from "react";
import { Search, Star, Eye, Loader2, X, ExternalLink } from "lucide-react";
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
  details?: any; // For storing detailed case information from API
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

// Case Details Modal - exactly like old React code
const CaseDetailsModal = ({
  caseData,
  onClose,
  followedCases,
  handleFollowCase,
  followMutation,
  unfollowMutation,
}: {
  caseData: HighCourtResult | null;
  onClose: () => void;
  followedCases: Set<string>;
  handleFollowCase: (caseData: HighCourtResult) => void;
  followMutation: any;
  unfollowMutation: any;
}) => {
  const [activeTab, setActiveTab] = useState("overview");

  if (!caseData) return null;

  // Format date helper function
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString || dateString.includes("1970-01-01"))
      return "Not Available";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Not Available";
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (err) {
      return "Not Available";
    }
  };

  // Function to render tab content based on active tab (exactly like old React code)
  const renderTabContent = () => {
    const details = caseData.details;

    if (!details) {
      return (
        <div className="p-6 text-center">
          <div className="text-gray-400 mb-2">No data available</div>
          <div className="text-sm text-gray-500">
            No {activeTab.replace(/_/g, " ")} information found for this case.
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  label: "Filing Number",
                  value: details.case_details?.filing_number || "N/A",
                },
                {
                  label: "Filing Date",
                  value: formatDate(details.case_details?.filing_date) || "N/A",
                },
                {
                  label: "Registration Number",
                  value: details.case_details?.registration_number || "N/A",
                },
                {
                  label: "Registration Date",
                  value:
                    formatDate(details.case_details?.registration_date) ||
                    "N/A",
                },
              ].map((item, index) => (
                <div key={index}>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    {item.label}
                  </h3>
                  <p className="text-sm">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "parties":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Petitioners</h3>
              <ul className="bg-gray-50 p-4 rounded-md space-y-2">
                {details.petitioner_and_advocate?.map(
                  (petitioner: string, index: number) => (
                    <li key={index} className="text-sm">
                      {petitioner.split("    ")[0] || "N/A"}
                    </li>
                  )
                ) || <li className="text-sm">N/A</li>}
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Respondents</h3>
              <ul className="bg-gray-50 p-4 rounded-md space-y-2">
                {details.respondent_and_advocate?.map(
                  (respondent: string, index: number) => (
                    <li key={index} className="text-sm">
                      {respondent || "N/A"}
                    </li>
                  )
                ) || <li className="text-sm">N/A</li>}
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Petitioner Advocates</h3>
              <ul className="bg-gray-50 p-4 rounded-md space-y-2">
                {details.petitioner_and_advocate?.map(
                  (petitioner: string, index: number) => (
                    <li key={index} className="text-sm">
                      {petitioner.split("    ")[1] || "N/A"}
                    </li>
                  )
                ) || <li className="text-sm">N/A</li>}
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Respondent Advocates</h3>
              <ul className="bg-gray-50 p-4 rounded-md space-y-2">
                <li className="text-sm">N/A</li>
              </ul>
            </div>
          </div>
        );

      case "status":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  label: "Case Stage",
                  value: details.case_status?.stage_of_case || "N/A",
                },
                {
                  label: "First Hearing Date",
                  value:
                    formatDate(details.case_status?.first_hearing_date) ||
                    "N/A",
                },
                {
                  label: "Next Hearing Date",
                  value:
                    formatDate(details.case_status?.next_hearing_date) || "N/A",
                },
                {
                  label: "Coram",
                  value: details.case_status?.coram || "N/A",
                },
                {
                  label: "Judicial Branch",
                  value: details.case_status?.judicial_branch || "N/A",
                },
                {
                  label: "Not Before Me",
                  value: details.case_status?.not_before_me || "N/A",
                },
              ].map((item, index) => (
                <div key={index}>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    {item.label}
                  </h3>
                  <p className="text-sm">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "orders":
        return (
          <div className="space-y-4">
            <h3 className="font-medium mb-2">Orders</h3>
            {details.orders && details.orders.length > 0 ? (
              <div className="space-y-3">
                {details.orders.map((order: any, index: number) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                  >
                    <span className="text-sm font-medium">{`Order #${
                      order.order_number
                    } - ${formatDate(order.order_date)}`}</span>
                    <a
                      href={order.order_details}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <span>View Order</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700">
                No orders available for this case.
              </div>
            )}
          </div>
        );

      case "ia":
        return (
          <div className="space-y-6">
            <h3 className="font-medium mb-2">
              Interlocutory Applications (IA)
            </h3>
            {details.ia_details && details.ia_details.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse bg-gray-50 rounded-md">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-left text-xs font-medium text-black">
                        IA Number
                      </th>
                      <th className="border border-gray-300 p-2 text-left text-xs font-medium text-black">
                        Party
                      </th>
                      <th className="border border-gray-300 p-2 text-left text-xs font-medium text-black">
                        Filing Date
                      </th>
                      <th className="border border-gray-300 p-2 text-left text-xs font-medium text-black">
                        Next Date
                      </th>
                      <th className="border border-gray-300 p-2 text-left text-xs font-medium text-black">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.ia_details.map((ia: any, index: number) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-100 even:bg-white odd:bg-gray-50"
                      >
                        <td className="border border-gray-300 p-2 text-sm">
                          {ia.ia_number || "N/A"}
                        </td>
                        <td className="border border-gray-300 p-2 text-sm">
                          {ia.party || "N/A"}
                        </td>
                        <td className="border border-gray-300 p-2 text-sm">
                          {formatDate(ia.date_of_filing)}
                        </td>
                        <td className="border border-gray-300 p-2 text-sm">
                          {formatDate(ia.next_date)}
                        </td>
                        <td className="border border-gray-300 p-2 text-sm">
                          {ia.ia_status || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700">
                No IA details available for this case.
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="p-6 text-center">
            <div className="text-gray-400 mb-2">No data available</div>
            <div className="text-sm text-gray-500">
              No {activeTab.replace(/_/g, " ")} information found for this case.
            </div>
          </div>
        );
    }
  };

  // Get all available tabs from the case data
  const availableTabs = ["overview", "parties", "status", "orders", "ia"];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white z-10">
          <h3 id="modal-title" className="text-lg font-semibold">
            Case Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Case Title and Basic Info */}
        <div className="p-4">
          <div className="mb-6">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold mb-2">
                {`${
                  caseData.details?.case_details?.registration_number || "N/A"
                } - ${
                  caseData.details?.petitioner_and_advocate?.[0]?.split(
                    "    "
                  )[0] || "Unknown"
                } vs. ${
                  caseData.details?.respondent_and_advocate?.[0] || "Unknown"
                }`}
              </h2>
              <button
                className={`flex items-center space-x-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm ${
                  followedCases.has(caseData.cino || caseData.case_no)
                    ? "text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
                    : "text-gray-700 bg-gray-100 hover:bg-gray-200"
                }`}
                onClick={() => handleFollowCase(caseData)}
                disabled={
                  followMutation.isPending || unfollowMutation.isPending
                }
              >
                <Star
                  size={16}
                  className={
                    followedCases.has(caseData.cino || caseData.case_no)
                      ? "text-yellow-600 fill-yellow-500"
                      : ""
                  }
                />
                <span>
                  {followedCases.has(caseData.cino || caseData.case_no)
                    ? "Following"
                    : "Follow"}
                </span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-black text-sm font-medium">
                CNR:{" "}
                {caseData.details?.case_details?.cnr_number ||
                  caseData.cino ||
                  "N/A"}
              </span>
              <span className="text-black text-sm mx-2 font-medium">|</span>
              <span className="text-black text-sm font-medium">
                Filed:{" "}
                {formatDate(caseData.details?.case_details?.filing_date) ||
                  "N/A"}
              </span>
              <span className="text-black text-sm mx-2 font-medium">|</span>
              <StatusBadge
                status={
                  caseData.details?.case_status?.stage_of_case || "PENDING"
                }
              />
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="border-b">
            <div className="flex overflow-x-auto">
              {availableTabs.map((tab) => (
                <button
                  key={tab}
                  className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab(tab)}
                  aria-selected={activeTab === tab}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="mb-4">{renderTabContent()}</div>
        </div>

        {/* Modal Footer */}
        <div className="border-t p-4 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="bg-gray-100 text-gray-600 hover:bg-gray-200 px-4 py-2 rounded-md transition-colors"
          >
            Close
          </button>
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
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);
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

  const handleViewDetails = async (result: HighCourtResult) => {
    const caseId = result.cino || result.case_no;
    setLoadingDetails(caseId);

    try {
      // Use the specific API endpoint provided by the user with POST method
      const response = await fetch(
        `https://researchengineinh.infrahive.ai/hc/case?case_no=${result.case_no}&state_cd=${result.state_cd}&dist_cd=1&court_code=${result.court_code}&national_court_code=DLHC01&cino=${result.cino}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const caseDetails = await response.json();

      // Set the detailed case data
      setSelectedCase({
        ...result,
        details: caseDetails,
      });
      setShowCaseDetails(true);
    } catch (err) {
      console.error("Failed to fetch case details:", err);
      // Fallback to showing basic case info if API fails
      setSelectedCase(result);
      setShowCaseDetails(true);
    } finally {
      setLoadingDetails(null);
    }
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
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-foreground">
        High Court Cases by Advocate Name
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
                className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
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
                className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
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
                className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
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
                Advocate Name *
              </label>
              <input
                type="text"
                value={advocateName}
                onChange={(e) => setAdvocateName(e.target.value)}
                className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
                placeholder="Enter advocate name"
                required
              />
              <div className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
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
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
            <div>
              <p className="text-red-700 dark:text-red-400 font-medium">Search Error</p>
              <p className="text-red-600 dark:text-red-300 text-sm mt-1">
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
        <div className="mt-4 p-4 bg-green-50 dark:bg-emerald-950/40 border border-green-200 dark:border-emerald-900 rounded-md">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
            <p className="text-green-700 dark:text-emerald-300">
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
                className="w-64 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 shadow-md rounded-md pl-10 p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-900 dark:text-zinc-300" />
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
              <div className="inline-block min-w-full bg-white dark:bg-zinc-900 rounded-xl shadow-lg overflow-hidden border-4 border-white dark:border-zinc-900">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-300 to-gray-300 dark:from-zinc-800 dark:to-zinc-800 border-b-4 border-white dark:border-zinc-900">
                      <th className="px-3 py-3 text-xs font-semibold text-black dark:text-zinc-200 text-left min-w-[120px]">
                        CNR
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold text-black dark:text-zinc-200 text-left min-w-[120px]">
                        CASE NUMBER
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold text-black dark:text-zinc-200 text-left min-w-[200px]">
                        TITLE
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold text-black dark:text-zinc-200 text-left min-w-[120px]">
                        TYPE
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold text-black dark:text-zinc-200 text-left min-w-[120px]">
                        DECISION DATE
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold text-black dark:text-zinc-200 text-left min-w-[80px]">
                        FOLLOW
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold text-black dark:text-zinc-200 text-left min-w-[100px]">
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="border-y-4 border-white dark:border-zinc-900">
                    {filteredResults.map(
                      (result: HighCourtResult, index: number) => {
                        const caseId = result.cino || result.case_no;
                        return (
                          <tr
                            key={caseId}
                            className={`transition-colors hover:bg-blue-50 dark:hover:bg-zinc-800 ${
                              index % 2 === 0 ? "bg-white dark:bg-zinc-900" : "bg-blue-50 dark:bg-zinc-950"
                            } border-b-2 border-gray-100 dark:border-zinc-800 last:border-b-0`}
                          >
                            <td className="px-3 py-3 text-xs text-gray-700 dark:text-zinc-300">
                              {result.cino || "N/A"}
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-800 dark:text-zinc-200 font-medium">
                              {result.case_no || "N/A"}
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-700 dark:text-zinc-300">
                              <div
                                className="max-w-[200px] truncate"
                                title={`${result.pet_name || ""} vs ${result.res_name || ""}`}
                              >
                                {result.pet_name && result.res_name
                                  ? `${result.pet_name} vs ${result.res_name}`
                                  : result.pet_name || result.res_name || "N/A"}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-700 dark:text-zinc-300">
                              {result.type_name || "N/A"}
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-700 dark:text-zinc-300">
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
                                    : "text-gray-700 dark:text-zinc-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700"
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
                                disabled={loadingDetails === caseId}
                              >
                                {loadingDetails === caseId ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Eye className="w-3 h-3" />
                                )}
                                <span className="hidden sm:inline">
                                  {loadingDetails === caseId
                                    ? "Loading..."
                                    : "Details"}
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
      {!isLoading &&
        !isFetching &&
        searchResults.length === 0 &&
        !error &&
        !searchParams && (
          <div className="mt-6 p-8 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-blue-600" />
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
        <CaseDetailsModal
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
