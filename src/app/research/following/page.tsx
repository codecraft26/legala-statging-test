"use client";

import React, { useState, useEffect } from "react";
import ResearchShell from "@/components/research-shell";
import ResultsTable, { ColumnDef } from "../components/common/ResultsTable";
import Pagination from "../components/common/Pagination";
import { Bookmark, BookmarkX, ExternalLink, Calendar, User, FileText, Eye, X, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useFollowedResearch, useUnfollowResearch, useDistrictDetail, useHighDetail, useSupremeDetail } from "@/hooks/use-research";
import { getCookie } from "@/lib/utils";

type CourtType = "Supreme_Court" | "High_Court" | "District_Court";

interface FollowedCase {
  id: string;
  court: CourtType;
  followed: any;
  createdAt: string;
  updatedAt: string;
  userId: string;
  workspaceId: string;
}

export default function FollowedCasesPage() {
  const [activeTab, setActiveTab] = useState<CourtType>("Supreme_Court");
  // Pagination state for District Court table
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [showCaseDetails, setShowCaseDetails] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState<string | null>(null);
  
  // Detail params for different court types
  const [districtDetailParams, setDistrictDetailParams] = useState<{ cino: string; district_name: string } | null>(null);
  const [highDetailParams, setHighDetailParams] = useState<{ 
    case_no: number; state_code: number; cino: string; court_code: number; 
    national_court_code: string; dist_cd: number; 
  } | null>(null);
  const [supremeDetailParams, setSupremeDetailParams] = useState<{ diary_no: number; diary_year: number } | null>(null);

  // Get workspace ID after component mounts to avoid hydration issues
  useEffect(() => {
    if (typeof window !== "undefined") {
      setWorkspaceId(getCookie("workspaceId"));
    }
  }, []);

  const supremeQuery = useFollowedResearch(workspaceId || "", "Supreme_Court");
  const highCourtQuery = useFollowedResearch(workspaceId || "", "High_Court");
  const districtQuery = useFollowedResearch(workspaceId || "", "District_Court");

  const unfollowMutation = useUnfollowResearch(workspaceId || undefined, activeTab);
  
  // Detail queries for different court types
  const districtDetailQuery = useDistrictDetail(districtDetailParams);
  const highDetailQuery = useHighDetail(highDetailParams);
  const supremeDetailQuery = useSupremeDetail(supremeDetailParams);

  const handleUnfollow = async (caseId: string) => {
    try {
      await unfollowMutation.mutateAsync(caseId);
    } catch (error) {
      console.error("Failed to unfollow case:", error);
    }
  };

  const handleViewDetails = (caseItem: FollowedCase) => {
    const caseId = caseItem.id;
    setDetailsLoading(caseId);
    
    if (caseItem.court === "District_Court") {
      // For district court, we need cino and district_name
      const cino = caseItem.followed["View"] || "";
      // Extract district name from workspace or use a default - you may need to adjust this
      setDistrictDetailParams({ cino, district_name: "srinagar" });
    } else if (caseItem.court === "High_Court") {
      // Use followed payload to construct detail params exactly like search components
      const f = caseItem.followed || {};
      const rawYear = Number(f["case_year"]) || Number(f["fil_year"]) || new Date().getFullYear();
      const stateCode = Number(f["state_cd"]) || 26;
      const courtCode = Number(f["court_code"]) || 1;
      const rawNo = f["case_no2"] != null ? Number(f["case_no2"]) : (f["fil_no"] != null ? Number(f["fil_no"]) : (f["case_no"] ? Number(f["case_no"]) : 0));
      const formattedCaseNo = f["case_no"] ? Number(f["case_no"]) : Number(`${rawYear}${String(stateCode).padStart(2, '0')}${String(rawNo || 0).padStart(8, '0')}${rawYear}`);
      const cino = f["cino"] || "";
      const nationalCourtCode = cino ? String(cino).substring(0, 6) : "DLHC01";

      setHighDetailParams({
        case_no: formattedCaseNo,
        state_code: stateCode,
        cino: cino,
        court_code: courtCode,
        national_court_code: nationalCourtCode,
        dist_cd: 1
      });
    } else if (caseItem.court === "Supreme_Court") {
      // For supreme court, we need diary_no and diary_year
      const diaryNumber = caseItem.followed["View"] || caseItem.followed["diary_no"] || "";
      const year = caseItem.followed["diary_year"] || new Date().getFullYear();
      setSupremeDetailParams({
        diary_no: parseInt(diaryNumber) || 0,
        diary_year: year
      });
    }
  };

  // Handle detail query responses
  useEffect(() => {
    if (districtDetailParams && !districtDetailQuery.isLoading && !districtDetailQuery.isFetching) {
      if (districtDetailQuery.error) {
        console.error("District Court Detail Query Error:", districtDetailQuery.error);
        alert(`Failed to fetch District Court case details: ${districtDetailQuery.error.message}`);
        setDetailsLoading(null);
        return;
      }
      
      if (districtDetailQuery.data) {
        // eslint-disable-next-line no-console
        console.warn("District Court detail fetched");
        setSelectedCase(districtDetailQuery.data);
        setShowCaseDetails(true);
      }
      setDetailsLoading(null);
    }
  }, [districtDetailQuery.data, districtDetailQuery.error, districtDetailQuery.isLoading, districtDetailQuery.isFetching, districtDetailParams]);

  useEffect(() => {
    if (highDetailParams && !highDetailQuery.isLoading && !highDetailQuery.isFetching) {
      if (highDetailQuery.error) {
        console.error("High Court Detail Query Error:", highDetailQuery.error);
        alert(`Failed to fetch High Court case details: ${highDetailQuery.error.message}`);
        setDetailsLoading(null);
        return;
      }
      
      if (highDetailQuery.data) {
        // eslint-disable-next-line no-console
        console.warn("High Court detail fetched");
        setSelectedCase(highDetailQuery.data);
        setShowCaseDetails(true);
      }
      setDetailsLoading(null);
    }
  }, [highDetailQuery.data, highDetailQuery.error, highDetailQuery.isLoading, highDetailQuery.isFetching, highDetailParams]);

  useEffect(() => {
    if (supremeDetailParams && !supremeDetailQuery.isLoading && !supremeDetailQuery.isFetching) {
      if (supremeDetailQuery.error) {
        console.error("Supreme Court Detail Query Error:", supremeDetailQuery.error);
        alert(`Failed to fetch Supreme Court case details: ${supremeDetailQuery.error.message}`);
        setDetailsLoading(null);
        return;
      }
      
      if (supremeDetailQuery.data) {
        // eslint-disable-next-line no-console
        console.warn("Supreme Court detail fetched");
        setSelectedCase(supremeDetailQuery.data);
        setShowCaseDetails(true);
      }
      setDetailsLoading(null);
    }
  }, [supremeDetailQuery.data, supremeDetailQuery.error, supremeDetailQuery.isLoading, supremeDetailQuery.isFetching, supremeDetailParams]);

  // Function to parse case details HTML response (similar to district search)
  const parseCaseDetailsHTML = (htmlString: string): any => {
    try {
      if (!htmlString || typeof htmlString !== "string") {
        console.error("Invalid HTML string provided");
        return null;
      }

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlString;

      // Extract case details from first table with "Case Details" caption
      const caseDetailsCaption = Array.from(tempDiv.querySelectorAll("caption")).find((caption) => 
        caption.textContent?.includes("Case Details")
      );
      const caseDetailsTable = caseDetailsCaption?.parentElement?.querySelector("tbody tr");
      const caseInfo = {
        caseType: caseDetailsTable?.children[0]?.textContent?.trim() || "",
        filingNumber: caseDetailsTable?.children[1]?.textContent?.trim() || "",
        filingDate: caseDetailsTable?.children[2]?.textContent?.trim() || "",
        registrationNumber: caseDetailsTable?.children[3]?.textContent?.trim() || "",
        registrationDate: caseDetailsTable?.children[4]?.textContent?.trim() || "",
        cnrNumber: caseDetailsTable?.children[5]?.textContent?.trim() || "",
      };

      // Extract case status from table with "Case Status" caption
      const statusCaption = Array.from(tempDiv.querySelectorAll("caption")).find((caption) => 
        caption.textContent?.includes("Case Status")
      );
      const statusTable = statusCaption?.parentElement?.querySelector("tbody tr");
      const caseStatus = {
        firstHearingDate: statusTable?.children[0]?.textContent?.trim() || "",
        nextHearingDate: statusTable?.children[1]?.textContent?.trim() || "",
        caseStatus: statusTable?.children[2]?.textContent?.trim() || "",
        stageOfCase: statusTable?.children[3]?.textContent?.trim() || "",
        courtNumberAndJudge: statusTable?.children[4]?.textContent?.trim() || "",
      };

      // Extract acts information
      const acts: Array<{ act: string; sections: string }> = [];
      const actsCaption = Array.from(tempDiv.querySelectorAll("caption")).find((caption) => 
        caption.textContent?.includes("Acts")
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

      // Extract case history
      const caseHistory: Array<{
        registrationNumber: string;
        judge: string;
        businessOnDate: string;
        hearingDate: string;
        purposeOfHearing: string;
      }> = [];
      const historyCaption = Array.from(tempDiv.querySelectorAll("caption")).find((caption) => 
        caption.textContent?.includes("Case History")
      );
      if (historyCaption) {
        const historyTable = historyCaption.parentElement?.querySelector("tbody");
        if (historyTable) {
          const historyRows = historyTable.querySelectorAll("tr");
          historyRows.forEach((row) => {
            const registrationNumber = row.children[0]?.textContent?.trim() || "";
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

      // Extract IA Status
      const iaStatus: Array<{
        iaNumber: string;
        partyName: string;
        dateOfFiling: string;
        nextDate: string;
        status: string;
      }> = [];
      const iaCaption = Array.from(tempDiv.querySelectorAll("caption")).find((caption) => 
        caption.textContent?.includes("IA Status")
      );
      if (iaCaption) {
        const iaTable = iaCaption.parentElement?.querySelector("tbody");
        if (iaTable) {
          const iaRows = iaTable.querySelectorAll("tr");
          iaRows.forEach((row) => {
            const iaNumber = row.children[0]?.textContent?.trim() || "";
            const partyName = row.children[1]?.textContent?.trim() || "";
            const dateOfFiling = row.children[2]?.textContent?.trim() || "";
            const nextDate = row.children[3]?.textContent?.trim() || "";
            const status = row.children[4]?.textContent?.trim() || "";

            if (iaNumber) {
              iaStatus.push({
                iaNumber,
                partyName,
                dateOfFiling,
                nextDate,
                status,
              });
            }
          });
        }
      }

      return {
        caseInfo,
        caseStatus,
        acts,
        caseHistory,
        iaStatus,
      };
    } catch (error) {
      console.error("Error parsing case details HTML:", error);
      return null;
    }
  };

  // Parse High Court HTML details into the structure expected by the modal
  const parseHighCourtHTML = (htmlString: string): any => {
    try {
      if (!htmlString || typeof htmlString !== "string") return null;
      const container = document.createElement("div");
      container.innerHTML = htmlString;

      // Case details
      const caseDetailsTable = container.querySelector(".case_details_table");
      const getAfterLabel = (label: string): string => {
        if (!caseDetailsTable) return "";
        const tds = Array.from(caseDetailsTable.querySelectorAll("td"));
        for (let i = 0; i < tds.length - 1; i++) {
          const text = (tds[i].textContent || "").replace(/\s+/g, " ").trim();
          if (text.toLowerCase().includes(label.toLowerCase())) {
            return (tds[i + 1].textContent || "").replace(/\s+/g, " ").trim();
          }
        }
        return "";
      };
      const case_details = {
        filing_number: getAfterLabel("Filing Number"),
        filing_date: getAfterLabel("Filing Date"),
        registration_number: getAfterLabel("Registration Number"),
        registration_date: getAfterLabel("Registration Date"),
        cnr_number: (caseDetailsTable?.querySelector("tr strong")?.textContent || "").trim() || "",
      };

      // Status table is the table after the "Case Status" header
      const statusHeader = Array.from(container.querySelectorAll("h2")).find((h) =>
        /Case Status/i.test(h.textContent || "")
      );
      const statusTable = statusHeader?.nextElementSibling as HTMLTableElement | null;
      const statusMap: Record<string, string> = {};
      if (statusTable) {
        Array.from(statusTable.querySelectorAll("tr")).forEach((tr) => {
          const tds = tr.querySelectorAll("td");
          if (tds.length >= 2) {
            const key = (tds[0].textContent || "").replace(/\s+/g, " ").trim();
            const val = (tds[1].textContent || "").replace(/\s+/g, " ").trim();
            statusMap[key.toLowerCase()] = val;
          }
        });
      }
      const case_status = {
        first_hearing_date: statusMap["first hearing date"] || "",
        next_hearing_date: statusMap["next hearing date"] || "",
        case_status: statusMap["case status"] || "",
        stage_of_case: statusMap["nature of disposal"] || "",
        coram: statusMap["coram"] || "",
        judicial_branch: statusMap["judicial branch"] || "",
        not_before_me: statusMap["not before me"] || "",
      };

      // Parties and advocates
      const petitionerSpan = container.querySelector(".Petitioner_Advocate_table");
      const respondentSpan = container.querySelector(".Respondent_Advocate_table");
      const splitLines = (el: Element | null) =>
        el ? (el.textContent || "").split(/\n|<br\s*\/?>(?=\s*)/gi as any).map((s: any) => String(s).trim()).filter(Boolean) : [];
      const petitioner_and_advocate = splitLines(petitionerSpan);
      const respondent_and_advocate = splitLines(respondentSpan);

      // Orders
      const ordersHeader = Array.from(container.querySelectorAll("h2")).find((h) => /Orders/i.test(h.textContent || ""));
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

      // IA details (optional; basic header variant may exist)
      const ia_details: any[] = [];

      return { case_details, case_status, petitioner_and_advocate, respondent_and_advocate, orders, ia_details };
    } catch (e) {
      console.warn("Failed to parse High Court HTML details in Followed page:", e);
      return null;
    }
  };

  // Status Badge Component
  const StatusBadge = ({ status }: { status: string }) => {
    const bgColor = status === "COMPLETED" || status === "DISPOSED" || status?.toLowerCase() === "disposed"
      ? "bg-green-100 text-green-800"
      : "bg-yellow-100 text-yellow-800";

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor}`}>
        {status}
      </span>
    );
  };

  // Case Details Modal Component
  const CaseDetailsModal = ({ caseData, onClose }: { caseData: any | null; onClose: () => void }) => {
    const [activeTab, setActiveTab] = useState("overview");
    if (!caseData) return null;

    // Parse HTML data if it's a string response
    let parsedData = caseData;
    if (typeof caseData === 'object' && caseData.data && typeof caseData.data === 'string') {
      const html: string = caseData.data;
      parsedData = html.includes("case_details_table")
        ? parseHighCourtHTML(html) || parseCaseDetailsHTML(html)
        : parseCaseDetailsHTML(html);
    } else if (typeof caseData === 'string') {
      const html: string = caseData;
      parsedData = html.includes("case_details_table")
        ? parseHighCourtHTML(html) || parseCaseDetailsHTML(html)
        : parseCaseDetailsHTML(html);
    }

    // Function to get available tabs based on data
    const getAvailableTabs = () => {
      if (!parsedData) return ["overview"];
      // High Court parsed structure
      if (parsedData.case_details || parsedData.case_status || parsedData.petitioner_and_advocate || parsedData.orders || parsedData.ia_details) {
        return ["overview", "parties", "status", "orders", "ia"];
      }
      const tabs = ["overview"];
      if (parsedData.acts && parsedData.acts.length > 0) tabs.push("acts");
      if (parsedData.caseHistory && parsedData.caseHistory.length > 0) tabs.push("history");
      if (parsedData.iaStatus && parsedData.iaStatus.length > 0) tabs.push("ia-status");
      return tabs;
    };

    if (!parsedData) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Case Details</h3>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 p-4 rounded overflow-auto">
                {JSON.stringify(caseData, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white dark:bg-gray-800 z-10">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Case Details</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4">
            {/* Case Header */}
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                {parsedData.caseInfo?.cnrNumber || "Case Details"}
              </h2>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                  CNR: {parsedData.caseInfo?.cnrNumber || "N/A"}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-sm mx-2 font-medium">|</span>
                <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                  Filed: {parsedData.caseInfo?.filingDate || "N/A"}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-sm mx-2 font-medium">|</span>
                <StatusBadge status={parsedData.caseStatus?.caseStatus || "PENDING"} />
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
                        ? "text-black border-b-2 border-black"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === "overview" ? "Overview" : 
                     tab === "acts" ? "Acts" : 
                     tab === "history" ? "History" : 
                     tab === "ia-status" ? "IA Status" : tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="mb-4">
              {/* High Court tabs */}
              {activeTab === "overview" && parsedData.case_details && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: "Filing Number", value: parsedData.case_details?.filing_number || "N/A" },
                      { label: "Filing Date", value: parsedData.case_details?.filing_date || "N/A" },
                      { label: "Registration Number", value: parsedData.case_details?.registration_number || "N/A" },
                      { label: "Registration Date", value: parsedData.case_details?.registration_date || "N/A" },
                    ].map((item, index) => (
                      <div key={index}>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{item.label}</h3>
                        <p className="text-sm text-gray-900 dark:text-gray-100">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "parties" && parsedData.petitioner_and_advocate && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Petitioners</h3>
                    <ul className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-md space-y-2">
                      {parsedData.petitioner_and_advocate.map((p: string, i: number) => (
                        <li key={i} className="text-sm">{(p.split("    ")[0] || p).trim()}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Respondents</h3>
                    <ul className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-md space-y-2">
                      {(parsedData.respondent_and_advocate || []).map((r: string, i: number) => (
                        <li key={i} className="text-sm">{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "status" && parsedData.case_status && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: "Case Stage", value: parsedData.case_status?.stage_of_case || parsedData.case_status?.case_status || "N/A" },
                      { label: "First Hearing Date", value: parsedData.case_status?.first_hearing_date || "N/A" },
                      { label: "Next Hearing Date", value: parsedData.case_status?.next_hearing_date || "N/A" },
                      { label: "Coram", value: parsedData.case_status?.coram || "N/A" },
                      { label: "Judicial Branch", value: parsedData.case_status?.judicial_branch || "N/A" },
                      { label: "Not Before Me", value: parsedData.case_status?.not_before_me || "N/A" },
                    ].map((item, index) => (
                      <div key={index}>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{item.label}</h3>
                        <p className="text-sm text-gray-900 dark:text-gray-100">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "orders" && (
                <div className="space-y-4">
                  <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Orders</h3>
                  {parsedData.orders && parsedData.orders.length > 0 ? (
                    <div className="space-y-3">
                      {parsedData.orders.map((order: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-900 rounded-md">
                          <span className="text-sm font-medium">{`Order #${order.order_number || ""} - ${order.order_date || ""}`}</span>
                          {order.order_details ? (
                            <a href={order.order_details} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-black hover:text-gray-700 text-sm">
                              <span>View Order</span>
                              <ExternalLink size={14} />
                            </a>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 text-yellow-700 dark:text-yellow-300">No orders available for this case.</div>
                  )}
                </div>
              )}

              {activeTab === "ia" && (
                <div className="space-y-6">
                  <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Interlocutory Applications (IA)</h3>
                  {parsedData.ia_details && parsedData.ia_details.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse bg-gray-50 dark:bg-zinc-900 rounded-md">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-800">
                            <th className="border border-gray-300 dark:border-gray-700 p-2 text-left text-xs font-medium text-black dark:text-gray-200">IA Number</th>
                            <th className="border border-gray-300 dark:border-gray-700 p-2 text-left text-xs font-medium text-black dark:text-gray-200">Party</th>
                            <th className="border border-gray-300 dark:border-gray-700 p-2 text-left text-xs font-medium text-black dark:text-gray-200">Filing Date</th>
                            <th className="border border-gray-300 dark:border-gray-700 p-2 text-left text-xs font-medium text-black dark:text-gray-200">Next Date</th>
                            <th className="border border-gray-300 dark;border-gray-700 p-2 text-left text-xs font-medium text-black dark:text-gray-200">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.ia_details.map((ia: any, index: number) => (
                            <tr key={index} className="hover:bg-gray-100 dark:hover:bg-gray-800 even:bg-white odd:bg-gray-50 dark:even:bg-zinc-900 dark:odd:bg-zinc-950">
                              <td className="border border-gray-300 dark:border-gray-700 p-2 text-sm">{ia.ia_number || "N/A"}</td>
                              <td className="border border-gray-300 dark:border-gray-700 p-2 text-sm">{ia.party || "N/A"}</td>
                              <td className="border border-gray-300 dark;border-gray-700 p-2 text-sm">{ia.date_of_filing || "N/A"}</td>
                              <td className="border border-gray-300 dark:border-gray-700 p-2 text-sm">{ia.next_date || "N/A"}</td>
                              <td className="border border-gray-300 dark:border-gray-700 p-2 text-sm">{ia.ia_status || "N/A"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 text-yellow-700 dark:text-yellow-300">No IA details available for this case.</div>
                  )}
                </div>
              )}
              {activeTab === "overview" && !parsedData.case_details && (
                <div className="space-y-6">
                  {/* Case Information Table */}
                  <div className="mb-6">
                    <h3 className="font-medium mb-4 text-gray-900 dark:text-gray-100">Case Information</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-700">
                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                              Field
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                              Value
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                              Case Type
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm text-gray-900 dark:text-gray-100">
                              {parsedData.caseInfo?.caseType || "N/A"}
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                              Filing Number
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm text-gray-900 dark:text-gray-100">
                              {parsedData.caseInfo?.filingNumber || "N/A"}
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                              Registration Number
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm text-gray-900 dark:text-gray-100">
                              {parsedData.caseInfo?.registrationNumber || "N/A"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Case Status Table */}
                  <div className="mb-6">
                    <h3 className="font-medium mb-4 text-gray-900 dark:text-gray-100">Status Information</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-700">
                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                              Field
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                              Value
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                              Case Status
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm">
                              <StatusBadge status={parsedData.caseStatus?.caseStatus || "N/A"} />
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                              Next Hearing Date
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm text-gray-900 dark:text-gray-100">
                              {parsedData.caseStatus?.nextHearingDate || "N/A"}
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                              Stage of Case
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm text-gray-900 dark:text-gray-100">
                              {parsedData.caseStatus?.stageOfCase || "N/A"}
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                              Court and Judge
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm text-gray-900 dark:text-gray-100">
                              {parsedData.caseStatus?.courtNumberAndJudge || "N/A"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "acts" && (
                <div>
                  <h3 className="font-medium mb-4 text-gray-900 dark:text-gray-100">Acts and Sections</h3>
                  {parsedData.acts && parsedData.acts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-700">
                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                              Under Act(s)
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                              Under Section(s)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.acts.map((act: any, index: number) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm text-gray-900 dark:text-gray-100">
                                {act.act}
                              </td>
                              <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm text-gray-900 dark:text-gray-100">
                                {act.sections}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No acts and sections information available
                    </p>
                  )}
                </div>
              )}

              {activeTab === "history" && !parsedData.case_status && (
                <div>
                  <h3 className="font-medium mb-4 text-gray-900 dark:text-gray-100">Case History</h3>
                  {parsedData.caseHistory && parsedData.caseHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-700">
                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                              Business Date
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                              Hearing Date
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                              Purpose
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                              Judge
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.caseHistory.map((history: any, index: number) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm text-gray-900 dark:text-gray-100">
                                {history.businessOnDate}
                              </td>
                              <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm text-gray-900 dark:text-gray-100">
                                {history.hearingDate}
                              </td>
                              <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm text-gray-900 dark:text-gray-100">
                                {history.purposeOfHearing || "N/A"}
                              </td>
                              <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm text-gray-900 dark:text-gray-100">
                                {history.judge || "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 text-yellow-700 dark:text-yellow-300">
                      No history records available for this case.
                    </div>
                  )}
                </div>
              )}

              {activeTab === "ia-status" && (
                <div>
                  <h3 className="font-medium mb-4 text-gray-900 dark:text-gray-100">IA Status</h3>
                  {parsedData.iaStatus && parsedData.iaStatus.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-700">
                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                              IA Number
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                              Party Name
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                              Filing Date
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                              Next Date
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.iaStatus.map((ia: any, index: number) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm text-gray-900 dark:text-gray-100">
                                {ia.iaNumber}
                              </td>
                              <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm text-gray-900 dark:text-gray-100">
                                {ia.partyName}
                              </td>
                              <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm text-gray-900 dark:text-gray-100">
                                {ia.dateOfFiling}
                              </td>
                              <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm text-gray-900 dark:text-gray-100">
                                {ia.nextDate}
                              </td>
                              <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm">
                                <StatusBadge status={ia.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No IA status information available
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="border-t p-4 flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 px-4 py-2 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCaseCard = (caseItem: FollowedCase) => {
    const { followed, court, createdAt, id } = caseItem;
    
    return (
      <div key={id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-black" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {court.replace("_", " ")}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUnfollow(id)}
            disabled={unfollowMutation.isPending}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <BookmarkX className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {/* Supreme Court specific fields */}
          {court === "Supreme_Court" && (
            <>
              {(followed["Case Number"] || followed["case_number"] || followed["diary_number"]) && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Case Number:</strong> {followed["Case Number"] || followed["case_number"] || `Diary No: ${followed["diary_number"]}`}
                  </span>
                </div>
              )}
              {(followed["Petitioner versus Respondent"] || followed["petitioner_name"] || followed["respondent_name"]) && (
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-gray-500 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Parties:</strong> {followed["Petitioner versus Respondent"] || `${followed["petitioner_name"] || ""} vs ${followed["respondent_name"] || ""}`}
                  </span>
                </div>
              )}
              {followed["status"] && (
                <div className="flex items-center gap-2">
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    followed["status"] === "PENDING" 
                      ? "bg-yellow-100 text-yellow-800" 
                      : "bg-green-100 text-green-800"
                  }`}>
                    {followed["status"]}
                  </span>
                </div>
              )}
            </>
          )}

          {/* High Court specific fields */}
          {court === "High_Court" && (
            <>
              {(followed["Case Number"] || followed["case_no2"] || followed["type_name"]) && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Case Number:</strong> {followed["Case Number"] || `${followed["type_name"] || ""}${followed["case_no2"] ? `/${followed["case_no2"]}` : ""}${followed["case_year"] ? `/${followed["case_year"]}` : ""}`}
                  </span>
                </div>
              )}
              {(followed["Petitioner/Appellant versus Respondent"] || followed["pet_name"] || followed["res_name"]) && (
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-gray-500 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Parties:</strong> {followed["Petitioner/Appellant versus Respondent"] || `${followed["pet_name"] || ""} vs ${followed["res_name"] || ""}`}
                  </span>
                </div>
              )}
              {(followed["adv_name1"] || followed["adv_name2"]) && (
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-gray-500 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Advocates:</strong> {[followed["adv_name1"], followed["adv_name2"]].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
              {(followed["Status"] || followed["date_of_decision"]) && (
                <div className="flex items-center gap-2">
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    followed["Status"] === "PENDING" || !followed["date_of_decision"]
                      ? "bg-yellow-100 text-yellow-800" 
                      : "bg-green-100 text-green-800"
                  }`}>
                    {followed["Status"] || (followed["date_of_decision"] ? "Decided" : "Pending")}
                  </span>
                  {followed["date_of_decision"] && (
                    <span className="text-xs text-gray-500">
                      Decision: {new Date(followed["date_of_decision"]).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </>
          )}

          {/* District Court specific fields */}
          {court === "District_Court" && (
            <>
              {followed["Case Type/Case Number/Case Year"] && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Case:</strong> {followed["Case Type/Case Number/Case Year"]}
                  </span>
                </div>
              )}
              {followed["Petitioner versus Respondent"] && (
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-gray-500 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Parties:</strong> {followed["Petitioner versus Respondent"]}
                  </span>
                </div>
              )}
              {followed["Serial Number"] && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Serial Number:</strong> {followed["Serial Number"]}
                  </span>
                </div>
              )}
            </>
          )}

          {/* View button for cases that have necessary details */}
          {(followed["View"] || (court === "High_Court" && followed["case_no2"]) || (court === "Supreme_Court" && followed["diary_no"]) || (court === "District_Court" && followed["View"])) && (
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => handleViewDetails(caseItem)}
                disabled={detailsLoading === id}
              >
                {detailsLoading === id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                View Details
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-500">
              Followed on {new Date(createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = (query: any, court: CourtType) => {
    if (query.isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      );
    }

    if (query.error) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <ExternalLink className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">
            Error Loading Cases
          </h3>
          <p className="text-gray-600 dark:text-zinc-400">
            {query.error.message || "Failed to load followed cases"}
          </p>
        </div>
      );
    }

    // Handle different possible response structures
    let cases: FollowedCase[] = [];
    
    if (query.data) {
      if (Array.isArray(query.data)) {
        cases = query.data;
      } else if (Array.isArray(query.data.data)) {
        cases = query.data.data;
      } else if (typeof query.data === 'object' && query.data !== null) {
        // If it's an object but not an array, check if it has array properties
        const possibleArrayKeys = ['cases', 'results', 'items'];
        for (const key of possibleArrayKeys) {
          if (Array.isArray(query.data[key])) {
            cases = query.data[key];
            break;
          }
        }
      }
    }

    if (!Array.isArray(cases) || cases.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Bookmark className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">
            No Followed Cases
          </h3>
          <p className="text-gray-600 dark:text-zinc-400">
            You haven&apos;t followed any {court.replace("_", " ").toLowerCase()} cases yet.
          </p>
          
        </div>
      );
    }

    // For District Court, show a table using existing component and populate with pagination
    if (court === "District_Court") {
      const total = cases.length;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const currentPageRows = cases.slice(start, end);

      const columns: ColumnDef<FollowedCase>[] = [
        {
          key: "case",
          header: "Case",
          width: 220,
          render: (row) => (
            <div className="truncate max-w-[220px]">
              {row.followed?.["Case Type/Case Number/Case Year"] ?? ""}
            </div>
          ),
        },
        {
          key: "type",
          header: "Type",
          width: 120,
          render: (row) => {
            const combo = row.followed?.["Case Type/Case Number/Case Year"] as string | undefined;
            const type = combo ? (combo.split("/")[0] || "").trim() : "";
            return <div className="truncate max-w-[110px]">{type}</div>;
          },
        },
        {
          key: "cnr",
          header: "CNR",
          width: 160,
          render: (row) => (
            <div className="truncate max-w-[150px]">
              {row.followed?.["View"] ?? ""}
            </div>
          ),
        },
        {
          key: "parties",
          header: "Parties",
          width: 300,
          render: (row) => (
            <div className="truncate max-w-[300px]">
              {row.followed?.["Petitioner versus Respondent"] ?? ""}
            </div>
          ),
        },
        {
          key: "actions",
          header: "Actions",
          width: 160,
          render: (row) => (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewDetails(row)}
                disabled={detailsLoading === row.id}
                className="flex items-center gap-2"
              >
                {detailsLoading === row.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUnfollow(row.id)}
                disabled={unfollowMutation.isPending}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <BookmarkX className="h-4 w-4" />
              </Button>
            </div>
          ),
        },
      ];

      return (
        <div className="w-full overflow-x-auto bg-white dark:bg-zinc-950 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-800">
          <ResultsTable
            columns={columns}
            rows={currentPageRows}
            rowKey={(row) => row.id}
            tableClassName="table-fixed w-full"
            headerRowClassName="bg-gray-100 dark:bg-zinc-800"
          />
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
          />
        </div>
      );
    }

    // For High Court, show table similar to District (no pagination initially)
    if (court === "High_Court") {
      const total = cases.length;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const currentPageRows = cases.slice(start, end);
      const columns: ColumnDef<FollowedCase>[] = [
        { key: "cnr", header: "CNR", width: 160, render: (row) => (
          <div className="truncate max-w-[150px]">{row.followed?.["cino"] || row.followed?.["CNR"] || ""}</div>
        ) },
        { key: "case", header: "Case", width: 240, render: (row) => {
          const type = row.followed?.["type_name"] || "";
          const no = row.followed?.["case_no2"] ?? row.followed?.["fil_no"] ?? "";
          const year = row.followed?.["case_year"] ?? row.followed?.["fil_year"] ?? "";
          const combo = [type, no, year].filter(Boolean).join("/");
          return <div className="truncate max-w-[220px]">{combo}</div>;
        } },
        { key: "parties", header: "Parties", width: 300, render: (row) => (
          <div className="truncate max-w-[300px]">{row.followed?.["pet_name"] || ""} {row.followed?.["pet_name"] && row.followed?.["res_name"] ? "vs" : ""} {row.followed?.["res_name"] || ""}</div>
        ) },
        { key: "actions", header: "Actions", width: 160, render: (row) => (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewDetails(row)}
              disabled={detailsLoading === row.id}
              className="flex items-center gap-2"
            >
              {detailsLoading === row.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUnfollow(row.id)}
              disabled={unfollowMutation.isPending}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <BookmarkX className="h-4 w-4" />
            </Button>
          </div>
        ) },
      ];

      return (
        <div className="w-full overflow-x-auto bg-white dark:bg-zinc-950 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-800">
          <ResultsTable
            columns={columns}
            rows={currentPageRows}
            rowKey={(row) => row.id}
            tableClassName="table-fixed w-full"
            headerRowClassName="bg-gray-100 dark:bg-zinc-800"
          />
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
          />
        </div>
      );
    }

    // Default: card layout for other courts
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cases.map((caseItem: FollowedCase) => renderCaseCard(caseItem))}
      </div>
    );
  };

  if (!workspaceId) {
    return (
      <ResearchShell title="Followed Cases">
        <div className="p-6">
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <ExternalLink className="h-12 w-12 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">
              Workspace Required
            </h3>
            <p className="text-gray-600 dark:text-zinc-400 max-w-md mx-auto">
              Please select a workspace to view your followed cases.
            </p>
          </div>
        </div>
      </ResearchShell>
    );
  }

  return (
    <ResearchShell title="Followed Cases">
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as CourtType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="Supreme_Court">Supreme Court</TabsTrigger>
            <TabsTrigger value="High_Court">High Court</TabsTrigger>
            <TabsTrigger value="District_Court">District Court</TabsTrigger>
          </TabsList>

          <TabsContent value="Supreme_Court" className="mt-6">
            {renderTabContent(supremeQuery, "Supreme_Court")}
          </TabsContent>

          <TabsContent value="High_Court" className="mt-6">
            {renderTabContent(highCourtQuery, "High_Court")}
          </TabsContent>

          <TabsContent value="District_Court" className="mt-6">
            {renderTabContent(districtQuery, "District_Court")}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Case Details Modal */}
      {showCaseDetails && (
        <CaseDetailsModal
          caseData={selectedCase}
          onClose={() => {
            setShowCaseDetails(false);
            setSelectedCase(null);
            setDistrictDetailParams(null);
            setHighDetailParams(null);
            setSupremeDetailParams(null);
          }}
        />
      )}
    </ResearchShell>
  );
}


