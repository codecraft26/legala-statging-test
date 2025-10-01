"use client";

import React, { useState, useEffect } from "react";
import { Search, Star, Eye, Loader2, X, ExternalLink } from "lucide-react";
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

interface CaseResult {
  serial_number: string;
  diary_number: string;
  case_number: string;
  petitioner_name: string;
  respondent_name: string;
  status: string;
}

interface CaseDetails {
  // Define based on actual API response structure
  [key: string]: any;
}

// Interface to match the old React code structure
interface SupremeCourtCaseData {
  [key: string]: {
    success: boolean;
    data: {
      data: string;
    };
  };
}

// Function to parse HTML content and convert to structured data (exactly like old React code)
const parseHtmlContent = (htmlString: string): any[][] => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");

    // Extract data from tables
    const tables = doc.querySelectorAll("table");
    const result: any[][] = [];

    // If we have multiple tables, create separate table entries
    if (tables.length > 0) {
      tables.forEach((table, tableIndex) => {
        const rows = table.querySelectorAll("tr");
        const tableData: any[][] = [];

        rows.forEach((row) => {
          const cells = row.querySelectorAll("td, th");
          const rowData: any[] = [];

          cells.forEach((cell) => {
            // Extract text content and preserve links
            const links = cell.querySelectorAll("a");
            if (links.length > 0) {
              const linkData: any[] = [];
              links.forEach((link) => {
                linkData.push({
                  text: link.textContent.trim(),
                  href: link.href,
                  target: link.target,
                });
              });
              rowData.push({ type: "links", data: linkData });
            } else {
              rowData.push(cell.textContent.trim());
            }
          });

          if (rowData.length > 0) {
            tableData.push(rowData);
          }
        });

        if (tableData.length > 0) {
          result.push(tableData);
        }
      });
    } else {
      // If no tables found, try to create structured data from other elements
      const divs = doc.querySelectorAll("div, p, span");
      if (divs.length > 0) {
        // Try to create table-like structure from divs
        const structuredData: any[][] = [];

        divs.forEach((div) => {
          const text = div.textContent?.trim();
          if (text && text.length > 0) {
            // Try to split by common delimiters
            if (text.includes("\t") || text.includes("|")) {
              const parts = text.split(/\t|\|/).map((part) => part.trim());
              if (parts.length >= 2) {
                structuredData.push(parts);
              }
            } else if (text.includes(":")) {
              const parts = text.split(":").map((part) => part.trim());
              if (parts.length >= 2) {
                structuredData.push(parts);
              }
            } else {
              structuredData.push([text]);
            }
          }
        });

        if (structuredData.length > 0) {
          result.push(structuredData);
        }
      }
    }

  
    if (result.length === 0) {
      const textContent = doc.body.textContent.trim();
      if (textContent) {
        // Try to create a simple table structure from the text
        const lines = textContent
          .split("\n")
          .filter((line) => line.trim().length > 0);
        if (lines.length > 0) {
          const textTable: any[][] = [];
          lines.forEach((line) => {
            const trimmedLine = line.trim();
            if (trimmedLine) {
              // Try to split by common patterns
              if (trimmedLine.includes("\t")) {
                const parts = trimmedLine
                  .split("\t")
                  .map((part) => part.trim());
                textTable.push(parts);
              } else if (trimmedLine.includes(":")) {
                const parts = trimmedLine.split(":").map((part) => part.trim());
                textTable.push(parts);
              } else {
                textTable.push([trimmedLine]);
              }
            }
          });
          if (textTable.length > 0) {
            result.push(textTable);
          }
        }
      }
    }

    return result;
  } catch (error) {
    console.error("Error parsing HTML:", error);
    return [
      [["Error parsing content"], [htmlString.substring(0, 200) + "..."]],
    ];
  }
};

