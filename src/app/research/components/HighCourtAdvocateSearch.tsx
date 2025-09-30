"use client";

import React, { useState } from "react";
import { Search, Star, Eye, Loader2, X, ExternalLink } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useHighByAdvocate, useFollowResearch, useUnfollowResearch, useHighDetail } from "@/hooks/use-research";
import { getApiBaseUrl, getCookie } from "@/lib/utils";
import {
  stateCodeMapping,
  courtComplexMapping,
  courtCodeMapping,
} from "../utils/courtMappings";
import SearchBar from "./common/SearchBar";
import Pagination from "./common/Pagination";
import FollowButton from "./common/FollowButton";
import StatusPill from "./common/StatusPill";
import ResultsTable, { ColumnDef } from "./common/ResultsTable";

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

// Parse High Court HTML details into structured object expected by the UI
function parseHighCourtHtml(html: string): any {
  try {
    const container = document.createElement("div");
    container.innerHTML = html;

    const getText = (selector: string) =>
      (container.querySelector(selector)?.textContent || "").trim();

    const getCellAfterLabel = (tableSelector: string, label: string): string => {
      const table = container.querySelector(tableSelector);
      if (!table) return "";
      const tds = Array.from(table.querySelectorAll("td"));
      for (let i = 0; i < tds.length - 1; i++) {
        const labelText = tds[i].textContent?.replace(/\s+/g, " ").trim() || "";
        if (labelText.toLowerCase().includes(label.toLowerCase())) {
          return (tds[i + 1].textContent || "").trim();
        }
      }
      return "";
    };

    // Case details table (first table under "Case Details")
    const caseDetailsTable = container.querySelector(".case_details_table");
    const case_details = {
      filing_number: getCellAfterLabel(".case_details_table", "Filing Number") || "",
      filing_date: getCellAfterLabel(".case_details_table", "Filing Date") || "",
      registration_number:
        getCellAfterLabel(".case_details_table", "Registration Number") || "",
      registration_date:
        getCellAfterLabel(".case_details_table", "Registration Date") || "",
      cnr_number: (container.querySelector(".case_details_table tr strong")?.textContent || "").trim() || "",
    };

    // Case Status table (after "Case Status")
    const statusTable = Array.from(container.querySelectorAll("table")).find((t) =>
      /Case Status/i.test(t.previousElementSibling?.textContent || "")
    );
    const statusRows = statusTable ? Array.from(statusTable.querySelectorAll("tr")) : [];
    const statusMap: Record<string, string> = {};
    statusRows.forEach((tr) => {
      const cells = tr.querySelectorAll("td");
      if (cells.length >= 2) {
        const key = (cells[0].textContent || "").replace(/\s+/g, " ").trim();
        const value = (cells[1].textContent || "").replace(/\s+/g, " ").trim();
        statusMap[key.toLowerCase()] = value;
      }
    });
    const case_status = {
      first_hearing_date: statusMap["first hearing date"] || "",
      decision_date: statusMap["decision date"] || "",
      stage_of_case: statusMap["case status"] || "",
      nature_of_disposal: statusMap["nature of disposal"] || "",
      coram: statusMap["coram"] || "",
      judicial_branch: statusMap["judicial branch"] || "",
      not_before_me: statusMap["not before me"] || "",
    };

    // Parties and advocates
    const petitionerSpan = container.querySelector(".Petitioner_Advocate_table");
    const respondentSpan = container.querySelector(".Respondent_Advocate_table");
    const petitioner_and_advocate = petitionerSpan
      ? (petitionerSpan.textContent || "")
          .split(/\n|<br\s*\/?>(?=\s*)/gi as any)
          .map((s) => String(s).trim())
          .filter(Boolean)
      : [];
    const respondent_and_advocate = respondentSpan
      ? (respondentSpan.textContent || "")
          .split(/\n|<br\s*\/?>(?=\s*)/gi as any)
          .map((s) => String(s).trim())
          .filter(Boolean)
      : [];

    // Orders table
    const ordersHeader = Array.from(container.querySelectorAll("h2")).find((h) =>
      /Orders/i.test(h.textContent || "")
    );
    const ordersTable = ordersHeader?.parentElement?.nextElementSibling as HTMLTableElement | null;
    const orders: any[] = [];
    if (ordersTable) {
      const rows = Array.from(ordersTable.querySelectorAll("tr")).slice(1);
      rows.forEach((tr) => {
        const tds = tr.querySelectorAll("td");
        if (tds.length >= 5) {
          const link = tds[4].querySelector("a") as HTMLAnchorElement | null;
          orders.push({
            order_number: (tds[0].textContent || "").trim(),
            case_no: (tds[1].textContent || "").trim(),
            judge: (tds[2].textContent || "").trim(),
            order_date: (tds[3].textContent || "").trim(),
            order_details: link?.href || "",
          });
        }
      });
    }

    // IA details table
    const iaHeader = Array.from(container.querySelectorAll("h2")).find((h) =>
      /IA Details/i.test(h.textContent || "")
    );
    const iaTable = iaHeader?.nextElementSibling as HTMLTableElement | null;
    const ia_details: any[] = [];
    if (iaTable) {
      const rows = Array.from(iaTable.querySelectorAll("tr")).slice(1);
      rows.forEach((tr) => {
        const tds = tr.querySelectorAll("td, th");
        if (tds.length >= 5) {
          ia_details.push({
            ia_number: (tds[0].textContent || "").replace(/\s+/g, " ").trim(),
            party: (tds[1].textContent || "").trim(),
            date_of_filing: (tds[2].textContent || "").trim(),
            next_date: (tds[3].textContent || "").trim(),
            ia_status: (tds[4].textContent || "").trim(),
          });
        }
      });
    }

    return {
      case_details,
      case_status,
      petitioner_and_advocate,
      respondent_and_advocate,
      orders,
      ia_details,
    };
  } catch (e) {
    console.warn("Failed to parse High Court HTML details:", e);
    return {};
  }
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

  const queryClient = useQueryClient();
  const advocateQuery = useHighByAdvocate(searchParams);
  const followMutation = useFollowResearch();
  const unfollowMutation = useUnfollowResearch();

  // Filter search results based on searchQuery
  const rawResults: HighCourtResult[] = Array.isArray(advocateQuery.data)
    ? (advocateQuery.data as HighCourtResult[])
    : Array.isArray((advocateQuery.data as any)?.results)
    ? ((advocateQuery.data as any).results as HighCourtResult[])
    : Array.isArray((advocateQuery.data as any)?.data)
    ? ((advocateQuery.data as any).data as HighCourtResult[])
    : Array.isArray((advocateQuery.data as any)?.cases)
    ? ((advocateQuery.data as any).cases as HighCourtResult[])
    : [];

  const filteredResults = rawResults.filter((result: HighCourtResult) =>
    Object.values(result).some((value: any) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Pagination calculations
  const total = filteredResults.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const currentPageResults = filteredResults.slice(startIndex, endIndex);

  // Reset page when results change
  React.useEffect(() => {
    setPage(1);
  }, [advocateQuery.isFetching, searchQuery, JSON.stringify(searchParams)]);

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
    setDetailParams({
      case_no: Number(result.case_no),
      state_code: Number(result.state_cd),
      cino: result.cino,
      court_code: Number(result.court_code),
      national_court_code: "DLHC01",
      dist_cd: 1,
    });
  };

  // TanStack Query mutations for follow/unfollow
  // (defined above)

  const handleFollowCase = (caseData: HighCourtResult) => {
    const caseId = caseData.cino || caseData.case_no;

    if (followedCases.has(caseId)) {
      unfollowMutation.mutate(caseId);
    } else {
      followMutation.mutate({
        court: "High_Court",
        followed: caseData,
        workspaceId: "current-workspace",
      });
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
                disabled={advocateQuery.isLoading || advocateQuery.isFetching}
              >
                {advocateQuery.isLoading || advocateQuery.isFetching ? (
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
      {advocateQuery.error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
            <div>
              <p className="text-red-700 dark:text-red-400 font-medium">Search Error</p>
              <p className="text-red-600 dark:text-red-300 text-sm mt-1">{advocateQuery.error instanceof Error ? advocateQuery.error.message : "An error occurred while searching"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {!advocateQuery.isLoading && !advocateQuery.isFetching && filteredResults.length > 0 && (
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
      {!advocateQuery.isLoading && !advocateQuery.isFetching && filteredResults.length > 0 && (
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
            (() => {
              const columns: ColumnDef<HighCourtResult>[] = [
                { key: "cino", header: "CNR", width: 160, render: (r) => r.cino || "N/A" },
                { key: "case_no", header: "CASE NUMBER", width: 140, render: (r) => r.case_no || "N/A" },
                { key: "title", header: "TITLE", width: 240, render: (r) => (
                  <div className="max-w-[220px] truncate" title={`${r.pet_name || ""} vs ${r.res_name || ""}`}>
                    {r.pet_name && r.res_name ? `${r.pet_name} vs ${r.res_name}` : r.pet_name || r.res_name || "N/A"}
                  </div>
                ) },
                { key: "type_name", header: "TYPE", width: 120, render: (r) => r.type_name || "N/A" },
                { key: "date_of_decision", header: "DECISION DATE", width: 140, render: (r) => (
                  r.date_of_decision ? new Date(r.date_of_decision).toLocaleDateString("en-IN") : "N/A"
                ) },
                { key: "follow", header: "FOLLOW", width: 120, render: (r) => (
                  <FollowButton
                    isFollowing={followedCases.has(r.cino || r.case_no)}
                    loading={followMutation.isPending || unfollowMutation.isPending}
                    onClick={() => handleFollowCase(r)}
                    compact
                  />
                ) },
                { key: "actions", header: "ACTIONS", width: 140, render: (r) => {
                  const caseId = r.cino || r.case_no;
                  return (
                    <button
                      className="border border-border rounded px-2 py-1 bg-background text-foreground"
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
                <div className="w-full overflow-x-auto border border-border rounded-md bg-card text-card-foreground">
                  <ResultsTable
                    columns={columns}
                    rows={currentPageResults}
                    rowKey={(row) => row.cino || row.case_no}
                    tableClassName="min-w-full"
                    headerRowClassName="bg-muted"
                  />
                </div>
              );
            })()
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
