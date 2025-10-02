"use client";

import React from "react";
import ResultsTable, { ColumnDef } from "../common/ResultsTable";
import Pagination from "../common/Pagination";
import SearchBar from "../common/SearchBar";
import FollowButton from "../common/FollowButton";
import { Eye, Loader2 } from "lucide-react";

export interface DistrictCourtResult {
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

interface DistrictResultsProps {
  filteredResults: { [courtName: string]: DistrictCourtResult[] };
  pageByCourt: Record<string, number>;
  setPageByCourt: (updater: (prev: Record<string, number>) => Record<string, number>) => void;
  pageSize: number;
  setPageSize: (n: number) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  followedCases: Set<string>;
  followLoading: string | null;
  detailsLoading: string | null;
  onFollow: (r: DistrictCourtResult) => void;
  onViewDetails: (r: DistrictCourtResult) => void;
}

export default function DistrictResults(props: DistrictResultsProps) {
  const {
    filteredResults, pageByCourt, setPageByCourt, pageSize, setPageSize,
    searchQuery, setSearchQuery,
    followedCases, followLoading, detailsLoading,
    onFollow, onViewDetails
  } = props;

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium">Search Results</h3>
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {Object.keys(filteredResults).length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700">No results found for your search criteria.</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(filteredResults).map(([courtName, cases]) => {
            const page = pageByCourt[courtName] || 1;
            const total = cases.length;
            const startIndex = (page - 1) * pageSize;
            const endIndex = Math.min(page * pageSize, total);
            const currentCases = cases.slice(startIndex, endIndex);

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
              { key: "actions", header: "VIEW", width: 140, render: (r) => {
                const caseId = r.cino;
                return (
                  <div className="flex items-center space-x-2">
                    <FollowButton
                      isFollowing={followedCases.has(caseId)}
                      loading={followLoading === caseId}
                      onClick={() => { if (!followedCases.has(caseId)) onFollow(r); }}
                      compact
                    />
                    <button
                      className="flex items-center justify-center space-x-1 px-2 py-1 text-xs font-medium text-white bg-black rounded hover:bg-gray-800 transition-colors"
                      onClick={() => onViewDetails(r)}
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
              <div key={courtName} className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-zinc-800">
                <div className="bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-800 px-4 py-3">
                  <h4 className="text-lg font-semibold text-black dark:text-zinc-200">{courtName}</h4>
                </div>
                <ResultsTable columns={columns} rows={currentCases} rowKey={(r) => r.cino} />
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
  );
}


