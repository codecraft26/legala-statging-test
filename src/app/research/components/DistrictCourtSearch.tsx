"use client";

import React, { useState, useMemo } from "react";
import { Search, Star, Eye, Loader2, X } from "lucide-react";
import { useResearchAPI } from "@/hooks/use-research";
import { districtId } from "../utils/districtId";
import { useEstCodes } from "@/hooks/use-est-codes";

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

export default function DistrictCourtSearch() {
  const [districtName, setDistrictName] = useState("srinagar");
  const [litigantName, setLitigantName] = useState("");
  const [regYear, setRegYear] = useState(new Date().getFullYear().toString());
  const [caseStatus, setCaseStatus] = useState("P");
  const [selectedEstCodes, setSelectedEstCodes] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<DistrictCourtResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState<CaseDetails | null>(null);
  const [showCaseDetails, setShowCaseDetails] = useState(false);
  const [followedCases, setFollowedCases] = useState<Set<string>>(new Set());
  const [followLoading, setFollowLoading] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<string | null>(null);

  const {
    loading,
    error,
    searchDistrictCourtByParty,
    getDistrictCourtCaseDetail,
    followResearch,
    unfollowResearch,
  } = useResearchAPI();

  const {
    getEstCodeOptionsForDistrict,
    loading: estLoading,
    error: estError,
  } = useEstCodes();

  const estCodeOptions = useMemo(() => {
    return districtName ? getEstCodeOptionsForDistrict(districtName) : [];
  }, [districtName, getEstCodeOptionsForDistrict]);

  // Generate years for dropdown (last 30 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) =>
    (currentYear - i).toString()
  );

  // Get unique district names for dropdown
  const uniqueDistricts = Array.from(
    new Set(districtId.map((d) => d.name.toLowerCase()))
  ).sort();

  // Filter search results based on searchQuery
  const filteredResults = searchResults.filter((result) =>
    Object.values(result).some((value) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

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

  // Function to parse HTML response from district court API
  const parseDistrictCourtHTML = (
    htmlString: string
  ): DistrictCourtResult[] => {
    const results: DistrictCourtResult[] = [];

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

        if (tbody) {
          const rows = tbody.querySelectorAll("tr");

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
                results.push({
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
        }
      });
    } catch (error) {
      console.error("Error parsing HTML response:", error);
    }

    return results;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedEstCodes.length === 0) {
      alert("Please select at least one EST code");
      return;
    }

    try {
      const response = await searchDistrictCourtByParty({
        district_name: districtName.toLowerCase(),
        litigant_name: litigantName,
        reg_year: parseInt(regYear),
        case_status: caseStatus,
        est_code: selectedEstCodes.join(","),
      });

      // Parse the HTML response
      if (response?.data?.data) {
        const parsedResults = parseDistrictCourtHTML(response.data.data);
        setSearchResults(parsedResults);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  const handleViewDetails = async (result: DistrictCourtResult) => {
    const caseId = result.cino;
    setDetailsLoading(caseId);

    try {
      const details = await getDistrictCourtCaseDetail({
        cino: result.cino,
        district_name: result.district_name,
      });

      setSelectedCase(details);
      setShowCaseDetails(true);
    } catch (err) {
      console.error("Failed to fetch case details:", err);
    } finally {
      setDetailsLoading(null);
    }
  };

  const handleFollowCase = async (caseData: DistrictCourtResult) => {
    const caseId = caseData.cino;
    setFollowLoading(caseId);

    try {
      if (followedCases.has(caseId)) {
        await unfollowResearch(caseId);
        setFollowedCases((prev) => {
          const newSet = new Set(prev);
          newSet.delete(caseId);
          return newSet;
        });
      } else {
        await followResearch({
          court: "District_Court",
          followed: caseData,
          workspaceId: "current-workspace", // Replace with actual workspace ID
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
      <h2 className="text-xl font-semibold mb-4">
        District Court Cases by Party Name
      </h2>

      <div className="bg-white p-6 rounded-md border border-gray-200 max-w-2xl">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                District Name *
              </label>
              <select
                value={districtName}
                onChange={(e) => setDistrictName(e.target.value)}
                className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
                required
              >
                {uniqueDistricts.map((district) => (
                  <option key={district} value={district}>
                    {district.charAt(0).toUpperCase() + district.slice(1)}
                  </option>
                ))}
              </select>
              <div className="text-sm text-gray-500 mt-1">
                Example: srinagar
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Litigant Name *
              </label>
              <input
                type="text"
                value={litigantName}
                onChange={(e) => setLitigantName(e.target.value)}
                className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
                placeholder="Enter litigant name"
                required
              />
              <div className="text-sm text-gray-500 mt-1">Example: Ashok</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Registration Year
              </label>
              <select
                value={regYear}
                onChange={(e) => setRegYear(e.target.value)}
                className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Case Status
              </label>
              <select
                value={caseStatus}
                onChange={(e) => setCaseStatus(e.target.value)}
                className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="P">P (Pending)</option>
                <option value="D">D (Disposed)</option>
                <option value="A">A (All)</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Establishment Code *
              </label>

              {/* EST Code Selection Controls */}
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={handleSelectAllEstCodes}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  disabled={estLoading || estCodeOptions.length === 0}
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleClearAllEstCodes}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  disabled={estLoading}
                >
                  Clear All
                </button>
                <span className="text-xs text-gray-500 self-center">
                  {selectedEstCodes.length} selected
                </span>
              </div>

              {/* EST Code Checkboxes */}
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3 bg-gray-50">
                {estLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">
                      Loading EST codes...
                    </span>
                  </div>
                ) : estError ? (
                  <div className="text-sm text-red-500">
                    Error loading EST codes: {estError}
                  </div>
                ) : estCodeOptions.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {estCodeOptions.map((option, index) => (
                      <label
                        key={index}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-white p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEstCodes.includes(option.code)}
                          onChange={() => handleEstCodeToggle(option.code)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-900">
                            {option.code}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {option.description}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center py-2">
                    No EST codes available for {districtName}
                  </div>
                )}
              </div>

              {/* Selected EST Codes Display */}
              {selectedEstCodes.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-600 mb-1">
                    Selected EST codes:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedEstCodes.map((code) => (
                      <span
                        key={code}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {code}
                        <button
                          type="button"
                          onClick={() => handleEstCodeToggle(code)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {estCodeOptions.length > 0 && (
                <div className="text-sm text-gray-500 mt-1">
                  {estCodeOptions.length} EST codes available for {districtName}
                </div>
              )}
            </div>

            <div className="md:col-span-2 md:flex md:justify-end">
              <button
                type="submit"
                className="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
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
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Results Section */}
      {!loading && searchResults.length > 0 && (
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
            <div className="w-full overflow-x-auto">
              <div className="inline-block min-w-full bg-white rounded-xl shadow-lg overflow-hidden border-4 border-white">
                <table className="min-w-full border-collapse table-fixed">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-300 to-gray-300 border-b-4 border-white">
                      <th
                        className="px-3 py-3 text-xs font-semibold text-black text-left"
                        style={{ minWidth: "100px" }}
                      >
                        SERIAL NO.
                      </th>
                      <th
                        className="px-3 py-3 text-xs font-semibold text-black text-left"
                        style={{ minWidth: "150px" }}
                      >
                        CASE TYPE/NUMBER/YEAR
                      </th>
                      <th
                        className="px-3 py-3 text-xs font-semibold text-black text-left"
                        style={{ minWidth: "200px" }}
                      >
                        PETITIONER VS RESPONDENT
                      </th>
                      <th
                        className="px-3 py-3 text-xs font-semibold text-black text-left"
                        style={{ minWidth: "120px" }}
                      >
                        COURT
                      </th>
                      <th
                        className="px-3 py-3 text-xs font-semibold text-black text-left"
                        style={{ minWidth: "100px" }}
                      >
                        CINO
                      </th>
                      <th
                        className="px-3 py-3 text-xs font-semibold text-black text-left"
                        style={{ minWidth: "80px" }}
                      >
                        FOLLOW
                      </th>
                      <th
                        className="px-3 py-3 text-xs font-semibold text-black text-left"
                        style={{ minWidth: "80px" }}
                      >
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="border-y-4 border-white">
                    {filteredResults.map((result, index) => {
                      const caseId = result.cino;
                      return (
                        <tr
                          key={caseId}
                          className={`transition-colors hover:bg-blue-50 ${
                            index % 2 === 0 ? "bg-white" : "bg-blue-50"
                          } border-b-2 border-gray-100 last:border-b-0`}
                        >
                          <td className="px-3 py-3 text-xs text-gray-800 font-medium">
                            {result.serial_number || "N/A"}
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-700">
                            <div
                              className="max-w-[150px] truncate"
                              title={`${result.case_type || ""}/${result.case_number || ""}/${result.case_year || ""}`}
                            >
                              {result.case_type || "N/A"}/
                              {result.case_number || "N/A"}/
                              {result.case_year || "N/A"}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-700">
                            <div className="max-w-[200px]">
                              <div
                                className="truncate"
                                title={result.petitioner_name || ""}
                              >
                                <strong>Petitioner:</strong>{" "}
                                {result.petitioner_name || "N/A"}
                              </div>
                              {result.respondent_name && (
                                <div
                                  className="truncate mt-1"
                                  title={result.respondent_name}
                                >
                                  <strong>Respondent:</strong>{" "}
                                  {result.respondent_name}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-700">
                            <div
                              className="max-w-[120px] truncate"
                              title={result.court_name || ""}
                            >
                              {result.court_name || "N/A"}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-800 font-medium">
                            {result.cino}
                          </td>
                          <td className="px-3 py-3">
                            <button
                              className={`flex items-center justify-center space-x-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                                followedCases.has(caseId)
                                  ? "text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
                                  : "text-gray-700 bg-gray-100 hover:bg-gray-200"
                              }`}
                              onClick={() => handleFollowCase(result)}
                              disabled={followLoading === caseId}
                            >
                              {followLoading === caseId ? (
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
                              disabled={detailsLoading === caseId}
                            >
                              {detailsLoading === caseId ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Eye className="w-3 h-3" />
                                  <span className="hidden sm:inline">
                                    Details
                                  </span>
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
