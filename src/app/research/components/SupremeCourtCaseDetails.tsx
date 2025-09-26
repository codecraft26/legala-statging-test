"use client";

import React, { useState } from "react";
import {
  Search,
  Loader2,
  Calendar,
  Users,
  FileText,
  Scale,
  Clock,
  MapPin,
  Tag,
  Star,
  Eye,
} from "lucide-react";
import { useResearchAPI } from "@/hooks/use-research";
import { Button } from "@/components/ui/button";

interface CaseDetails {
  diary_no: number;
  diary_year: number;
  case_number: string;
  case_title: string;
  case_type: string;
  filing_date: string;
  registration_date: string;
  case_status: string;
  bench: string;
  coram: Array<{
    judge_name: string;
    designation: string;
  }>;
  subject: string;
  acts_sections: string[];
  parties: {
    petitioners: Array<{
      party_name: string;
      party_type: string;
      advocate: string;
      advocate_on_record: string;
    }>;
    respondents: Array<{
      party_name: string;
      party_type: string;
      advocate: string;
      advocate_on_record: string;
    }>;
  };
  case_history: Array<{
    court_name: string;
    case_number: string;
    decision: string;
    date: string;
    judge: string;
  }>;
  next_hearing: {
    date: string;
    time: string;
    court_hall: string;
    purpose: string;
  };
  orders_judgments: Array<{
    date: string;
    order_type: string;
    description: string;
    next_date: string;
  }>;
  case_summary: string;
  relief_sought: string[];
  case_documents: Array<{
    document_type: string;
    filed_date: string;
    pages: number;
  }>;
  case_tags: string[];
  priority: string;
  connected_matters: any[];
  interim_orders: Array<{
    date: string;
    order: string;
    judge: string;
  }>;
}

interface CaseDetailsResponse {
  status: number;
  data: {
    case_details: CaseDetails;
    metadata: {
      last_updated: string;
      data_source: string;
      api_version: string;
      response_time: string;
    };
  };
}

