"use client";

import React from "react";
import { Eye, Loader2 } from "lucide-react";
import ResultsTable, { ColumnDef } from "./ResultsTable";
import FollowButton from "./FollowButton";

export interface HighCourtResult {
  cino: string;
  case_no: string;
  case_type: number;
  case_year: number;
  case_no2: number;
  pet_name?: string;
  res_name?: string;
  type_name?: string;
  date_of_decision?: string;
}

export default function HighCourtAdvocateResultsTable({
  rows,
  isRowFollowed,
  loadingDetailsId,
  onClickDetails,
  onClickFollow,
  followLoading,
}: {
  rows: HighCourtResult[];
  isRowFollowed: (r: HighCourtResult) => boolean;
  loadingDetailsId: string | null;
  onClickDetails: (r: HighCourtResult) => void;
  onClickFollow: (r: HighCourtResult) => void;
  followLoading: boolean;
}) {
  const columns: ColumnDef<HighCourtResult>[] = [
    { key: "cino", header: "CNR", width: 160, render: (r) => r.cino || "N/A" },
    {
      key: "case_no",
      header: "CASE NUMBER",
      width: 140,
      render: (r) => r.case_no || "N/A",
    },
    {
      key: "title",
      header: "TITLE",
      width: 240,
      render: (r) => (
        <div
          className="max-w-[220px] truncate"
          title={`${r.pet_name || ""} vs ${r.res_name || ""}`}
        >
          {r.pet_name && r.res_name
            ? `${r.pet_name} vs ${r.res_name}`
            : r.pet_name || r.res_name || "N/A"}
        </div>
      ),
    },
    {
      key: "type_name",
      header: "TYPE",
      width: 120,
      render: (r) => r.type_name || "N/A",
    },
    {
      key: "date_of_decision",
      header: "DECISION DATE",
      width: 140,
      render: (r) =>
        r.date_of_decision
          ? new Date(r.date_of_decision).toLocaleDateString("en-IN")
          : "N/A",
    },
    {
      key: "follow",
      header: "FOLLOW",
      width: 120,
      render: (r) => (
        <FollowButton
          isFollowing={isRowFollowed(r)}
          loading={followLoading}
          onClick={() => onClickFollow(r)}
          compact
        />
      ),
    },
    {
      key: "actions",
      header: "ACTIONS",
      width: 140,
      render: (r) => {
        const caseId = r.cino || r.case_no;
        return (
          <button
            className="border border-border rounded px-2 py-1 bg-background text-foreground"
            onClick={() => onClickDetails(r)}
            disabled={loadingDetailsId === caseId}
          >
            {loadingDetailsId === caseId ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span className="hidden sm:inline">Details</span>
              </div>
            )}
          </button>
        );
      },
    },
  ];

  return (
    <div className="w-full overflow-x-auto border border-border rounded-md bg-card text-card-foreground">
      <ResultsTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.cino || row.case_no}
        tableClassName="min-w-full"
        headerRowClassName="bg-muted"
      />
    </div>
  );
}
