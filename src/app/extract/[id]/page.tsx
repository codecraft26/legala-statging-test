"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Download,
  FileText,
  Clock,
  Info,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  Tag,
  MessageSquare,
  User,
} from "lucide-react";
import {
  useExtractionDetail,
  useExtractionResultDetail,
  useRemoveExtractionAgent,
} from "@/hooks/use-extraction";

export default function ExtractionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "results" | "metadata"
  >("overview");

  const { data: extraction, isLoading, error } = useExtractionDetail(id);

  const { mutate: removeExtraction } = useRemoveExtractionAgent();

  const handleCopy = (content: any) => {
    navigator.clipboard.writeText(JSON.stringify(content, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAsCsv = () => {
    if (!extraction?.extraction_result) return;

    // Get all unique keys from all results
    const allKeys = [
      ...new Set(
        extraction.extraction_result.flatMap((result) =>
          result.data ? Object.keys(result.data) : []
        )
      ),
    ];

    const headers = ["Document Name", ...allKeys];
    const rows = [
      headers.join(","),
      ...extraction.extraction_result.map((result) => {
        const rowData = [
          `"${result.file.replace(/\.[^/.]+$/, "").replace(/"/g, '""')}"`,
          ...allKeys.map((key) => {
            const value = result.data?.[key];
            return `"${value ? String(value).replace(/"/g, '""') : ""}"`;
          }),
        ];
        return rowData.join(",");
      }),
    ];

    const csvContent = rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `extraction_${extraction.name.replace(/[^a-z0-9]/gi, "_")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsJson = () => {
    if (!extraction) return;

    const dataToExport = {
      extraction: {
        id: extraction.id,
        name: extraction.name,
        status: extraction.status,
        createdAt: extraction.createdAt,
        tags: extraction.tags,
        instruction: extraction.instruction,
      },
      results:
        extraction.extraction_result?.map((result) => ({
          file: result.file,
          data: result.data,
        })) || [],
    };

    const jsonContent =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", jsonContent);
    link.setAttribute(
      "download",
      `extraction_${extraction.name.replace(/[^a-z0-9]/gi, "_")}.json`
    );
    link.click();
  };

  const handleDelete = () => {
    if (
      confirm(
        "Are you sure you want to delete this extraction? This action cannot be undone."
      )
    ) {
      removeExtraction(id, {
        onSuccess: () => {
          router.push("/extract/list");
        },
      });
    }
  };

  const formatValue = (value: any, key: string) => {
    if (!value) return "-";

    if (Array.isArray(value)) {
      return value.join(", ");
    }

    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
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
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.className}`}
      >
        {status === "PROCESSING" && (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        )}
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <h3 className="font-medium">Error Loading Extraction</h3>
          </div>
          <p className="mt-2 text-sm text-red-700">
            Failed to load extraction details. Please try again.
          </p>
        </div>
      </div>
    );
  }

  if (!extraction) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <Info className="w-5 h-5" />
            <h3 className="font-medium">Extraction Not Found</h3>
          </div>
          <p className="mt-2 text-sm text-blue-700">
            The requested extraction could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">
              {extraction.name}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Created {new Date(extraction.createdAt).toLocaleString()}
              </div>
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {extraction.extraction_result?.length || 0} document(s)
              </div>
              {extraction.user && (
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {extraction.user.name}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {getStatusBadge(extraction.status)}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={downloadAsJson}>
              <Download className="w-4 h-4 mr-2" />
              JSON
            </Button>
            <Button variant="outline" onClick={downloadAsCsv}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => handleCopy(extraction)}
              className="text-gray-600"
            >
              {copied ? (
                <Check className="w-4 h-4 mr-2 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === "overview"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("results")}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === "results"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Results ({extraction.extraction_result?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("metadata")}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === "metadata"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Metadata
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Status and Progress */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Status
                  </div>
                  <div>{getStatusBadge(extraction.status)}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Documents
                  </div>
                  <div className="text-lg font-semibold">
                    {extraction.extraction_result?.length || 0}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Usage
                  </div>
                  <div className="text-lg font-semibold">
                    {extraction.usage || 0} tokens
                  </div>
                </div>
              </div>

              {/* Tags */}
              {extraction.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {extraction.tags?.length > 0 ? (
                      extraction.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No tags
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Instructions */}
              {extraction.instruction && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Instructions
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="whitespace-pre-wrap text-gray-700">
                      {extraction.instruction}
                    </p>
                  </div>
                </div>
              )}

              {/* Processing Status */}
              {extraction.status === "PROCESSING" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <h3 className="font-medium">Processing in Progress</h3>
                  </div>
                  <p className="mt-2 text-sm text-blue-700">
                    Your documents are currently being processed. This page will
                    automatically update when complete.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Results Tab */}
          {activeTab === "results" && (
            <div className="space-y-6">
              {extraction.extraction_result &&
              extraction.extraction_result.length > 0 ? (
                <div className="space-y-4">
                  {extraction.extraction_result.map((result, index) => (
                    <div
                      key={result.id}
                      className="border border-gray-200 rounded-lg"
                    >
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <h4 className="font-medium text-gray-900">
                              {result.file}
                            </h4>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(result.data)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-4">
                        {result.data && Object.keys(result.data).length > 0 ? (
                          <div className="space-y-3">
                            {Object.entries(result.data).map(([key, value]) => (
                              <div
                                key={key}
                                className="border-b border-gray-100 pb-3 last:border-b-0"
                              >
                                <div className="text-sm font-medium text-gray-700 mb-1">
                                  {key
                                    .replace(/_/g, " ")
                                    .replace(/([A-Z])/g, " $1")
                                    .toLowerCase()}
                                </div>
                                <div className="text-sm text-gray-900">
                                  <pre className="whitespace-pre-wrap font-sans">
                                    {formatValue(value, key)}
                                  </pre>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">
                            No data extracted from this document.
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No results available yet.</p>
                  {extraction.status === "PROCESSING" && (
                    <p className="text-sm mt-2">
                      Results will appear here once processing is complete.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Metadata Tab */}
          {activeTab === "metadata" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Extraction Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">ID:</span> {extraction.id}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>{" "}
                      {new Date(extraction.createdAt).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Updated:</span>{" "}
                      {new Date(extraction.updatedAt).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>{" "}
                      {extraction.status}
                    </div>
                    <div>
                      <span className="font-medium">Workspace:</span>{" "}
                      {extraction.workspaceId}
                    </div>
                  </div>
                </div>

                {extraction.user && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">
                      User Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Name:</span>{" "}
                        {extraction.user.name}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span>{" "}
                        {extraction.user.email}
                      </div>
                      <div>
                        <span className="font-medium">Role:</span>{" "}
                        {extraction.user.role}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {extraction.usage && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Usage Statistics
                  </h4>
                  <pre className="text-sm text-gray-700 overflow-x-auto">
                    {JSON.stringify(extraction.usage, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
