"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, Star, Eye, Loader2, X, Download } from "lucide-react";
import SearchBar from "./common/SearchBar";
import Pagination from "./common/Pagination";
import {
  useDistrictByParty,
  useDistrictDetail,
  useFollowResearch,
  useUnfollowResearch,
  useFollowedResearch,
} from "@/hooks/use-research";
import { districtId } from "../utils/districtId";
import { useDistrictsIndex } from "@/hooks/use-research";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { useEstCodes } from "@/hooks/use-est-codes";
import ResultsTable, { ColumnDef } from "./common/ResultsTable";
import { getCookie } from "@/lib/utils";

interface DistrictCourtResult {
  cino: string;
  district_name: string;
  litigant_name?: string;
  case_status?: string;
  petitioner_name?: string;
  respondent_name?: string;
  status?: string;
  case_type?: string;
  case_number?: string;
  case_year?: string;
  serial_number?: string;
  court_name?: string;
  est_code?: string;
}

interface CaseDetails {
  [key: string]: any;
}

interface ParsedCaseDetails {
  courtName: string;
  caseInfo: {
    caseType: string;
    filingNumber: string;
    filingDate: string;
    registrationNumber: string;
    registrationDate: string;
    cnrNumber: string;
  };
  caseStatus: {
    firstHearingDate: string;
    nextHearingDate: string;
    caseStatus: string;
    stageOfCase: string;
    courtNumberAndJudge: string;
  };
  parties: {
    petitioners: Array<{
      name: string;
      advocate?: string;
    }>;
    respondents: Array<{
      name: string;
      advocate?: string;
    }>;
  };
  acts: Array<{
    act: string;
    sections: string;
  }>;
  caseHistory: Array<{
    registrationNumber: string;
    judge: string;
    businessOnDate: string;
    hearingDate: string;
    purposeOfHearing: string;
  }>;
  processDetails: Array<{
    processId: string;
    processDate: string;
    processTitle: string;
    partyName: string;
    issuedProcess: string;
  }>;
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

// Case Details Modal - Simple table format like old React code
const CaseDetailsModal = ({
  caseData,
  onClose,
}: {
  caseData: ParsedCaseDetails | null;
  onClose: () => void;
}) => {
  const [activeTab, setActiveTab] = useState("overview");

  if (!caseData) return null;

  // Function to get available tabs based on data
  const getAvailableTabs = () => {
    if (!caseData) return ["overview"];
    const tabs = ["overview", "parties"];
    if (caseData.acts.length > 0) tabs.push("acts");
    if (caseData.caseHistory.length > 0) tabs.push("history");
    return tabs;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold">Case Details</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const dataStr = JSON.stringify(caseData, null, 2);
                const dataBlob = new Blob([dataStr], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `case-details-${caseData.caseInfo.cnrNumber || "unknown"}.json`;
                link.click();
                URL.revokeObjectURL(url);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Download size={18} />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Case Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">
              {caseData.caseInfo.cnrNumber || "N/A"}
            </h2>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-black text-sm font-medium">
                CNR: {caseData.caseInfo.cnrNumber || "N/A"}
              </span>
              <span className="text-black text-sm mx-2 font-medium">|</span>
              <span className="text-black text-sm font-medium">
                Filed: {caseData.caseInfo.filingDate || "N/A"}
              </span>
              <span className="text-black text-sm mx-2 font-medium">|</span>
              <StatusBadge
                status={caseData.caseStatus.caseStatus || "PENDING"}
              />
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="border-b mb-4">
            <div className="flex overflow-x-auto">
              {getAvailableTabs().map((tab) => (
                <button
                  key={tab}
                  className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="mb-4">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Case Information Table */}
                <div className="mb-6">
                  <h3 className="font-medium mb-4">Case Information</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-2 text-left text-xs font-medium text-gray-500">
                            Field
                          </th>
                          <th className="border border-gray-300 p-2 text-left text-xs font-medium text-gray-500">
                            Value
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2 text-sm font-medium">
                            Case Type
                          </td>
                          <td className="border border-gray-300 p-2 text-sm">
                            {caseData.caseInfo.caseType || "N/A"}
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2 text-sm font-medium">
                            Filing Number
                          </td>
                          <td className="border border-gray-300 p-2 text-sm">
                            {caseData.caseInfo.filingNumber || "N/A"}
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2 text-sm font-medium">
                            Filing Date
                          </td>
                          <td className="border border-gray-300 p-2 text-sm">
                            {caseData.caseInfo.filingDate || "N/A"}
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2 text-sm font-medium">
                            Registration Number
                          </td>
                          <td className="border border-gray-300 p-2 text-sm">
                            {caseData.caseInfo.registrationNumber || "N/A"}
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2 text-sm font-medium">
                            Registration Date
                          </td>
                          <td className="border border-gray-300 p-2 text-sm">
                            {caseData.caseInfo.registrationDate || "N/A"}
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2 text-sm font-medium">
                            CNR Number
                          </td>
                          <td className="border border-gray-300 p-2 text-sm font-mono">
                            {caseData.caseInfo.cnrNumber || "N/A"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Case Status Table */}
                <div className="mb-6">
                  <h3 className="font-medium mb-4">Status Information</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-2 text-left text-xs font-medium text-gray-500">
                            Field
                          </th>
                          <th className="border border-gray-300 p-2 text-left text-xs font-medium text-gray-500">
                            Value
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2 text-sm font-medium">
                            Case Status
                          </td>
                          <td className="border border-gray-300 p-2 text-sm">
                            <StatusBadge
                              status={caseData.caseStatus.caseStatus || "N/A"}
                            />
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2 text-sm font-medium">
                            Stage of Case
                          </td>
                          <td className="border border-gray-300 p-2 text-sm">
                            {caseData.caseStatus.stageOfCase || "N/A"}
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2 text-sm font-medium">
                            First Hearing Date
                          </td>
                          <td className="border border-gray-300 p-2 text-sm">
                            {caseData.caseStatus.firstHearingDate || "N/A"}
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2 text-sm font-medium">
                            Next Hearing Date
                          </td>
                          <td className="border border-gray-300 p-2 text-sm">
                            {caseData.caseStatus.nextHearingDate || "N/A"}
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2 text-sm font-medium">
                            Court Number and Judge
                          </td>
                          <td className="border border-gray-300 p-2 text-sm">
                            {caseData.caseStatus.courtNumberAndJudge || "N/A"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "parties" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Petitioners</h3>
                  <ul className="bg-gray-50 p-4 rounded-md space-y-2">
                    {caseData.parties.petitioners.length > 0 ? (
                      caseData.parties.petitioners.map((petitioner, index) => (
                        <li key={index} className="text-sm">
                          {petitioner.name}
                          {petitioner.advocate && (
                            <span className="text-gray-600">
                              {" "}
                              (Adv: {petitioner.advocate})
                            </span>
                          )}
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-gray-500">
                        No petitioner information available
                      </li>
                    )}
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Respondents</h3>
                  <ul className="bg-gray-50 p-4 rounded-md space-y-2">
                    {caseData.parties.respondents.length > 0 ? (
                      caseData.parties.respondents.map((respondent, index) => (
                        <li key={index} className="text-sm">
                          {respondent.name}
                          {respondent.advocate && (
                            <span className="text-gray-600">
                              {" "}
                              (Adv: {respondent.advocate})
                            </span>
                          )}
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-gray-500">
                        No respondent information available
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "acts" && (
              <div>
                <h3 className="font-medium mb-4">Acts and Sections</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  {caseData.acts.length > 0 ? (
                    <div className="space-y-3">
                      <div className="border-b pb-3">
                        <p className="text-sm text-gray-500">Acts</p>
                        <p className="text-sm font-medium">
                          {caseData.acts.map((act) => act.act).join(", ") ||
                            "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Sections</p>
                        <p className="text-sm font-medium">
                          {caseData.acts
                            .map((act) => act.sections)
                            .join(", ") || "N/A"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No acts and sections information available
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div>
                <h3 className="font-medium mb-4">Case History</h3>
                {caseData.caseHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-2 text-left text-xs font-medium text-gray-500">
                            Business Date
                          </th>
                          <th className="border border-gray-300 p-2 text-left text-xs font-medium text-gray-500">
                            Hearing Date
                          </th>
                          <th className="border border-gray-300 p-2 text-left text-xs font-medium text-gray-500">
                            Purpose
                          </th>
                          <th className="border border-gray-300 p-2 text-left text-xs font-medium text-gray-500">
                            Judge
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {caseData.caseHistory.map((history, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-300 p-2 text-sm">
                              {history.businessOnDate}
                            </td>
                            <td className="border border-gray-300 p-2 text-sm">
                              {history.hearingDate}
                            </td>
                            <td className="border border-gray-300 p-2 text-sm">
                              {history.purposeOfHearing || "N/A"}
                            </td>
                            <td className="border border-gray-300 p-2 text-sm">
                              {history.judge || "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700">
                    No history records available for this case.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="border-t p-4 flex justify-end">
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

export default function DistrictCourtSearch() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [stateName, setStateName] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [districtName, setDistrictName] = useState("srinagar");
  const districtsQuery = useDistrictsIndex();
  const states = useMemo(
    () => (districtsQuery.data?.data || []).map((d) => d.state),
    [districtsQuery.data]
  );
  const filteredStates = useMemo(
    () =>
      states.filter((s) =>
        s.toLowerCase().includes(stateSearch.trim().toLowerCase())
      ),
    [states, stateSearch]
  );
  const apiDistricts = useMemo(() => {
    const entry = (districtsQuery.data?.data || []).find(
      (d) => d.state === stateName
    );
    return entry?.districts || [];
  }, [districtsQuery.data, stateName]);

  useEffect(() => {
    if (!stateName && states.length > 0) {
      setStateName(states[0]);
    }
  }, [states, stateName]);

  useEffect(() => {
    if (apiDistricts.length > 0) {
      setDistrictName((prev) => (prev ? prev : apiDistricts[0]));
    }
  }, [apiDistricts]);
  const [litigantName, setLitigantName] = useState("");
  const [regYear, setRegYear] = useState(new Date().getFullYear().toString());
  const [caseStatus, setCaseStatus] = useState("P");
  const [selectedEstCodes, setSelectedEstCodes] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<{
    [courtName: string]: DistrictCourtResult[];
  }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState<ParsedCaseDetails | null>(
    null
  );
  const [showCaseDetails, setShowCaseDetails] = useState(false);
  const [followedCases, setFollowedCases] = useState<Set<string>>(new Set());
  const [followLoading, setFollowLoading] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(20);
  const [pageByCourt, setPageByCourt] = useState<Record<string, number>>({});
  const [estMenuOpen, setEstMenuOpen] = useState(false);
  const [detailParams, setDetailParams] = useState<{ cino: string; district_name: string } | null>(null);

  const [partyParams, setPartyParams] = useState<
    | {
        district_name: string;
        litigant_name: string;
        reg_year: number;
        case_status: string;
        est_code: string;
      }
    | null
  >(null);
  const partyQuery = useDistrictByParty(partyParams);
  const followMutation = useFollowResearch();
  const unfollowMutation = useUnfollowResearch();
  const followedQuery = useFollowedResearch(workspaceId || "", "District_Court");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWorkspaceId(getCookie("workspaceId"));
    }
  }, []);

  useEffect(() => {
    const items = (followedQuery.data as any)?.data || followedQuery.data || [];
    if (Array.isArray(items)) {
      const ids = new Set<string>();
      items.forEach((item: any) => {
        const cino = item?.followed?.["View"] || item?.followed?.cino || "";
        if (cino) ids.add(String(cino));
      });
      setFollowedCases(ids);
    }
  }, [followedQuery.data]);

  const {
    getEstCodeOptionsForDistrict,
    loading: estLoading,
    error: estError,
  } = useEstCodes();

  const estCodeOptions = useMemo(() => {
    return districtName ? getEstCodeOptionsForDistrict(districtName) : [];
  }, [districtName, getEstCodeOptionsForDistrict]);

  // Parse query response into grouped results when data arrives (supports HTML and JSON)
  React.useEffect(() => {
    const raw = partyQuery.data as any;
    if (!raw) return;

    // Case 1: HTML string payload (existing flow)
    let html: string | null = null;
    if (typeof raw === "string") html = raw;
    else if (typeof raw?.data === "string") html = raw.data;
    else if (typeof raw?.data?.data === "string") html = raw.data.data;
    if (html) {
      const parsed = parseDistrictCourtHTML(html);
      setSearchResults(parsed);
      return;
    }

    // Case 2: JSON array payload from API
    const arrayData: any[] | undefined = Array.isArray(raw)
      ? (raw as any[])
      : Array.isArray(raw?.data)
      ? (raw.data as any[])
      : undefined;
    if (arrayData && arrayData.length > 0) {
      const mapped: DistrictCourtResult[] = arrayData.map((row: any) => {
        const serial = String(row["Serial Number"] ?? row.serial_number ?? "").trim();
        const caseCombo = String(row["Case Type/Case Number/Case Year"] ?? "").trim();
        const party = String(row["Petitioner versus Respondent"] ?? "").trim();
        const view = String(row["View"] ?? row.cino ?? "").trim();

        let case_type = "";
        let case_number = "";
        let case_year = "";
        if (caseCombo) {
          const parts = caseCombo.split("/");
          case_type = (parts[0] || "").trim();
          case_number = (parts[1] || "").trim();
          case_year = (parts[2] || "").trim();
        }

        let petitioner = "";
        let respondent = "";
        if (party) {
          const lower = party.toLowerCase();
          const idx = lower.indexOf("versus");
          if (idx >= 0) {
            petitioner = party.slice(0, idx).trim();
            respondent = party.slice(idx + "versus".length).trim();
          } else {
            petitioner = party;
          }
        }

        return {
          cino: view,
          district_name: districtName,
          litigant_name: litigantName,
          case_status: caseStatus,
          petitioner_name: petitioner,
          respondent_name: respondent,
          case_type,
          case_number,
          case_year,
          serial_number: serial,
          court_name: "Search Results",
          est_code: "",
        } as DistrictCourtResult;
      });
      setSearchResults({ "Search Results": mapped });
      return;
    }

    // Default: clear
    setSearchResults({});
  }, [partyQuery.data, districtName, litigantName, caseStatus]);

  // Generate years for dropdown (last 30 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) =>
    (currentYear - i).toString()
  );

  // Fallback: unique districts from static map (used if API not loaded yet)
  const uniqueDistricts = useMemo(() =>
    Array.from(new Set(districtId.map((d) => d.name.toLowerCase()))).sort(), []);

  // Filter search results based on searchQuery
  const filteredResults = useMemo(() => {
    if (!searchQuery) return searchResults;

    const filtered: { [courtName: string]: DistrictCourtResult[] } = {};

    Object.entries(searchResults).forEach(([courtName, cases]) => {
      const filteredCases = cases.filter((result) =>
        Object.values(result).some((value) =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );

      if (filteredCases.length > 0) {
        filtered[courtName] = filteredCases;
      }
    });

    return filtered;
  }, [searchResults, searchQuery]);

  // Ensure pagination state exists for each court and stays in range
  useEffect(() => {
    const nextPages: Record<string, number> = {};
    Object.entries(filteredResults).forEach(([courtName, cases]) => {
      const totalPages = Math.max(1, Math.ceil(cases.length / pageSize));
      const current = pageByCourt[courtName] || 1;
      nextPages[courtName] = Math.min(Math.max(1, current), totalPages);
    });
    setPageByCourt(nextPages);
  }, [filteredResults, pageSize]);

  // Handle EST code selection
  const handleEstCodeToggle = (estCode: string) => {
    setSelectedEstCodes((prev) => {
      if (prev.includes(estCode)) {
        return prev.filter((code) => code !== estCode);
      } else {
        return [...prev, estCode];
      }
    });
  };

  // Select all EST codes for the district
  const handleSelectAllEstCodes = () => {
    setSelectedEstCodes(estCodeOptions.map((option) => option.code));
  };

  // Clear all EST code selections
  const handleClearAllEstCodes = () => {
    setSelectedEstCodes([]);
  };

  // Function to parse case details HTML response
  const parseCaseDetailsHTML = (
    htmlString: string
  ): ParsedCaseDetails | null => {
    try {
      if (!htmlString || typeof htmlString !== "string") {
        console.error("Invalid HTML string provided");
        return null;
      }

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlString;

      // Extract court name
      const courtNameElement = tempDiv.querySelector("h2");
      const courtName = courtNameElement?.textContent?.trim() || "Civil Court";

      // Extract case details from first table with "Case Details" caption
      const caseDetailsCaption = Array.from(
        tempDiv.querySelectorAll("caption")
      ).find((caption) => caption.textContent?.includes("Case Details"));
      const caseDetailsTable =
        caseDetailsCaption?.parentElement?.querySelector("tbody tr");
      const caseInfo = {
        caseType: caseDetailsTable?.children[0]?.textContent?.trim() || "",
        filingNumber: caseDetailsTable?.children[1]?.textContent?.trim() || "",
        filingDate: caseDetailsTable?.children[2]?.textContent?.trim() || "",
        registrationNumber:
          caseDetailsTable?.children[3]?.textContent?.trim() || "",
        registrationDate:
          caseDetailsTable?.children[4]?.textContent?.trim() || "",
        cnrNumber: caseDetailsTable?.children[5]?.textContent?.trim() || "",
      };

      // Extract case status from table with "Case Status" caption
      const statusCaption = Array.from(
        tempDiv.querySelectorAll("caption")
      ).find((caption) => caption.textContent?.includes("Case Status"));
      const statusTable =
        statusCaption?.parentElement?.querySelector("tbody tr");
      const caseStatus = {
        firstHearingDate: statusTable?.children[0]?.textContent?.trim() || "",
        nextHearingDate: statusTable?.children[1]?.textContent?.trim() || "",
        caseStatus: statusTable?.children[2]?.textContent?.trim() || "",
        stageOfCase: statusTable?.children[3]?.textContent?.trim() || "",
        courtNumberAndJudge:
          statusTable?.children[4]?.textContent?.trim() || "",
      };

      // Extract parties information
      const petitioners: Array<{ name: string; advocate?: string }> = [];
      const respondents: Array<{ name: string; advocate?: string }> = [];

      // Parse petitioner section - look for "Petitioner and Advocate" heading
      const petitionerHeading = Array.from(tempDiv.querySelectorAll("h5")).find(
        (h5) => h5.textContent?.includes("Petitioner")
      );
      if (petitionerHeading) {
        const petitionerSection = petitionerHeading.nextElementSibling;
        if (petitionerSection) {
          const petitionerItems = petitionerSection.querySelectorAll("li");
          petitionerItems.forEach((item) => {
            const nameElement = item.querySelector("p");
            const advocateText = item.textContent || "";
            const name = nameElement?.textContent?.trim() || "";
            const advocateMatch = advocateText.match(/Advocate - (.+)/);
            const advocate = advocateMatch
              ? advocateMatch[1].trim()
              : undefined;

            if (name) {
              petitioners.push({ name, advocate });
            }
          });
        }
      }

      // Parse respondent section - look for "Respondent and Advocate" heading
      const respondentHeading = Array.from(tempDiv.querySelectorAll("h5")).find(
        (h5) => h5.textContent?.includes("Respondent")
      );
      if (respondentHeading) {
        const respondentSection = respondentHeading.nextElementSibling;
        if (respondentSection) {
          const respondentItems = respondentSection.querySelectorAll("li");
          respondentItems.forEach((item) => {
            const nameElement = item.querySelector("p");
            const name = nameElement?.textContent?.trim() || "";

            if (name) {
              respondents.push({ name });
            }
          });
        }
      }

      // Extract acts information - look for "Acts" caption
      const acts: Array<{ act: string; sections: string }> = [];
      const actsCaption = Array.from(tempDiv.querySelectorAll("caption")).find(
        (caption) => caption.textContent?.includes("Acts")
      );
      if (actsCaption) {
        const actsTable = actsCaption.parentElement?.querySelector("tbody");
        if (actsTable) {
          const actRows = actsTable.querySelectorAll("tr");
          actRows.forEach((row) => {
            const act = row.children[0]?.textContent?.trim() || "";
            const sections = row.children[1]?.textContent?.trim() || "";
            if (act) {
              acts.push({ act, sections });
            }
          });
        }
      }

      // Extract case history - look for "Case History" caption
      const caseHistory: Array<{
        registrationNumber: string;
        judge: string;
        businessOnDate: string;
        hearingDate: string;
        purposeOfHearing: string;
      }> = [];
      const historyCaption = Array.from(
        tempDiv.querySelectorAll("caption")
      ).find((caption) => caption.textContent?.includes("Case History"));
      if (historyCaption) {
        const historyTable =
          historyCaption.parentElement?.querySelector("tbody");
        if (historyTable) {
          const historyRows = historyTable.querySelectorAll("tr");
          historyRows.forEach((row) => {
            const registrationNumber =
              row.children[0]?.textContent?.trim() || "";
            const judge = row.children[1]?.textContent?.trim() || "";
            const businessOnDate = row.children[2]?.textContent?.trim() || "";
            const hearingDate = row.children[3]?.textContent?.trim() || "";
            const purposeOfHearing = row.children[4]?.textContent?.trim() || "";

            if (registrationNumber) {
              caseHistory.push({
                registrationNumber,
                judge,
                businessOnDate,
                hearingDate,
                purposeOfHearing,
              });
            }
          });
        }
      }

      // Extract process details - look for "Process Details" caption
      const processDetails: Array<{
        processId: string;
        processDate: string;
        processTitle: string;
        partyName: string;
        issuedProcess: string;
      }> = [];
      const processCaption = Array.from(
        tempDiv.querySelectorAll("caption")
      ).find((caption) => caption.textContent?.includes("Process Details"));
      if (processCaption) {
        const processTable =
          processCaption.parentElement?.querySelector("tbody");
        if (processTable) {
          const processRows = processTable.querySelectorAll("tr");
          processRows.forEach((row) => {
            const processId = row.children[0]?.textContent?.trim() || "";
            const processDate = row.children[1]?.textContent?.trim() || "";
            const processTitle = row.children[2]?.textContent?.trim() || "";
            const partyName = row.children[3]?.textContent?.trim() || "";
            const issuedProcess = row.children[4]?.textContent?.trim() || "";

            if (processId) {
              processDetails.push({
                processId,
                processDate,
                processTitle,
                partyName,
                issuedProcess,
              });
            }
          });
        }
      }

      return {
        courtName,
        caseInfo,
        caseStatus,
        parties: { petitioners, respondents },
        acts,
        caseHistory,
        processDetails,
      };
    } catch (error) {
      console.error("Error parsing case details HTML:", error);
      return null;
    }
  };

  // Function to parse HTML response from district court API and organize by court
  const parseDistrictCourtHTML = (
    htmlString: string
  ): { [courtName: string]: DistrictCourtResult[] } => {
    const courtResults: { [courtName: string]: DistrictCourtResult[] } = {};

    try {
      // Create a temporary DOM element to parse the HTML
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlString;

      // Find all table content divs
      const tableContents = tempDiv.querySelectorAll(".distTableContent");

      tableContents.forEach((tableContent) => {
        const estCode = tableContent.getAttribute("id") || "";
        const caption =
          tableContent.querySelector("caption")?.textContent || "";
        const tbody = tableContent.querySelector("tbody");

        if (tbody && caption) {
          const rows = tbody.querySelectorAll("tr");
          const courtCases: DistrictCourtResult[] = [];

          rows.forEach((row) => {
            const cells = row.querySelectorAll("td");
            if (cells.length >= 4) {
              const serialNumber = cells[0]?.textContent?.trim() || "";
              const caseInfo = cells[1]?.textContent?.trim() || "";
              const partyInfo = cells[2]?.textContent?.trim() || "";
              const viewLink = cells[3]?.querySelector("a");
              const cino = viewLink?.getAttribute("data-cno") || "";

              // Parse case type, number, and year from caseInfo
              const caseInfoParts = caseInfo.split("/");
              const caseType = caseInfoParts[0]?.trim() || "";
              const caseNumber = caseInfoParts[1]?.trim() || "";
              const caseYear = caseInfoParts[2]?.trim() || "";

              // Parse petitioner and respondent from partyInfo
              const partyParts = partyInfo.split("<br/>");
              let petitioner = "";
              let respondent = "";

              if (partyParts.length >= 2) {
                petitioner =
                  partyParts[0]?.replace(/<[^>]*>/g, "").trim() || "";
                const respondentPart =
                  partyParts[1]?.replace(/<[^>]*>/g, "").trim() || "";
                if (respondentPart.toLowerCase().includes("versus")) {
                  respondent = respondentPart.split("versus")[1]?.trim() || "";
                } else {
                  respondent = respondentPart;
                }
              } else {
                petitioner = partyInfo.replace(/<[^>]*>/g, "").trim();
              }

              if (cino) {
                courtCases.push({
                  cino,
                  district_name: districtName,
                  litigant_name: litigantName,
                  case_status: caseStatus,
                  petitioner_name: petitioner,
                  respondent_name: respondent,
                  case_type: caseType,
                  case_number: caseNumber,
                  case_year: caseYear,
                  serial_number: serialNumber,
                  court_name: caption,
                  est_code: estCode,
                });
              }
            }
          });

          if (courtCases.length > 0) {
            courtResults[caption] = courtCases;
          }
        }
      });
    } catch (error) {
      console.error("Error parsing HTML response:", error);
    }

    return courtResults;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedEstCodes.length === 0) {
      alert("Please select at least one EST code");
      return;
    }

    const nextParams = {
      district_name: districtName.toLowerCase(),
      litigant_name: litigantName,
      reg_year: parseInt(regYear),
      case_status: caseStatus,
      est_code: selectedEstCodes.join(","),
    };

    // Reset current results and pagination while new search runs
    setSearchResults({});
    setPageByCourt({});

    // If params are unchanged (same key), force a refetch so user doesn't need to refresh
    if (partyParams && JSON.stringify(partyParams) === JSON.stringify(nextParams)) {
      partyQuery.refetch();
    } else {
      setPartyParams(nextParams);
    }
  };

  const detailQuery = useDistrictDetail(detailParams);

  React.useEffect(() => {
    if (!detailParams) return;
    if (detailQuery.isLoading || detailQuery.isFetching) return;
    const caseId = detailParams.cino;
    if (detailQuery.error) {
      console.error("Failed to fetch case details:", detailQuery.error);
      setDetailsLoading(null);
      return;
    }
    const data: any = detailQuery.data;
    if (!data) return;
    const payload = typeof data?.data === "string" ? data.data : typeof data === "string" ? data : data;
    const parsedDetails = parseCaseDetailsHTML(payload);
    if (parsedDetails) {
      setSelectedCase(parsedDetails);
      setShowCaseDetails(true);
    }
    setDetailsLoading(null);
  }, [detailQuery.data, detailQuery.error, detailQuery.isLoading, detailQuery.isFetching, detailParams]);

  const handleViewDetails = (result: DistrictCourtResult) => {
    const caseId = result.cino;
    setDetailsLoading(caseId);
    setDetailParams({ cino: result.cino, district_name: result.district_name });
  };

  const handleFollowCase = async (caseData: DistrictCourtResult) => {
    const caseId = caseData.cino;
    const workspaceId = getCookie("workspaceId");
    
    if (!workspaceId) {
      alert("Please select a workspace to follow cases");
      return;
    }
    
    // Prevent duplicate follow
    if (followedCases.has(caseId)) {
      return;
    }

    setFollowLoading(caseId);

    try {
      // Create the followed object in the format expected by the API
      const followedData = {
        "Serial Number": caseData.serial_number || "",
        "Case Type/Case Number/Case Year": `${caseData.case_type || ""}/${caseData.case_number || ""}/${caseData.case_year || ""}`,
        "Petitioner versus Respondent": `${caseData.petitioner_name || ""} Versus ${caseData.respondent_name || ""}`,
        "View": caseData.cino
      };
      
      await followMutation.mutateAsync({
        court: "District_Court",
        followed: followedData,
        workspaceId: workspaceId,
      });
      setFollowedCases((prev) => new Set(prev).add(caseId));
    } catch (err) {
      console.error("Follow/unfollow failed:", err);
    } finally {
      setFollowLoading(null);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-foreground">
        District Court Cases by Party Name
      </h2>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-md border border-gray-200 dark:border-zinc-800 max-w-2xl">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-zinc-300">
                State
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full text-left border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md px-3 py-2">
                  {stateName || "Select state"}
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 max-h-72 overflow-y-auto">
                  {districtsQuery.isLoading ? (
                    <DropdownMenuItem>Loading…</DropdownMenuItem>
                  ) : districtsQuery.error ? (
                    <DropdownMenuItem>Error loading</DropdownMenuItem>
                  ) : (
                    states.map((s) => (
                      <DropdownMenuItem key={s} onClick={() => setStateName(s)}>
                        {s}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-zinc-300">
                District Name *
              </label>
              <select
                value={districtName}
                onChange={(e) => setDistrictName(e.target.value)}
                className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
                required
                disabled={districtsQuery.isLoading || (!!stateName && apiDistricts.length === 0)}
              >
                {(stateName && apiDistricts.length > 0 ? apiDistricts : uniqueDistricts).map((district) => (
                  <option key={district} value={district}>
                    {district.charAt(0).toUpperCase() + district.slice(1)}
                  </option>
                ))}
              </select>
              <div className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                {stateName ? `From ${stateName}` : "Example: srinagar"}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-zinc-300">
                Litigant Name *
              </label>
              <input
                type="text"
                value={litigantName}
                onChange={(e) => setLitigantName(e.target.value)}
                className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
                placeholder="Enter litigant name"
                required
              />
              <div className="text-sm text-gray-500 mt-1">Example: Ashok</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-zinc-300">
                Registration Year
              </label>
              <select
                value={regYear}
                onChange={(e) => setRegYear(e.target.value)}
                className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-zinc-300">
                Case Status
              </label>
              <select
                value={caseStatus}
                onChange={(e) => setCaseStatus(e.target.value)}
                className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="P">P (Pending)</option>
                <option value="D">D (Disposed)</option>
                <option value="A">A (All)</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-zinc-300">
                Establishment Code *
              </label>
              <div className="flex gap-2 mb-2">
                <DropdownMenu open={estMenuOpen} onOpenChange={setEstMenuOpen}>
                  <DropdownMenuTrigger className="px-3 py-2 text-sm border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md">
                    {selectedEstCodes.length > 0 ? `${selectedEstCodes.length} selected` : "Select EST codes"}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-96 max-h-72 overflow-y-auto">
                    {estLoading ? (
                      <div className="flex items-center justify-center py-2 px-2 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading EST codes...
                      </div>
                    ) : estError ? (
                      <div className="py-2 px-2 text-sm text-red-600">Error loading EST codes: {estError}</div>
                    ) : estCodeOptions.length > 0 ? (
                      <>
                        <DropdownMenuItem onSelect={(e)=>e.preventDefault()} onClick={handleSelectAllEstCodes} className="text-xs">Select All</DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e)=>e.preventDefault()} onClick={handleClearAllEstCodes} className="text-xs">Clear All</DropdownMenuItem>
                        <div className="h-px my-1 bg-gray-200" />
                        {estCodeOptions.map((option, index) => (
                          <DropdownMenuCheckboxItem
                            key={index}
                            checked={selectedEstCodes.includes(option.code)}
                            onSelect={(e)=>e.preventDefault()}
                            onCheckedChange={() => handleEstCodeToggle(option.code)}
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{option.code}</span>
                              <span className="text-xs text-gray-500">{option.description}</span>
                            </div>
                          </DropdownMenuCheckboxItem>
                        ))}
                      </>
                    ) : (
                      <div className="py-2 px-2 text-sm text-gray-500">No EST codes available for {districtName}</div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <span className="text-xs text-gray-500 dark:text-zinc-400 self-center">
                  {selectedEstCodes.length} selected
                </span>
              </div>
            </div>

            <div className="md:col-span-2 md:flex md:justify-end">
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
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md">
          <p className="text-red-700 dark:text-red-400">{partyQuery.error instanceof Error ? partyQuery.error.message : "An error occurred while searching"}</p>
        </div>
      )}

      {/* Results Section */}
      {!partyQuery.isLoading && !partyQuery.isFetching && Object.keys(searchResults).length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">Search Results</h3>
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>

          {Object.keys(filteredResults).length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700">
              No results found for your search criteria.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(filteredResults).map(([courtName, cases]) => {
                const page = pageByCourt[courtName] || 1;
                const total = cases.length;
                const totalPages = Math.max(1, Math.ceil(total / pageSize));
                const startIndex = (page - 1) * pageSize;
                const endIndex = Math.min(page * pageSize, total);
                const currentCases = cases.slice(startIndex, endIndex);

                return (
                  <div
                    key={courtName}
                    className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-zinc-800"
                  >
                    {/* Court Header */}
                    <div className="bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-800 px-4 py-3">
                      <h4 className="text-lg font-semibold text-black dark:text-zinc-200">
                        {courtName}
                      </h4>
                    </div>

                    {/* Court Table */}
                    {(() => {
                      const columns: ColumnDef<DistrictCourtResult>[] = [
                        { key: "serial_number", header: "SERIAL NUMBER", width: 100, render: (r) => (
                          <span className="text-gray-800 dark:text-zinc-200 font-medium">{r.serial_number || "N/A"}</span>
                        ) },
                        { key: "case_combo", header: "CASE TYPE/CASE NUMBER/CASE YEAR", width: 150, render: (r) => (
                          <div className="max-w-[150px] truncate" title={`${r.case_type || ""}/${r.case_number || ""}/${r.case_year || ""}`}>
                            {(r.case_type || "N/A") + "/" + (r.case_number || "N/A") + "/" + (r.case_year || "N/A")}
                          </div>
                        ) },
                        { key: "party", header: "PETITIONER VERSUS RESPONDENT", width: 200, render: (r) => (
                          <div className="max-w-[200px]">
                            <div className="truncate" title={r.petitioner_name || ""}>
                              <strong>Petitioner:</strong> {r.petitioner_name || "N/A"}
                            </div>
                            {r.respondent_name ? (
                              <div className="truncate mt-1" title={r.respondent_name}>
                                <strong>Respondent:</strong> {r.respondent_name}
                              </div>
                            ) : null}
                          </div>
                        ) },
                        { key: "actions", header: "VIEW", width: 100, render: (r) => {
                          const caseId = r.cino;
                          return (
                            <div className="flex items-center space-x-2">
                              <button
                                className={`flex items-center justify-center space-x-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                                  followedCases.has(caseId)
                                    ? "text-green-700 bg-green-100"
                                    : "text-gray-700 dark:text-zinc-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700"
                                }`}
                                onClick={() => {
                                  if (!followedCases.has(caseId)) handleFollowCase(r);
                                }}
                                disabled={followLoading === caseId || followedCases.has(caseId)}
                              >
                                {followLoading === caseId ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <Star
                                      size={12}
                                      className={
                                        followedCases.has(caseId)
                                          ? "text-green-600 fill-green-500"
                                          : ""
                                      }
                                    />
                                    <span className="hidden sm:inline">
                                      {followedCases.has(caseId) ? "Followed" : "Follow"}
                                    </span>
                                  </>
                                )}
                              </button>
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
                            </div>
                          );
                        } },
                      ];

                      return (
                        <ResultsTable
                          columns={columns}
                          rows={currentCases}
                          rowKey={(r) => r.cino}
                        />
                      );
                    })()}

                    {/* Pagination */}
                    <Pagination
                      page={page}
                      pageSize={pageSize}
                      total={total}
                      onPageChange={(p) => setPageByCourt((prev) => ({ ...prev, [courtName]: p }))}
                      onPageSizeChange={(n) => { setPageSize(n); setPageByCourt((prev) => ({ ...prev, [courtName]: 1 })); }}
                    />
                  </div>
                );
              })}
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
