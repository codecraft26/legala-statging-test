"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { ChevronLeft, Download, FileText, Clock, Info, AlertCircle, Loader2, Copy, Check, User } from "lucide-react";
import {
  useExtractionDetail,
  useRemoveExtractionAgent,
} from "@/hooks/use-extraction";
import { useToast } from "@/components/ui/toast";
import StatusBadge from "../components/StatusBadge";
import OverviewTab from "../components/OverviewTab";
import ResultsTab from "../components/ResultsTab";
import MetadataTab from "../components/MetadataTab";
import type { Extraction } from "../components/types";

// local tab components moved to extract/components

export default function ExtractionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const id = params.id as string;

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "results" | "metadata"
  >("overview");

  const { data: extraction, isLoading, error } = useExtractionDetail(id);

  const { mutate: removeExtraction } = useRemoveExtractionAgent();

  const handleCopy = useCallback((content: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(content ?? {}, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const allKeys = useMemo(() => {
    if (!extraction?.extraction_result) return [] as string[];
    return [
      ...new Set(
        extraction.extraction_result.flatMap((result) =>
          result.data ? Object.keys(result.data) : []
        )
      ),
    ] as string[];
  }, [extraction?.extraction_result]);

  const downloadAsCsv = useCallback(() => {
    if (!extraction?.extraction_result) return;

    const headers = ["Document Name", ...allKeys];
    const rows = [
      headers.join(","),
      ...extraction.extraction_result.map((result) => {
        const rowData = [
          `"${result.file.replace(/\.[^/.]+$/, "").replace(/"/g, '""')}"`,
          ...allKeys.map((key) => {
            const value = (result.data as Record<string, unknown> | undefined)?.[key];
            return `"${value !== undefined && value !== null ? String(value).replace(/"/g, '""') : ""}"`;
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
  }, [extraction?.extraction_result, extraction?.name, allKeys]);

  const downloadAsJson = useCallback(() => {
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
      results: extraction.extraction_result?.map((result) => ({
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
  }, [extraction]);

  const handleDelete = useCallback(() => {
    removeExtraction(id, {
      onSuccess: () => {
        showToast("Extraction deleted successfully", "success");
        router.push("/extract");
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
    });
  }, [id, removeExtraction, router, showToast]);

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
            <StatusBadge status={extraction.status} />
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
          {activeTab === "overview" && <OverviewTab extraction={extraction as unknown as Extraction} />}
          {activeTab === "results" && (
            <ResultsTab
              extraction={extraction as unknown as Extraction}
              onCopy={handleCopy}
            />
          )}
          {activeTab === "metadata" && <MetadataTab extraction={extraction as unknown as Extraction} />}
        </div>
      </div>
    </div>
  );
}
