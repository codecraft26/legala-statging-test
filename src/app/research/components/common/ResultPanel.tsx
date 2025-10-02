"use client";

import React from "react";

interface ResultPanelProps {
  loading?: boolean;
  error?: string | null;
  data?: unknown | null;
}

export default function ResultPanel({
  loading,
  error,
  data,
}: ResultPanelProps) {
  return (
    <div className="space-y-2">
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : null}
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {data ? (
        <pre className="rounded-md border p-3 text-xs overflow-auto bg-card">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
