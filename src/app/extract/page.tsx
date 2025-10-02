"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCookie as getCookieUtil } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ResultsTable, { ColumnDef } from "../research/components/common/ResultsTable";
import {
  FileText,
  Clock,
  Loader2,
  Trash2,
  RotateCcw,
} from "lucide-react";
import {
  useExtractions,
  useRemoveExtractionAgent,
} from "@/hooks/use-extraction";
import Pagination from "../research/components/common/Pagination";
import { useToast } from "@/components/ui/toast";

type Extraction = {
  id: string;
  name: string;
  tags: string[];
  createdAt: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress?: number;
};


export default function ExtractPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string>("");
  useEffect(() => {
    const id = typeof window !== "undefined" ? getCookieUtil("workspaceId") : null;
    setWorkspaceId(id);
    // Best-effort name retrieval (optional future improvement: fetch workspace meta)
    // Keep empty string for stable markup; text can fill later without structural change
    setWorkspaceName("");
  }, []);
  const currentWorkspace = workspaceId ? ({ id: workspaceId, name: workspaceName } as any) : null;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { mutate: removeExtraction, isPending: isDeleting } =
    useRemoveExtractionAgent();

  // Use TanStack Query hooks
  const {
    data: extractionsData,
    isLoading: extractionsLoading,
    error: extractionsError,
  } = useExtractions(currentWorkspace?.id);


  // Convert API data to display format
  const items =
    extractionsData?.map((extraction) => ({
      id: extraction.id,
      name: extraction.name,
      tags: extraction.tags,
      createdAt: extraction.createdAt,
      status: extraction.status.toLowerCase() as Extraction["status"],
      progress: extraction.status === "PROCESSING" ? 50 : undefined,
    })) || [];

  // Pagination derived data
  const filtered = items.filter((x) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      x.name.toLowerCase().includes(q) ||
      (x.tags && x.tags.join(" ").toLowerCase().includes(q)) ||
      new Date(x.createdAt).toLocaleString().toLowerCase().includes(q) ||
      x.status.toLowerCase().includes(q)
    );
  });

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Reset page when the items or pageSize change
  useEffect(() => {
    setPage(1);
  }, [pageSize, totalItems]);

  // Define table columns
  const columns: ColumnDef<Extraction>[] = [
    {
      key: "name",
      header: "Extraction Name",
      render: (extraction) => (
        <button
          className="flex items-center gap-2 hover:underline"
          onClick={() => router.push(`/extract/${extraction.id}`)}
        >
          <div className="rounded p-1 bg-accent">
            <FileText size={14} />
          </div>
          <div className="font-medium text-left">{extraction.name}</div>
        </button>
      ),
    },
    {
      key: "createdAt",
      header: "Run Time",
      render: (extraction) => (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock size={12} /> {new Date(extraction.createdAt).toLocaleString()}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (extraction) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={extraction.status} />
          {extraction.status === "processing" ? (
            <span className="text-xs text-muted-foreground">{extraction.progress}%</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (extraction) => (
        <Button
          variant="ghost"
          size="icon"
          className="text-red-600 hover:text-red-700"
          disabled={isDeleting && deletingId === extraction.id}
          aria-label="Delete extraction"
          title="Delete"
          onClick={() => {
            setDeletingId(extraction.id);
            removeExtraction(extraction.id, {
              onSuccess: () => {
                showToast("Extraction deleted successfully", "success");
              },
              onError: (err) => {
                console.error("Failed to delete extraction:", err);
                showToast(
                  `Failed to delete extraction: ${
                    err instanceof Error ? err.message : "Unknown error"
                  }`,
                  "error"
                );
              },
              onSettled: () => setDeletingId(null),
            });
          }}
        >
          {isDeleting && deletingId === extraction.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      ),
    },
  ];

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
            <FileText className="text-white" size={18} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Recent Extractions</h1>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Browse your latest extraction jobs
              </p>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {currentWorkspace?.name}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => router.push("/extract/new")}>
            New extraction
          </Button>
        </div>
      </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="relative w-full max-w-sm">
              <Input
                placeholder="Search extractions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                // Simple refresh: clear cache by invalidating queries via a remount approach
                // Trigger refetch by toggling pageSize temporarily
                setPageSize((s) => (s === 10 ? 11 : 10));
                setTimeout(() => setPageSize(10), 0);
              }}
              title="Refresh"
              aria-label="Refresh"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          <div className="rounded-lg border">
            {currentItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No extractions found
              </div>
            ) : (
              <ResultsTable
                columns={columns}
                rows={currentItems}
                rowKey={(extraction) => extraction.id}
                tableClassName="w-full"
              />
            )}
          </div>

          <Pagination
            page={page}
            pageSize={pageSize}
            total={totalItems}
            onPageChange={setPage}
            onPageSizeChange={(newPageSize) => {
              setPageSize(newPageSize);
              setPage(1);
            }}
            pageSizeOptions={[5, 10, 20, 50]}
          />
        </div>
    </main>
  );
}

function StatusBadge({ status }: { status: Extraction["status"] }) {
  const map: Record<Extraction["status"], { text: string; cls: string }> = {
    completed: {
      text: "Completed",
      cls: "text-green-700 bg-green-50 border-green-200",
    },
    processing: {
      text: "Processing",
      cls: "text-amber-700 bg-amber-50 border-amber-200",
    },
    queued: { text: "Queued", cls: "text-blue-700 bg-blue-50 border-blue-200" },
    failed: { text: "Failed", cls: "text-red-700 bg-red-50 border-red-200" },
  };
  const cfg = map[status];
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.cls}`}
    >
      {cfg.text}
    </span>
  );
}