// Function to create case data structure like old React code with multiple tabs
const createSupremeCourtCaseData = (
  htmlString: string
): SupremeCourtCaseData => {
  try {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlString;

    // Extract different sections from the HTML
    const caseData: SupremeCourtCaseData = {};

    // Main case details section
    const caseDetailsSection =
      tempDiv.querySelector(".case-details, .main-content, table") || tempDiv;
    if (caseDetailsSection) {
      caseData.case_details = {
        success: true,
        data: {
          data: caseDetailsSection.outerHTML || htmlString,
        },
      };
    }

    // Look for other sections that might exist in the HTML
    const sections = [
      "argument_transcripts",
      "indexing",
      "earlier_court_details",
      "tagged_matters",
      "listing_dates",
      "interlocutory_application",
      "court_fees",
      "notices",
      "defects",
      "judgement_orders",
      "mention_memo",
      "drop_note",
      "office_report",
      "similarities",
    ];

    // Check if any of these sections exist in the HTML
    sections.forEach((section) => {
      const sectionElement = tempDiv.querySelector(
        `.${section}, #${section}, [data-section="${section}"]`
      );
      if (sectionElement) {
        caseData[section] = {
          success: true,
          data: {
            data: sectionElement.outerHTML,
          },
        };
      }
    });

    // If no specific sections found, create multiple tables from the main content
    if (Object.keys(caseData).length === 1) {
      // Split the main content into multiple logical sections
      const tables = tempDiv.querySelectorAll("table");
      if (tables.length > 1) {
        // Create separate entries for each table
        tables.forEach((table, index) => {
          if (index === 0) {
            // Keep the first table as case_details
            caseData.case_details = {
              success: true,
              data: {
                data: table.outerHTML,
              },
            };
          } else {
            // Create additional sections for other tables
            const sectionName = `case_details_table_${index + 1}`;
            caseData[sectionName] = {
              success: true,
              data: {
                data: table.outerHTML,
              },
            };
          }
        });
      }
    }

    // Always create the standard tabs as shown in the example
    const standardTabs = [
      "argument_transcripts",
      "indexing",
      "earlier_court_details",
      "tagged_matters",
      "listing_dates",
      "interlocutory_application",
    ];

    // Create standard tabs with placeholder content
    standardTabs.forEach((tab) => {
      if (!caseData[tab]) {
        caseData[tab] = {
          success: true,
          data: {
            data: `<div class="placeholder-content">
              <h3>${tab.replace(/_/g, " ").toUpperCase()}</h3>
              <p>This section would contain ${tab.replace(/_/g, " ")} information for the case.</p>
              <table>
                <tr><th>Field</th><th>Value</th></tr>
                <tr><td>Sample Field</td><td>Sample Value</td></tr>
              </table>
            </div>`,
          },
        };
      }
    });

    // Enhance the main case_details section to include multiple tables
    if (caseData.case_details) {
      const mainContent = caseData.case_details.data.data;
      const mainDiv = document.createElement("div");
      mainDiv.innerHTML = mainContent;

      // Create multiple tables from the main content
      const tables = mainDiv.querySelectorAll("table");
      if (tables.length > 0) {
        // Create a combined HTML with multiple table sections
        let combinedHTML = "";
        tables.forEach((table, index) => {
          combinedHTML += `<div class="table-section">
            <h3>CASE DETAILS - Table ${index + 1}</h3>
            ${table.outerHTML}
          </div>`;
        });

        caseData.case_details.data.data = combinedHTML;
      } else {
        // If no tables, create structured content from the text
        const textContent = mainDiv.textContent || "";
        if (textContent) {
          const lines = textContent
            .split("\n")
            .filter((line) => line.trim().length > 0);
          let structuredHTML = '<div class="case-details-content">';

          lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (trimmedLine) {
              if (index === 0) {
                structuredHTML += `<h3>CASE DETAILS - Table 1</h3>`;
                structuredHTML += `<table><tbody>`;
              }

              if (trimmedLine.includes("\t")) {
                const parts = trimmedLine.split("\t");
                if (parts.length >= 2) {
                  structuredHTML += `<tr><td>${parts[0].trim()}</td><td>${parts[1].trim()}</td></tr>`;
                }
              } else if (trimmedLine.includes(":")) {
                const parts = trimmedLine.split(":");
                if (parts.length >= 2) {
                  structuredHTML += `<tr><td>${parts[0].trim()}</td><td>${parts[1].trim()}</td></tr>`;
                }
              }
            }
          });

          structuredHTML += "</tbody></table></div>";
          caseData.case_details.data.data = structuredHTML;
        }
      }
    }

    return caseData;
  } catch (error) {
    console.error("Error creating case data structure:", error);
    return {
      case_details: {
        success: true,
        data: {
          data: htmlString,
        },
      },
    };
  }
};

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const isCompleted = status === "COMPLETED" || status === "DISPOSED";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isCompleted
          ? "bg-green-100 text-green-800"
          : "bg-yellow-100 text-yellow-800"
      }`}
    >
      {status}
    </span>
  );
};

// Case Details Modal - exactly like old React code
const CaseDetailsModal = ({
  caseData,
  onClose,
}: {
  caseData: SupremeCourtCaseData | null;
  onClose: () => void;
}) => {
  const [activeTab, setActiveTab] = useState("case_details");

  if (!caseData) return null;

  // Function to render cell content (exactly like old React code)
  const renderCellContent = (cell: any, cellIndex: number) => {
    if (typeof cell === "object" && cell.type === "links") {
      return (
        <div key={cellIndex}>
          {cell.data.map((link: any, linkIndex: number) => (
            <a
              key={linkIndex}
              href={link.href}
              target={link.target || "_blank"}
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline flex items-center"
            >
              {link.text}
              <ExternalLink size={14} className="ml-1" />
            </a>
          ))}
        </div>
      );
    }
    return cell;
  };

  // Function to render tab content based on active tab (exactly like old React code)
  const renderTabContent = () => {
    if (activeTab === "case_details") {
      // For case_details tab, show only the main case details
      return renderMainCaseDetails();
    }

    if (!caseData[activeTab]?.success) {
      return (
        <div className="p-6 text-center">
          <div className="text-gray-400 mb-2">No data available</div>
          <div className="text-sm text-gray-500">
            No {activeTab.replace(/_/g, " ")} information found for this case.
          </div>
        </div>
      );
    }

    const tabData = caseData[activeTab].data;

    // Handle JSON string data (like "No records found" messages)
    if (typeof tabData.data === "string" && tabData.data.startsWith("{")) {
      try {
        const jsonData = JSON.parse(tabData.data);
        if (jsonData.message === "No records found") {
          return (
            <div className="p-6 text-center">
              <div className="text-gray-400 mb-2">No records found</div>
              <div className="text-sm text-gray-500">
                No {activeTab.replace(/_/g, " ")} information available for this
                case.
              </div>
            </div>
          );
        }
        return (
          <div className="p-4">
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
              {JSON.stringify(jsonData, null, 2)}
            </pre>
          </div>
        );
      } catch (e) {
        return (
          <div className="p-4">
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
              {tabData.data}
            </pre>
          </div>
        );
      }
    }

    // Parse HTML content
    const tablesData = parseHtmlContent(tabData.data);

    if (tablesData.length === 0) {
      return (
        <div className="p-6 text-center">
          <div className="text-gray-400 mb-2">No structured data available</div>
          <div className="text-sm text-gray-500">
            The {activeTab.replace(/_/g, " ")} data could not be parsed.
          </div>
        </div>
      );
    }

    return (
      <div className="p-4">
        {tablesData.map((table: any, tableIndex: number) => (
          <div
            key={tableIndex}
            className="mb-8 bg-white rounded-lg border border-gray-200 overflow-hidden"
          >
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h3 className="font-medium text-gray-700">
                {activeTab.replace(/_/g, " ").toUpperCase()} - Table{" "}
                {tableIndex + 1}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                {table[0] && (
                  <thead>
                    <tr className="bg-gray-100">
                      {table[0].map((header: any, headerIndex: number) => (
                        <th
                          key={headerIndex}
                          className="border border-gray-300 p-2 text-left text-xs font-medium text-gray-700 uppercase"
                        >
                          {typeof header === "string" ? header : "Links"}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {table
                    .slice(table[0] ? 1 : 0)
                    .map((row: any, rowIndex: number) => (
                      <tr
                        key={rowIndex}
                        className={
                          rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }
                      >
                        {row.map((cell: any, cellIndex: number) => (
                          <td
                            key={cellIndex}
                            className="border border-gray-200 p-2 text-sm"
                          >
                            {renderCellContent(cell, cellIndex)}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Function to render only the main case details (petitioners, respondents, advocates, etc.)
  const renderMainCaseDetails = () => {
    if (!caseData.case_details?.success) {
      return (
        <div className="p-6 text-center">
          <div className="text-gray-400 mb-2">No case details available</div>
          <div className="text-sm text-gray-500">
            No main case information found for this case.
          </div>
        </div>
      );
    }

    const tabData = caseData.case_details.data;

    // Handle JSON string data (like "No records found" messages)
    if (typeof tabData.data === "string" && tabData.data.startsWith("{")) {
      try {
        const jsonData = JSON.parse(tabData.data);
        if (jsonData.message === "No records found") {
          return (
            <div className="p-6 text-center">
              <div className="text-gray-400 mb-2">No records found</div>
              <div className="text-sm text-gray-500">
                No case details information available for this case.
              </div>
            </div>
          );
        }
        return (
          <div className="p-4">
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
              {JSON.stringify(jsonData, null, 2)}
            </pre>
          </div>
        );
      } catch (e) {
        return (
          <div className="p-4">
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
              {tabData.data}
            </pre>
          </div>
        );
      }
    }

    // Parse HTML content
    const tablesData = parseHtmlContent(tabData.data);

    if (tablesData.length === 0) {
      return (
        <div className="p-6 text-center">
          <div className="text-gray-400 mb-2">No structured data available</div>
          <div className="text-sm text-gray-500">
            The case details data could not be parsed.
          </div>
        </div>
      );
    }

    return (
      <div className="p-4">
        {tablesData.map((table: any, tableIndex: number) => (
          <div
            key={tableIndex}
            className="mb-8 bg-white rounded-lg border border-gray-200 overflow-hidden"
          >
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h3 className="font-medium text-gray-700">
                CASE DETAILS - Table {tableIndex + 1}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                {table[0] && (
                  <thead>
                    <tr className="bg-gray-100">
                      {table[0].map((header: any, headerIndex: number) => (
                        <th
                          key={headerIndex}
                          className="border border-gray-300 p-2 text-left text-xs font-medium text-gray-700 uppercase"
                        >
                          {typeof header === "string" ? header : "Links"}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {table
                    .slice(table[0] ? 1 : 0)
                    .map((row: any, rowIndex: number) => (
                      <tr
                        key={rowIndex}
                        className={
                          rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }
                      >
                        {row.map((cell: any, cellIndex: number) => (
                          <td
                            key={cellIndex}
                            className="border border-gray-200 p-2 text-sm"
                          >
                            {renderCellContent(cell, cellIndex)}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Get all available tabs from the case data
  const availableTabs = Object.keys(caseData).filter(
    (key) => caseData[key]?.success
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-screen overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white z-10">
          <h3 id="modal-title" className="text-lg font-semibold">
            Supreme Court Case
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
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
              >
                {tab.replace(/_/g, " ").toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">{renderTabContent()}</div>

        {/* Modal Footer */}
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

export default function SupremeCourtSearch() {
  const [partyName, setPartyName] = useState("");
  const [partyType, setPartyType] = useState("any");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [partyStatus, setPartyStatus] = useState("P");
  const [searchResults, setSearchResults] = useState<CaseResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState<SupremeCourtCaseData | null>(
    null
  );
  const [showCaseDetails, setShowCaseDetails] = useState(false);
  const [followedCases, setFollowedCases] = useState<Set<string>>(new Set());
  const [followLoading, setFollowLoading] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useState<
    | {
        party_type: string;
        party_name: string;
        year: number;
        party_status: string;
      }
    | null
  >(null);
  const searchQueryResult = useSupremeByParty(searchParams);
  const [detailParams, setDetailParams] = useState<
    | {
        diary_no: number;
        diary_year: number;
      }
    | null
  >(null);
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
      setSelectedCase(data);
      setShowCaseDetails(true);
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
          "View": caseData.diary_number
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
                className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
                placeholder="Enter party name"
                required
              />
              <div className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Example: Tanishk</div>
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
                className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
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
                className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
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
                className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
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
                className="w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                disabled={searchQueryResult.isLoading || searchQueryResult.isFetching}
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
              <p className="text-red-700 dark:text-red-400 font-medium">Search Error</p>
              <p className="text-red-600 dark:text-red-300 text-sm mt-1">{searchQueryResult.error instanceof Error ? searchQueryResult.error.message : "An error occurred while searching"}</p>
              <p className="text-red-500 dark:text-red-300/80 text-xs mt-2">
                Please check your internet connection and try again. If the
                problem persists, contact support.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {!searchQueryResult.isLoading && !searchQueryResult.isFetching && filteredResults.length > 0 && (
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
      {!searchQueryResult.isLoading && !searchQueryResult.isFetching && filteredResults.length > 0 && (
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
                { key: "serial_number", header: "INDEX NO.", width: 100, render: (r) => (
                  <span className="text-gray-800 dark:text-zinc-200 font-medium">{r.serial_number || "N/A"}</span>
                ) },
                { key: "diary_number", header: "DIARY NUMBER", width: 120, render: (r) => (
                  <div className="max-w-[120px] truncate" title={r.diary_number || ""}>{r.diary_number || "N/A"}</div>
                ) },
                { key: "case_number", header: "CASE NUMBER", width: 120, render: (r) => (
                  <div className="max-w-[120px] truncate" title={r.case_number || ""}>{r.case_number || "N/A"}</div>
                ) },
                { key: "petitioner_name", header: "PETITIONER", width: 200, render: (r) => (
                  <div className="max-w-[200px] truncate" title={r.petitioner_name || ""}>{r.petitioner_name || "N/A"}</div>
                ) },
                { key: "respondent_name", header: "RESPONDENT", width: 200, render: (r) => (
                  <div className="max-w-[200px] truncate" title={r.respondent_name || ""}>{r.respondent_name || "N/A"}</div>
                ) },
                { key: "status", header: "STATUS", width: 100, render: (r) => (<StatusPill status={r.status} />) },
                { key: "follow", header: "FOLLOW", width: 80, render: (r) => {
                  const caseId = r.diary_number;
                  return (
                    <FollowButton
                      isFollowing={followedCases.has(caseId)}
                      loading={followLoading === caseId}
                      onClick={() => handleFollowCase(r)}
                      compact
                    />
                  );
                } },
                { key: "actions", header: "ACTIONS", width: 100, render: (r) => {
                  const caseId = r.diary_number;
                  return (
                    <button
                      className="flex items-center justify-center space-x-1 px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
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
                } },
              ];
              return (
                <div className="inline-block min-w-full bg-white dark:bg-zinc-900 rounded-xl shadow-lg overflow-hidden border-4 border-white dark:border-zinc-900">
                  <ResultsTable columns={columns} rows={filteredResults} rowKey={(r) => r.diary_number} />
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* No Data Found State */}
      {!searchQueryResult.isLoading && !searchQueryResult.isFetching && filteredResults.length === 0 && partyName && (
        <div className="mt-6 p-8 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">
            No Data Found
          </h3>
          <p className="text-gray-600 dark:text-zinc-400 max-w-md mx-auto">
            No cases found for party name &quot;{partyName}&quot; in year {year}
            . Please verify the party name and search criteria, or try a
            different search.
          </p>
        </div>
      )}

      {/* No Search Performed State */}
      {!searchQueryResult.isLoading && !searchQueryResult.isFetching && filteredResults.length === 0 && !partyName && (
        <div className="mt-6 p-8 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">
            Search Supreme Court Cases
          </h3>
          <p className="text-gray-600 dark:text-zinc-400 max-w-md mx-auto">
            Enter a party name and select your search criteria to find Supreme
            Court cases. Use the example &quot;Tanishk&quot; to test the search
            functionality.
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
