"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, Eye, Loader2 } from "lucide-react";
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
import FollowButton from "./common/FollowButton";
import StatusPill from "./common/StatusPill";
import CaseDetailsModal from "./common/CaseDetailsModal";
import { parseCaseDetailsHTML, parseDistrictCourtHTML, ParsedCaseDetails } from "../utils/district-parsers";
import DistrictSearchForm from "./district/DistrictSearchForm";
import DistrictResults from "./district/DistrictResults";

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

//

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
      const parsed = parseDistrictCourtHTML(html, districtName, litigantName, caseStatus);
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

  //

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

      <DistrictSearchForm
        stateName={stateName}
        setStateName={setStateName}
        states={states}
        districtsQueryLoading={districtsQuery.isLoading}
        districtsQueryError={districtsQuery.error}
        districtName={districtName}
        setDistrictName={setDistrictName}
        apiDistricts={apiDistricts}
        uniqueDistricts={uniqueDistricts}
        litigantName={litigantName}
        setLitigantName={setLitigantName}
        regYear={regYear}
        setRegYear={setRegYear}
        years={years}
        caseStatus={caseStatus}
        setCaseStatus={setCaseStatus}
        estMenuOpen={estMenuOpen}
        setEstMenuOpen={setEstMenuOpen}
        estLoading={estLoading}
        estError={estError}
        estCodeOptions={estCodeOptions}
        selectedEstCodes={selectedEstCodes}
        onToggleEstCode={handleEstCodeToggle}
        onSelectAllEstCodes={handleSelectAllEstCodes}
        onClearAllEstCodes={handleClearAllEstCodes}
        onSubmit={handleSubmit}
        isSearching={partyQuery.isLoading || partyQuery.isFetching}
      />

      {/* Error Display */}
      {partyQuery.error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md">
          <p className="text-red-700 dark:text-red-400">{partyQuery.error instanceof Error ? partyQuery.error.message : "An error occurred while searching"}</p>
        </div>
      )}

      {/* Results Section */}
      {!partyQuery.isLoading && !partyQuery.isFetching && Object.keys(searchResults).length > 0 && (
        <DistrictResults
          filteredResults={filteredResults}
          pageByCourt={pageByCourt}
          setPageByCourt={setPageByCourt}
                      pageSize={pageSize}
          setPageSize={setPageSize}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          followedCases={followedCases}
          followLoading={followLoading}
          detailsLoading={detailsLoading}
          onFollow={handleFollowCase}
          onViewDetails={handleViewDetails}
        />
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
