"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCookie as getCookieUtil } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Loader2,
  Trash2,
  RotateCcw,
  Plus,
  Search,
} from "lucide-react";
import Pagination from "../research/components/common/Pagination";
import {
  useExtractions,
  useRemoveExtractionAgent,
} from "@/hooks/use-extraction";
import { useToast } from "@/components/ui/toast";
import HierarchicalResultsView from "./components/HierarchicalResultsView";

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
    const id =
      typeof window !== "undefined" ? getCookieUtil("workspaceId") : null;
    setWorkspaceId(id);
    // Best-effort name retrieval (optional future improvement: fetch workspace meta)
    // Keep empty string for stable markup; text can fill later without structural change
    setWorkspaceName("");
  }, []);
  const currentWorkspace = workspaceId
    ? ({ id: workspaceId, name: workspaceName } as any)
    : null;
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const { mutate: removeExtraction, isPending: isDeleting } =
    useRemoveExtractionAgent();

  // Use TanStack Query hooks
  const {
    data: extractionsData,
    isLoading: extractionsLoading,
    error: extractionsError,
  } = useExtractions(currentWorkspace?.id);

  // Filter extractions based on search
  const filteredExtractions =
    extractionsData?.filter((extraction) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        extraction.name.toLowerCase().includes(q) ||
        (extraction.tags &&
          extraction.tags.join(" ").toLowerCase().includes(q)) ||
        new Date(extraction.createdAt)
          .toLocaleString()
          .toLowerCase()
          .includes(q) ||
        extraction.status.toLowerCase().includes(q)
      );
    }) || [];

  // Pagination logic
  const totalPages = Math.ceil(filteredExtractions.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedExtractions = filteredExtractions.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleViewDetails = (extractionId: string) => {
    router.push(`/extract/${extractionId}`);
  };

  const handleCopy = (data: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(data ?? {}, null, 2));
    showToast("Data copied to clipboard", "success");
  };

  return (
    <main className="max-w-6xl mx-auto p-4 space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="text-primary-foreground" size={16} />
              </div>
              <div>
                <CardTitle className="text-lg">Recent Extractions</CardTitle>
                <CardDescription className="flex items-center gap-2 text-xs">
                  Browse your latest extraction jobs
                  {currentWorkspace?.name && (
                    <Badge
                      variant="secondary"
                      className="text-xs px-1.5 py-0.5"
                    >
                      {currentWorkspace.name}
                    </Badge>
                  )}
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={() => router.push("/extract/new")}
              size="sm"
              className="gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              New extraction
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Search and Filter Card */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
              <Input
                placeholder="Search extractions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Refresh the page to reload data
                window.location.reload();
              }}
              title="Refresh"
              aria-label="Refresh"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card>
        <CardContent className="pt-4 pb-4">
          {extractionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-muted-foreground text-sm">
                  Loading extractions...
                </span>
              </div>
            </div>
          ) : extractionsError ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-4 h-4 text-destructive" />
              </div>
              <h3 className="text-base font-semibold mb-1">
                Error loading extractions
              </h3>
              <p className="text-muted-foreground text-sm mb-3">
                Please try again later.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Retry
              </Button>
            </div>
          ) : (
            <HierarchicalResultsView
              extractions={paginatedExtractions}
              onViewDetails={handleViewDetails}
              onCopy={handleCopy}
            />
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {filteredExtractions.length > 0 && (
        <Pagination
          page={currentPage}
          pageSize={pageSize}
          total={filteredExtractions.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize);
            setCurrentPage(1); // Reset to first page when page size changes
          }}
          pageSizeOptions={[5, 10, 20, 50]}
        />
      )}
    </main>
  );
}
