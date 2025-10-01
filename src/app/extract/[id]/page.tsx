"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
        })),
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
          router.push("/extract");
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
      <div className="rounded-xl border bg-card text-card-foreground p-4 md:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2 p-2 h-8"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-semibold leading-tight">{extraction.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(extraction.createdAt).toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
                  <FileText className="w-3.5 h-3.5" />
                  {extraction.extraction_result?.length} docs
                </span>
                {extraction.user ? (
                  <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
                    <User className="w-3.5 h-3.5" />
                    {extraction.user.name}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(extraction.status)}
            <Button variant="outline" size="sm" onClick={downloadAsJson}>
              <Download className="w-4 h-4 mr-1.5" /> JSON
            </Button>
            <Button variant="outline" size="sm" onClick={downloadAsCsv}>
              <Download className="w-4 h-4 mr-1.5" /> CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(extraction)}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1.5 text-green-500" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1.5" /> Copy
                </>
              )}
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-xl border bg-card text-card-foreground">
        <div className="border-b">
          <nav className="flex -mb-px px-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-5 py-3 text-sm font-medium border-b-2 ${
                activeTab === "overview"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("results")}
              className={`px-5 py-3 text-sm font-medium border-b-2 ${
                activeTab === "results"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              Results ({extraction.extraction_result?.length})
            </button>
            <button
              onClick={() => setActiveTab("metadata")}
              className={`px-5 py-3 text-sm font-medium border-b-2 ${
                activeTab === "metadata"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              Metadata
            </button>
          </nav>
        </div>

        <div className="p-5 md:p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Status and Progress */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Status
                  </div>
                  <div>{getStatusBadge(extraction.status)}</div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Documents
                  </div>
                  <div className="text-lg font-semibold">
                    {extraction.extraction_result?.length}
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Usage
                  </div>
                  <div className="text-lg font-semibold">
                    {extraction.usage} tokens
                  </div>
                </div>
              </div>

              {/* Tags */}
              {extraction.tags && extraction.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {extraction.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full border border-blue-200"
                      >
                        {tag}
                      </span>
                    ))}
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
                  <div className="bg-muted rounded-lg p-4">
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
                  {extraction.extraction_result.map((result, index) => {
                    const dataEntries = result.data ? Object.entries(result.data) : [];
                    
                    return (
                      <div key={result.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <h4 className="font-medium">{result.file}</h4>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(result.data)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {dataEntries.length > 0 ? (
                          <div className="rounded-lg border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Field</TableHead>
                                  <TableHead>Value</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {dataEntries.map(([key, value]) => (
                                  <TableRow key={key}>
                                    <TableCell className="font-medium">
                                      {key
                                        .replace(/_/g, " ")
                                        .replace(/([A-Z])/g, " $1")
                                        .toLowerCase()
                                        .replace(/^\w/, c => c.toUpperCase())}
                                    </TableCell>
                                    <TableCell>
                                      <pre className="whitespace-pre-wrap font-sans leading-relaxed text-sm">
                                        {formatValue(value, key)}
                                      </pre>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <p className="text-sm">No data extracted from this document.</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
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
              <div className="space-y-6">
                {/* Extraction Details Table */}
                <div>
                  <h4 className="font-medium mb-3">Extraction Details</h4>
                  <div className="rounded-lg border">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium w-1/3">ID</TableCell>
                          <TableCell className="font-mono text-sm">{extraction.id}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Created</TableCell>
                          <TableCell>{new Date(extraction.createdAt).toLocaleString()}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Updated</TableCell>
                          <TableCell>{new Date(extraction.updatedAt).toLocaleString()}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Status</TableCell>
                          <TableCell>{getStatusBadge(extraction.status)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Workspace</TableCell>
                          <TableCell className="font-mono text-sm">{extraction.workspaceId}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* User Information Table */}
                {extraction.user && (
                  <div>
                    <h4 className="font-medium mb-3">User Information</h4>
                    <div className="rounded-lg border">
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium w-1/3">Name</TableCell>
                            <TableCell>{extraction.user.name}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Email</TableCell>
                            <TableCell>{extraction.user.email}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Role</TableCell>
                            <TableCell>{extraction.user.role}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Usage Statistics */}
                {extraction.usage && (
                  <div>
                    <h4 className="font-medium mb-3">Usage Statistics</h4>
                    <div className="rounded-lg border p-4">
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(extraction.usage, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
