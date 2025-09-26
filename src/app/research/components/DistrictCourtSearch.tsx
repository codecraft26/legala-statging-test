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
  const [estCode, setEstCode] = useState("JKSG02,JKSG01,JKSG03");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = await searchDistrictCourtByParty({
        district_name: districtName.toLowerCase(),
        litigant_name: litigantName,
        reg_year: parseInt(regYear),
        case_status: caseStatus,
        est_code: estCode,
      });

      setSearchResults(data?.results || []);
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
                Establishment Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={estCode}
                  onChange={(e) => setEstCode(e.target.value)}
                  className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  placeholder="Enter establishment codes (comma-separated)"
                  list="estCodeDatalistMain"
                  disabled={estLoading}
                />
                <datalist id="estCodeDatalistMain">
                  {estCodeOptions.map((option, index) => (
                    <option key={index} value={option.code}>
                      {option.description}
                    </option>
                  ))}
                </datalist>
              </div>
              {estError && (
                <div className="text-sm text-red-500 mt-1">
                  Error loading EST codes: {estError}
                </div>
              )}
              {estCodeOptions.length > 0 ? (
                <div className="text-sm text-gray-500 mt-1">
                  {estCodeOptions.length} EST codes available for {districtName}
                  . Type to search or use dropdown.
                </div>
              ) : (
                <div className="text-sm text-gray-500 mt-1">
                  Example: JKSG02,JKSG01,JKSG03
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
                        className="px-6 py-4 text-sm font-semibold text-black text-left"
                        style={{ minWidth: "150px" }}
                      >
                        CINO
                      </th>
                      <th
                        className="px-6 py-4 text-sm font-semibold text-black text-left"
                        style={{ minWidth: "120px" }}
                      >
                        DISTRICT
                      </th>
                      <th
                        className="px-6 py-4 text-sm font-semibold text-black text-left"
                        style={{ minWidth: "150px" }}
                      >
                        LITIGANT NAME
                      </th>
                      <th
                        className="px-6 py-4 text-sm font-semibold text-black text-left"
                        style={{ minWidth: "100px" }}
                      >
                        STATUS
                      </th>
                      <th
                        className="px-6 py-4 text-sm font-semibold text-black text-left"
                        style={{ minWidth: "120px" }}
                      >
                        FOLLOW
                      </th>
                      <th
                        className="px-6 py-4 text-sm font-semibold text-black text-left"
                        style={{ minWidth: "120px" }}
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
                          } border-b-4 border-white last:border-b-0`}
                        >
                          <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                            {result.cino}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {result.district_name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {result.litigant_name ||
                              result.petitioner_name ||
                              "N/A"}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge
                              status={
                                result.case_status || result.status || "PENDING"
                              }
                            />
                          </td>
                          <td className="px-6 py-4">
                            <button
                              className={`flex items-center justify-center space-x-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm ${
                                followedCases.has(caseId)
                                  ? "text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
                                  : "text-gray-700 bg-gray-100 hover:bg-gray-200"
                              }`}
                              onClick={() => handleFollowCase(result)}
                              disabled={followLoading === caseId}
                            >
                              {followLoading === caseId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Star
                                    size={16}
                                    className={
                                      followedCases.has(caseId)
                                        ? "text-yellow-600 fill-yellow-500"
                                        : ""
                                    }
                                  />
                                  <span>
                                    {followedCases.has(caseId)
                                      ? "Following"
                                      : "Follow"}
                                  </span>
                                </>
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              className="flex items-center justify-center w-32 space-x-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                              onClick={() => handleViewDetails(result)}
                              disabled={detailsLoading === caseId}
                            >
                              {detailsLoading === caseId ? (
                                <div className="flex items-center space-x-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>Loading...</span>
                                </div>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4" />
                                  <span>Details</span>
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
