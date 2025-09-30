"use client";

import React, { useMemo, useState } from "react";
import { getCookie as getCookieUtil } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Tag,
  Clock,
  Loader2,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Eye,
  Download,
  Trash2,
  Filter,
} from "lucide-react";
import {
  useExtractions,
  useRemoveExtractionAgent,
} from "@/hooks/use-extraction";
import { useRouter } from "next/navigation";

export default function ExtractionsListPage() {
  const currentWorkspace = useMemo(() => {
    const id = typeof window !== "undefined" ? getCookieUtil("workspaceId") : null;
    if (!id) return undefined as any;
    return { id, name: "Workspace" } as any;
  }, []);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "createdAt" | "status">(
    "createdAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedAgents, setExpandedAgents] = useState<Record<string, boolean>>(
    {}
  );

  // Fetch extractions using TanStack Query
  const {
    data: extractions,
    isLoading,
    error,
  } = useExtractions(currentWorkspace?.id);

  const { mutate: removeExtraction } = useRemoveExtractionAgent();

  // Filter and sort extractions
  const filteredExtractions =
    extractions?.filter((extraction) => {
      const matchesSearch =
        extraction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        extraction.tags?.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        false;

      const matchesStatus =
        statusFilter === "all" ||
        extraction.status === statusFilter.toUpperCase();

      return matchesSearch && matchesStatus;
    }) || [];

  const sortedExtractions = [...filteredExtractions].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "createdAt":
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Group extractions by status for better organization
  const groupedExtractions = sortedExtractions.reduce(
    (acc, extraction) => {
      const status = extraction.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(extraction);
      return acc;
    },
    {} as Record<string, typeof sortedExtractions>
  );

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handleViewExtraction = (extractionId: string) => {
    router.push(`/extract/${extractionId}`);
  };

  const handleDeleteExtraction = (extractionId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this extraction? This action cannot be undone."
      )
    ) {
      removeExtraction(extractionId);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: {
        label: "Pending",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      PROCESSING: {
        label: "Processing",
        className: "bg-blue-100 text-blue-800 border-blue-200",
      },
      COMPLETED: {
        label: "Completed",
        className: "bg-green-100 text-green-800 border-green-200",
      },
      FAILED: {
        label: "Failed",
        className: "bg-red-100 text-red-800 border-red-200",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-red-900 mb-2">
            Error Loading Extractions
          </h3>
          <p className="text-red-700">
            Failed to load extractions. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Extractions</h1>
          <p className="text-gray-500 mt-1">
            Manage and review your document extraction jobs
          </p>
        </div>
        <Button onClick={() => router.push("/extract")}>New Extraction</Button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search extractions by name or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">Sort by:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSort("name")}
            className="flex items-center gap-1"
          >
            Name
            <ArrowUpDown className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSort("createdAt")}
            className="flex items-center gap-1"
          >
            Date
            <ArrowUpDown className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSort("status")}
            className="flex items-center gap-1"
          >
            Status
            <ArrowUpDown className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Extractions List */}
      {!isLoading && sortedExtractions.length > 0 ? (
        <div className="space-y-4">
          {sortedExtractions.map((extraction) => (
            <div
              key={extraction.id}
              className="bg-white rounded-lg border hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {extraction.name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(extraction.createdAt).toLocaleString()}
                        </div>
                        <div>
                          {extraction.extraction_result?.length || 0}{" "}
                          document(s)
                        </div>
                        {extraction.usage && (
                          <div>{extraction.usage} tokens used</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(extraction.status)}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewExtraction(extraction.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteExtraction(extraction.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {extraction.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {extraction.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Instructions */}
                {extraction.instruction && (
                  <div className="text-sm text-gray-600 bg-gray-50 rounded-md p-3">
                    <strong>Instructions:</strong> {extraction.instruction}
                  </div>
                )}

                {/* Processing indicator */}
                {extraction.status === "PROCESSING" && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing documents...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : !isLoading ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No extractions found
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || statusFilter !== "all"
              ? "No extractions match your current filters."
              : "Get started by creating your first extraction."}
          </p>
          {!searchQuery && statusFilter === "all" && (
            <Button onClick={() => router.push("/extract")}>
              Create New Extraction
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
