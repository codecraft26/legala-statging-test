"use client";

import React, { useState, useEffect } from "react";
import { Search, Star, Eye, Loader2, X } from "lucide-react";
import { useResearchAPI } from "@/hooks/use-research";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface CaseResult {
  serial_number: number;
  diary_number: string;
  case_number: string;
  petitioner_name: string;
  respondent_name: string;
  status: string;
  action: string;
}

interface CaseDetails {
  // Define based on actual API response structure
  [key: string]: any;
}

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

export default function SupremeCourtDiarySearch() {
  const [diaryNumber, setDiaryNumber] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [searchResults, setSearchResults] = useState<CaseResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState<CaseDetails | null>(null);
  const [showCaseDetails, setShowCaseDetails] = useState(false);
  const [followedCases, setFollowedCases] = useState<Set<string>>(new Set());
  const [followLoading, setFollowLoading] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<string | null>(null);

  const {
    loading,
    error,
    searchSupremeCourtByDiary,
    getSupremeCourtCaseDetail,
    followResearch,
    unfollowResearch,
  } = useResearchAPI();

  // Generate years for dropdown (last 30 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) =>
    (currentYear - i).toString()
  );

  // Filter search results based on searchQuery
  const filteredResults = searchResults.filter((result) =>
    Object.values(result).some((value) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      console.warn("Searching Supreme Court with diary number:", {
        diary_no: parseInt(diaryNumber),
        year: parseInt(year),
      });

      const data = await searchSupremeCourtByDiary({
        diary_no: parseInt(diaryNumber),
        year: parseInt(year),
      });

      console.warn("API Response:", data);

      // Handle different possible response structures
      let results = [];
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

      setSearchResults(results);
      console.warn("Processed results:", results);
    } catch (err) {
      console.error("Search failed:", err);
      setSearchResults([]);
    }
  };

  const handleViewDetails = async (result: CaseResult) => {
    const [diaryNumber, diaryYear] = result.diary_number.split("/");
    setDetailsLoading(result.diary_number);

    try {
      const details = await getSupremeCourtCaseDetail({
        diary_no: parseInt(diaryNumber),
        diary_year: parseInt(diaryYear),
      });

      setSelectedCase(details);
      setShowCaseDetails(true);
    } catch (err) {
      console.error("Failed to fetch case details:", err);
    } finally {
      setDetailsLoading(null);
    }
  };

  const handleFollowCase = async (caseData: CaseResult) => {
    const caseId = caseData.diary_number;
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
          court: "Supreme_Court",
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
        Supreme Court Cases by Diary Number
      </h2>

      <div className="bg-white p-6 rounded-md border border-gray-200 max-w-xl">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label
                htmlFor="diary-input"
                className="block text-sm font-medium mb-1 text-gray-700"
              >
                Diary Number *
              </label>
              <input
                type="number"
                id="diary-input"
                value={diaryNumber}
                onChange={(e) => setDiaryNumber(e.target.value)}
                className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
                placeholder="Enter diary number"
                required
              />
              <div className="text-sm text-gray-500 mt-1">Example: 406</div>
            </div>

            <div>
              <label
                htmlFor="year-select"
                className="block text-sm font-medium mb-1 text-gray-700"
              >
                Year
              </label>
              <select
                id="year-select"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
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
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
            <div>
              <p className="text-red-700 font-medium">Search Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <p className="text-red-500 text-xs mt-2">
                Please check your internet connection and try again. If the
                problem persists, contact support.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {!loading && searchResults.length > 0 && (
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Index No.</TableHead>
                    <TableHead>Diary Number</TableHead>
                    <TableHead>Case Number</TableHead>
                    <TableHead>Petitioner</TableHead>
                    <TableHead>Respondent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Follow</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result) => (
                    <TableRow key={result.serial_number}>
                      <TableCell className="font-medium">
                        {result.serial_number}
                      </TableCell>
                      <TableCell>{result.diary_number}</TableCell>
                      <TableCell>{result.case_number}</TableCell>
                      <TableCell>{result.petitioner_name}</TableCell>
                      <TableCell>{result.respondent_name}</TableCell>
                      <TableCell>
                        <StatusBadge status={result.status} />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFollowCase(result)}
                          disabled={followLoading === result.diary_number}
                          className={
                            followedCases.has(result.diary_number)
                              ? "text-yellow-700 bg-yellow-50 border-yellow-200"
                              : ""
                          }
                        >
                          {followLoading === result.diary_number ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Star
                                size={16}
                                className={
                                  followedCases.has(result.diary_number)
                                    ? "text-yellow-600 fill-yellow-500"
                                    : ""
                                }
                              />
                              <span className="ml-1">
                                {followedCases.has(result.diary_number)
                                  ? "Following"
                                  : "Follow"}
                              </span>
                            </>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleViewDetails(result)}
                          disabled={detailsLoading === result.diary_number}
                        >
                          {detailsLoading === result.diary_number ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Details
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* No Data Found State */}
      {!loading &&
        searchResults.length === 0 &&
        !error &&
        diaryNumber &&
        year && (
          <div className="mt-6 p-8 bg-white rounded-lg border border-gray-200 text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Data Found
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              No cases found for diary number {diaryNumber} of year {year}.
              Please verify the diary number and year, or try a different case.
            </p>
          </div>
        )}

      {/* No Search Performed State */}
      {!loading &&
        searchResults.length === 0 &&
        !error &&
        !diaryNumber &&
        !year && (
          <div className="mt-6 p-8 bg-white rounded-lg border border-gray-200 text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Search Supreme Court Cases by Diary Number
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Enter a diary number and select the year to find Supreme Court
              cases. Use the example &quot;406&quot; to test the search
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
