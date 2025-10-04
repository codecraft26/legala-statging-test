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
  followLoading: string | null;
}) {
  const columns: ColumnDef<HighCourtResult>[] = [
    { key: "cino", header: "CNR", width: 140, render: (r) => r.cino || "N/A" },
    {
      key: "case_no",
      header: "CASE NO.",
      width: 120,
      render: (r) => r.case_no || "N/A",
    },
    {
      key: "title",
      header: "TITLE",
      width: 260,
      render: (r) =>
        (() => {
          const fullTitle =
            r.pet_name && r.res_name
              ? `${r.pet_name} vs ${r.res_name}`
              : r.pet_name || r.res_name || "N/A";
          return (
            <div
              className="max-w-[260px] whitespace-normal break-words leading-snug"
              title={fullTitle}
            >
              {fullTitle}
            </div>
          );
        })(),
    },
    {
      key: "date_of_decision",
      header: "DECISION DATE",
      width: 120,
      render: (r) =>
        r.date_of_decision
          ? new Date(r.date_of_decision).toLocaleDateString("en-IN")
          : "N/A",
    },
    {
      key: "follow",
      header: "FOLLOW",
      width: 70,
      render: (r) => {
        const caseId = r.cino || r.case_no;
        const isLoading = followLoading === caseId;
        return (
          <FollowButton
            isFollowing={isRowFollowed(r)}
            loading={isLoading}
            onClick={() => onClickFollow(r)}
            compact
          />
        );
      },
    },
    {
      key: "actions",
      header: "ACTIONS",
      width: 70,
      render: (r) => {
        const caseId = r.cino || r.case_no;
        return (
          <button
            className="border border-border rounded px-1 py-1 bg-background text-foreground"
            onClick={() => onClickDetails(r)}
            disabled={loadingDetailsId === caseId}
          >
            {loadingDetailsId === caseId ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Eye className="w-4 h-4" />
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
        tableClassName="table-fixed w-full"
        headerRowClassName="bg-muted"
        compact
      />
    </div>
  );
}
