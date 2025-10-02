"use client";

import React from "react";
import ResultsTable, { ColumnDef } from "./common/ResultsTable";
import Pagination from "./common/Pagination";
import { Button } from "@/components/ui/button";
import { Eye, Loader2, BookmarkX } from "lucide-react";

type CourtType = "Supreme_Court" | "High_Court" | "District_Court";

export interface FollowedCase {
  id: string;
  court: CourtType;
  followed: any;
  createdAt: string;
  updatedAt: string;
  userId: string;
  workspaceId: string;
}

export function FollowedHighCourtTable({
  rows,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onView,
  onUnfollow,
  detailsLoadingId,
  unfollowPending,
}: {
  rows: FollowedCase[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (n: number) => void;
  onView: (row: FollowedCase) => void;
  onUnfollow: (id: string) => void;
  detailsLoadingId: string | null;
  unfollowPending: boolean;
}) {
  const columns: ColumnDef<FollowedCase>[] = [
    { key: "cnr", header: "CNR", width: 160, render: (row) => (
      <div className="truncate max-w-[150px]">{row.followed?.["cino"] || row.followed?.["CNR"] || ""}</div>
    ) },
    { key: "case", header: "Case", width: 240, render: (row) => {
      const type = row.followed?.["type_name"] || "";
      const no = row.followed?.["case_no2"] ?? row.followed?.["fil_no"] ?? "";
      const year = row.followed?.["case_year"] ?? row.followed?.["fil_year"] ?? "";
      const combo = [type, no, year].filter(Boolean).join("/");
      return <div className="truncate max-w-[220px]">{combo}</div>;
    } },
    { key: "parties", header: "Parties", width: 300, render: (row) => (
      <div className="truncate max-w-[300px]">{row.followed?.["pet_name"] || ""} {row.followed?.["pet_name"] && row.followed?.["res_name"] ? "vs" : ""} {row.followed?.["res_name"] || ""}</div>
    ) },
    { key: "actions", header: "Actions", width: 160, render: (row) => (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(row)}
          disabled={detailsLoadingId === row.id}
          className="flex items-center gap-2"
        >
          {detailsLoadingId === row.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          View
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onUnfollow(row.id)}
          disabled={unfollowPending}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <BookmarkX className="h-4 w-4" />
        </Button>
      </div>
    ) },
  ];

  return (
    <div className="w-full overflow-x-auto bg-white dark:bg-zinc-950 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-800">
      <ResultsTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        tableClassName="table-fixed w-full"
        headerRowClassName="bg-gray-100 dark:bg-zinc-800"
      />
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={(n) => {
          onPageSizeChange(n);
          onPageChange(1);
        }}
      />
    </div>
  );
}


