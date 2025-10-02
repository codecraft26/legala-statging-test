"use client";

import React, { useState, useEffect } from "react";
import ResearchShell from "@/components/research-shell";
import { FollowedDistrictTable } from "../components/FollowedDistrictTable";
import { FollowedHighCourtTable } from "../components/FollowedHighCourtTable";
import { FollowedSupremeTable } from "../components/FollowedSupremeTable";
import { Bookmark, BookmarkX, ExternalLink, Calendar, User, FileText, Eye, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useFollowedResearch, useUnfollowResearch, useDistrictDetail, useHighDetail, useSupremeDetail } from "@/hooks/use-research";
import { getCookie } from "@/lib/utils";
import CaseDetailsModal from "../components/common/CaseDetailsModal";
import HighCourtCaseDetailsModal from "../components/common/HighCourtCaseDetailsModal";
import { parseCaseDetailsHTML, ParsedCaseDetails } from "../utils/district-parsers";
import { parseHighCourtHtml, ParsedHighCourtDetails } from "../utils/highCourtParser";
import SupremeCaseDetailsDialog from "../components/SupremeCaseDetailsDialog";
import { createSupremeCourtCaseData, SupremeCaseData } from "../utils/supreme-parser";

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
  const [districtModalData, setDistrictModalData] = useState<ParsedCaseDetails | null>(null);
  const [highModalData, setHighModalData] = useState<{ cino?: string; case_no?: string; details?: ParsedHighCourtDetails } | null>(null);
  const [supremeModalData, setSupremeModalData] = useState<SupremeCaseData | null>(null);
  const [showCaseDetails, setShowCaseDetails] = useState<null | CourtType>(null);
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
      // Derive diary_no and diary_year from either diary_number or action string
      const diaryNumberField = caseItem.followed["diary_number"] as string | undefined;
      const actionField = caseItem.followed["action"] as string | undefined;
      let diaryNo = 0;
      let diaryYear = new Date().getFullYear();

      if (diaryNumberField && diaryNumberField.includes("/")) {
        const [noStr, yearStr] = diaryNumberField.split("/");
        diaryNo = parseInt(noStr || "0");
        diaryYear = parseInt(yearStr || String(diaryYear));
      } else if (actionField && actionField.includes("diary_no=") && actionField.includes("diary_year=")) {
        const url = new URL(actionField.startsWith("http") ? actionField : `http://x${actionField}`);
        diaryNo = parseInt(url.searchParams.get("diary_no") || "0");
        diaryYear = parseInt(url.searchParams.get("diary_year") || String(diaryYear));
      }

      setSupremeDetailParams({ diary_no: diaryNo, diary_year: diaryYear });
    }
  };

  // Handle District detail response -> parse and open shared modal
  useEffect(() => {
    if (districtDetailParams && !districtDetailQuery.isLoading && !districtDetailQuery.isFetching) {
      if (districtDetailQuery.error) {
        console.error("District Court Detail Query Error:", districtDetailQuery.error);
        alert(`Failed to fetch District Court case details: ${districtDetailQuery.error.message}`);
        setDetailsLoading(null);
        return;
      }
      const raw = (districtDetailQuery.data && typeof districtDetailQuery.data === "object" && (districtDetailQuery.data as any).data)
        ? (districtDetailQuery.data as any).data
        : districtDetailQuery.data;
      if (typeof raw === "string") {
        const parsed = parseCaseDetailsHTML(raw);
        if (parsed) {
          setDistrictModalData(parsed);
          setShowCaseDetails("District_Court");
        }
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
      const raw = (highDetailQuery.data && typeof highDetailQuery.data === "object" && (highDetailQuery.data as any).data)
        ? (highDetailQuery.data as any).data
        : highDetailQuery.data;
      if (typeof raw === "string") {
        const details = parseHighCourtHtml(raw);
        setHighModalData({
          cino: highDetailParams?.cino ? String(highDetailParams.cino) : undefined,
          case_no: highDetailParams?.case_no ? String(highDetailParams.case_no) : undefined,
          details,
        });
        setShowCaseDetails("High_Court");
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
      const data = supremeDetailQuery.data;
      const payload = data && typeof data === "object" && (data as any).data ? (data as any).data : data;
      const html = (payload && typeof payload === "object")
        ? ((payload as any).case_details || (payload as any).html || (payload as any).content || (payload as any).data?.case_details)
        : undefined;
      let normalized: SupremeCaseData | null = null;
      if (typeof html === "string") {
        normalized = createSupremeCourtCaseData(html);
      } else if (payload && typeof payload === "object") {
        normalized = payload as SupremeCaseData;
      }
      if (normalized) {
        setSupremeModalData(normalized);
        setShowCaseDetails("Supreme_Court");
      }
      setDetailsLoading(null);
    }
  }, [supremeDetailQuery.data, supremeDetailQuery.error, supremeDetailQuery.isLoading, supremeDetailQuery.isFetching, supremeDetailParams]);

  


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
    const paginate = (rows: FollowedCase[]) => {
      const total = rows.length;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      return { total, currentPageRows: rows.slice(start, end) };
    };

    if (court === "District_Court") {
      const { total, currentPageRows } = paginate(cases);
      return (
        <FollowedDistrictTable
          rows={currentPageRows}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(n) => setPageSize(n)}
          onView={handleViewDetails}
          onUnfollow={handleUnfollow}
          detailsLoadingId={detailsLoading}
          unfollowPending={unfollowMutation.isPending}
        />
      );
    }

    // For High Court, show table similar to District
    if (court === "High_Court") {
      const { total, currentPageRows } = paginate(cases);
      return (
        <FollowedHighCourtTable
          rows={currentPageRows}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(n) => setPageSize(n)}
          onView={handleViewDetails}
          onUnfollow={handleUnfollow}
          detailsLoadingId={detailsLoading}
          unfollowPending={unfollowMutation.isPending}
        />
      );
    }

    // For Supreme Court, show table similar to others
    if (court === "Supreme_Court") {
      const { total, currentPageRows } = paginate(cases);
      return (
        <FollowedSupremeTable
          rows={currentPageRows}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(n) => setPageSize(n)}
          onView={handleViewDetails}
          onUnfollow={handleUnfollow}
          detailsLoadingId={detailsLoading}
          unfollowPending={unfollowMutation.isPending}
        />
      );
    }

    // Default fallback
    return null;
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-2">Followed Cases</h1>
          <p className="text-gray-600 dark:text-zinc-400">
            View and manage cases you have followed across different courts
          </p>
        </div>
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
      
      {/* Case Details Modals */}
      {showCaseDetails === "District_Court" && districtModalData && (
        <CaseDetailsModal
          caseData={districtModalData}
          onClose={() => {
            setShowCaseDetails(null);
            setDistrictModalData(null);
            setDistrictDetailParams(null);
          }}
        />
      )}
      {showCaseDetails === "Supreme_Court" && supremeModalData && (
        <SupremeCaseDetailsDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setShowCaseDetails(null);
              setSupremeModalData(null);
              setSupremeDetailParams(null);
            }
          }}
          caseData={supremeModalData}
        />
      )}
      {showCaseDetails === "High_Court" && highModalData && (
        <HighCourtCaseDetailsModal
          caseData={{
            cino: highModalData.cino || "",
            case_no: highModalData.case_no || "",
            case_type: 0,
            case_year: 0,
            case_no2: 0,
            details: highModalData.details || {},
          } as any}
          onClose={() => {
            setShowCaseDetails(null);
            setHighModalData(null);
            setHighDetailParams(null);
          }}
          followedCases={new Set<string>()}
          handleFollowCase={() => {}}
          followMutation={{ isPending: false, mutateAsync: async () => {} }}
          unfollowMutation={unfollowMutation}
        />
      )}
    </ResearchShell>
  );
}


