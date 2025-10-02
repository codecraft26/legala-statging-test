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

export function FollowedSupremeTable({
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
    {
      key: "serial_number",
      header: "Index No.",
      width: 100,
      render: (row) => (
        <span className="text-gray-800 dark:text-zinc-200 font-medium">
          {row.followed?.["serial_number"] ?? ""}
        </span>
      ),
    },
    {
      key: "diary_number",
      header: "Diary Number",
      width: 140,
      render: (row) => (
        <div className="truncate max-w-[130px]">
          {row.followed?.["diary_number"] ?? ""}
        </div>
      ),
    },
    {
      key: "case_number",
      header: "Case Number",
      width: 220,
      render: (row) => (
        <div className="truncate max-w-[210px]">
          {row.followed?.["case_number"] ?? ""}
        </div>
      ),
    },
    {
      key: "petitioner_name",
      header: "Petitioner",
      width: 200,
      render: (row) => (
        <div className="truncate max-w-[190px]">
          {row.followed?.["petitioner_name"] ?? ""}
        </div>
      ),
    },
    {
      key: "respondent_name",
      header: "Respondent",
      width: 200,
      render: (row) => (
        <div className="truncate max-w-[190px]">
          {row.followed?.["respondent_name"] ?? ""}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: 160,
      render: (row) => (
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
      ),
    },
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
