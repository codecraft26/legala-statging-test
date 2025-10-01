"use client";

import React, { useState } from "react";
import { Search, Star, Eye, Loader2, X, ExternalLink } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useHighByFilingNumber, useFollowResearch, useUnfollowResearch, useHighDetail, useFollowedResearch } from "@/hooks/use-research";
import { getApiBaseUrl, getCookie } from "@/lib/utils";
import ResultsTable, { ColumnDef } from "./common/ResultsTable";
import SearchBar from "./common/SearchBar";
import Pagination from "./common/Pagination";
import FollowButton from "./common/FollowButton";
import StatusPill from "./common/StatusPill";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            import {
  stateCodeMapping,
  courtComplexMapping,
  courtCodeMapping,
} from "../utils/courtMappings";

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
                  value:
                    details.case_details?.filing_number ||
                    caseData.filing_no ||
                    "N/A",
                },
                {
                  label: "Filing Date",
                  value: formatDate(details.case_details?.filing_date) || "N/A",
                },
                {
                  label: "Registration Number",
                  value:
                    details.case_details?.registration_number ||
                    caseData.case_no ||
                    "N/A",
                },
                {
                  label: "Registration Date",
                  value:
                    formatDate(details.case_details?.registration_date) ||
                    "N/A",
                },
                {
                  label: "Case Type",
                  value: caseData.type_name || "N/A",
                },
                {
                  label: "Filing Year",
                  value: caseData.fil_year || "N/A",
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
                ) || <li className="text-sm">{caseData.pet_name || "N/A"}</li>}
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
                ) || <li className="text-sm">{caseData.res_name || "N/A"}</li>}
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
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Case Details</DialogTitle>
          <DialogDescription>High Court case information</DialogDescription>
        </DialogHeader>
        <div className="p-0">
          <div className="mb-6">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold mb-2">
                {`${
                  caseData.details?.case_details?.registration_number ||
                  caseData.case_no ||
                  "N/A"
                } - ${
                  caseData.details?.petitioner_and_advocate?.[0]?.split(
                    "    "
                  )[0] ||
                  caseData.pet_name ||
                  "Unknown"
                } vs. ${
                  caseData.details?.respondent_and_advocate?.[0] ||
                  caseData.res_name ||
                  "Unknown"
                }`}
              </h2>
              <FollowButton
                isFollowing={followedCases.has(caseData.cino || caseData.case_no)}
                loading={followMutation.isPending || unfollowMutation.isPending}
                onClick={() => handleFollowCase(caseData)}
              />
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
              <StatusPill
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
          <div className="mb-2">{renderTabContent()}</div>
        </div>
        <DialogFooter>
          <button onClick={onClose} className="border border-gray-300 text-gray-800 px-4 py-2 rounded-md">Close</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

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
    const html = typeof raw?.data === "string" ? raw.data : typeof raw === "string" ? raw : "";
    const details = html || raw;
    setSelectedCase({
      ...(currentPageResults.find((r) => String(r.cino || r.case_no) === caseId) || ({} as any)),
      details,
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
                Case Number *
              </label>
              <input
                type="number"
                value={caseNo}
                onChange={(e) => setCaseNo(e.target.value)}
                className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
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
                className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
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
                className="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
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
            (() => {
              const columns: ColumnDef<HighCourtResult>[] = [
                { key: "cino", header: "CNR", width: 120, render: (r) => r.cino || "N/A" },
                { key: "case_title", header: "CASE TITLE", width: 220, render: (r) => (
                  <div className="max-w-[220px] truncate" title={`${r.pet_name || ""} vs ${r.res_name || ""}`}>
                    {r.pet_name && r.res_name ? `${r.pet_name} vs ${r.res_name}` : r.pet_name || r.res_name || "N/A"}
                  </div>
                ) },
                { key: "case_no", header: "CASE NUMBER", width: 120, render: (r) => (
                  <span className="font-medium">{r.case_no}</span>
                ) },
                { key: "type_name", header: "TYPE", width: 120, render: (r) => r.type_name || "N/A" },
                { key: "follow", header: "FOLLOW", width: 120, render: (r) => {
                  const already = isRowFollowed(r);
                  return (
                    <button
                      className={`border border-gray-300 rounded px-2 py-1 ${
                        already ? "bg-gray-200 text-gray-800" : "bg-white text-gray-800"
                      }`}
                      onClick={() => handleFollowCase(r)}
                      disabled={followMutation.isPending || unfollowMutation.isPending || already}
                    >
                      {followMutation.isPending || unfollowMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <div className="flex items-center gap-1">
                          <Star size={12} className={already ? "text-black" : "text-gray-600"} />
                          <span className="hidden sm:inline">{already ? "Followed" : "Follow"}</span>
                        </div>
                      )}
                    </button>
                  );
                } },
                { key: "actions", header: "ACTIONS", width: 120, render: (r) => {
                  const caseId = r.cino || r.case_no;
                  return (
                    <button
                      className="border border-gray-300 rounded px-2 py-1"
                      onClick={() => handleViewDetails(r)}
                      disabled={loadingDetails === caseId}
                    >
                      {loadingDetails === caseId ? (
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
                <div className="w-full overflow-x-auto border border-gray-200 rounded-md bg-white">
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
              <Search className="h-8 w-8 text-blue-600" />
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