export default function SupremeCourtCaseDetails() {
  const [diaryNumber, setDiaryNumber] = useState("");
  const [diaryYear, setDiaryYear] = useState(
    new Date().getFullYear().toString()
  );
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [followedCases, setFollowedCases] = useState<Set<string>>(new Set());
  const [followLoading, setFollowLoading] = useState<string | null>(null);

  const {
    loading,
    error,
    getSupremeCourtCaseDetail,
    followResearch,
    unfollowResearch,
  } = useResearchAPI();

  // Generate years for dropdown (last 30 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) =>
    (currentYear - i).toString()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      console.warn("Getting Supreme Court case details:", {
        diary_no: parseInt(diaryNumber),
        diary_year: parseInt(diaryYear),
      });

      const data = await getSupremeCourtCaseDetail({
        diary_no: parseInt(diaryNumber),
        diary_year: parseInt(diaryYear),
      });

      console.warn("API Response:", data);

      // Handle the response structure
      if (data && data.data && data.data.case_details) {
        setCaseDetails(data.data.case_details);
      } else {
        console.warn(
          "No case details found or unexpected API response structure:",
          data
        );
        setCaseDetails(null);
      }
    } catch (err) {
      console.error("Failed to fetch case details:", err);
      setCaseDetails(null);
    }
  };

  const handleFollowCase = async (caseData: CaseDetails) => {
    const caseId = `${caseData.diary_no}/${caseData.diary_year}`;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "disposed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">
        Get Supreme Court Case Details
      </h2>

      <div className="bg-white p-6 rounded-md border border-gray-200 max-w-xl mb-6">
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
                Diary Year
              </label>
              <select
                id="year-select"
                value={diaryYear}
                onChange={(e) => setDiaryYear(e.target.value)}
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
                    <span>Loading...</span>
                  </div>
                ) : (
                  <>
                    <Search size={16} />
                    <span>Get Details</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
            <div>
              <p className="text-red-700 font-medium">Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Case Details Display */}
      {caseDetails && (
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {caseDetails.case_title}
                </h3>
                <p className="text-lg text-gray-600 mb-2">
                  {caseDetails.case_number}
                </p>
                <div className="flex items-center space-x-4 mb-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(caseDetails.case_status)}`}
                  >
                    {caseDetails.case_status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {caseDetails.case_type}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFollowCase(caseDetails)}
                disabled={
                  followLoading ===
                  `${caseDetails.diary_no}/${caseDetails.diary_year}`
                }
                className={
                  followedCases.has(
                    `${caseDetails.diary_no}/${caseDetails.diary_year}`
                  )
                    ? "text-yellow-700 bg-yellow-50 border-yellow-200"
                    : ""
                }
              >
                {followLoading ===
                `${caseDetails.diary_no}/${caseDetails.diary_year}` ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Star
                      size={16}
                      className={
                        followedCases.has(
                          `${caseDetails.diary_no}/${caseDetails.diary_year}`
                        )
                          ? "text-yellow-600 fill-yellow-500"
                          : ""
                      }
                    />
                    <span className="ml-1">
                      {followedCases.has(
                        `${caseDetails.diary_no}/${caseDetails.diary_year}`
                      )
                        ? "Following"
                        : "Follow"}
                    </span>
                  </>
                )}
              </Button>
            </div>

            {/* Key Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Filing Date</p>
                  <p className="font-medium">
                    {formatDate(caseDetails.filing_date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Registration Date</p>
                  <p className="font-medium">
                    {formatDate(caseDetails.registration_date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Scale className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Bench</p>
                  <p className="font-medium text-sm">{caseDetails.bench}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Case Summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold mb-3 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Case Summary
            </h4>
            <p className="text-gray-700 leading-relaxed">
              {caseDetails.case_summary}
            </p>
          </div>

          {/* Parties Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Parties
            </h4>

            {/* Petitioners */}
            <div className="mb-6">
              <h5 className="font-medium text-gray-900 mb-3">Petitioners</h5>
              <div className="space-y-3">
                {caseDetails.parties.petitioners.map((petitioner, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-blue-500 pl-4 py-2"
                  >
                    <p className="font-medium text-gray-900">
                      {petitioner.party_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Advocate: {petitioner.advocate}
                    </p>
                    <p className="text-sm text-gray-600">
                      AOR: {petitioner.advocate_on_record}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Respondents */}
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Respondents</h5>
              <div className="space-y-3">
                {caseDetails.parties.respondents.map((respondent, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-red-500 pl-4 py-2"
                  >
                    <p className="font-medium text-gray-900">
                      {respondent.party_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Advocate: {respondent.advocate}
                    </p>
                    <p className="text-sm text-gray-600">
                      AOR: {respondent.advocate_on_record}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Next Hearing */}
          {caseDetails.next_hearing && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-lg font-semibold mb-3 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Next Hearing
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium">
                    {formatDate(caseDetails.next_hearing.date)} at{" "}
                    {caseDetails.next_hearing.time}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Court Hall</p>
                  <p className="font-medium">
                    {caseDetails.next_hearing.court_hall}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Purpose</p>
                  <p className="font-medium">
                    {caseDetails.next_hearing.purpose}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Relief Sought */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold mb-3">Relief Sought</h4>
            <ul className="space-y-2">
              {caseDetails.relief_sought.map((relief, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span className="text-gray-700">{relief}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Acts & Sections */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold mb-3">Acts & Sections</h4>
            <div className="space-y-2">
              {caseDetails.acts_sections.map((act, index) => (
                <div key={index} className="bg-gray-50 px-3 py-2 rounded-md">
                  <span className="text-gray-700">{act}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Case History */}
          {caseDetails.case_history && caseDetails.case_history.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-lg font-semibold mb-3">Case History</h4>
              <div className="space-y-4">
                {caseDetails.case_history.map((history, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-gray-300 pl-4 py-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {history.court_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {history.case_number}
                        </p>
                        <p className="text-sm text-gray-600">
                          Judge: {history.judge}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {formatDate(history.date)}
                        </p>
                        <p className="font-medium text-gray-900">
                          {history.decision}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orders & Judgments */}
          {caseDetails.orders_judgments &&
            caseDetails.orders_judgments.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-lg font-semibold mb-3">
                  Orders & Judgments
                </h4>
                <div className="space-y-4">
                  {caseDetails.orders_judgments.map((order, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-900">
                          {order.order_type}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(order.date)}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{order.description}</p>
                      {order.next_date && (
                        <p className="text-sm text-blue-600">
                          Next Date: {formatDate(order.next_date)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Case Tags */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold mb-3 flex items-center">
              <Tag className="h-5 w-5 mr-2" />
              Case Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {caseDetails.case_tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Data Found State */}
      {!loading && !caseDetails && !error && diaryNumber && diaryYear && (
        <div className="mt-6 p-8 bg-white rounded-lg border border-gray-200 text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Data Found
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            No case details found for diary number {diaryNumber} of year{" "}
            {diaryYear}. Please verify the diary number and year, or try a
            different case.
          </p>
        </div>
      )}

      {/* No Search Performed State */}
      {!loading && !caseDetails && !error && !diaryNumber && !diaryYear && (
        <div className="mt-6 p-8 bg-white rounded-lg border border-gray-200 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Get Supreme Court Case Details
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Enter a diary number and year to get comprehensive case details
            including parties, case history, orders, and more.
          </p>
        </div>
      )}
    </div>
  );
}
