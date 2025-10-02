"use client";

import React from "react";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (n: number) => void;
  pageSizeOptions?: number[];
}

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);

  return (
    <div className="px-4 py-3 flex items-center justify-between text-sm text-muted-foreground border-t border-border bg-background">
      <div className="flex items-center gap-2">
        <span>Rows per page</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
          className="border border-input bg-background text-foreground rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {pageSizeOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span>
          {total === 0 ? 0 : startIndex}-{endIndex} of {total}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-1 disabled:opacity-50 transition-colors"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          className="border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-1 disabled:opacity-50 transition-colors"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
