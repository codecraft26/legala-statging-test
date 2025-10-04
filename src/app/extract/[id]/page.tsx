"use client";

import React, { useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Info, AlertCircle, Loader2 } from "lucide-react";
import {
  useExtractionDetail,
  useRemoveExtractionAgent,
} from "@/hooks/use-extraction";
import { useToast } from "@/components/ui/toast";
import StatusBadge from "../components/StatusBadge";
import ExtractionResultsTable from "../components/ExtractionResultsTable";
import type { Extraction } from "../components/types";

// local tab components moved to extract/components

export default function ExtractionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const id = params.id as string;

  const { data: extraction, isLoading, error } = useExtractionDetail(id);

  const { mutate: removeExtraction } = useRemoveExtractionAgent();

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
              <h1 className="text-2xl font-semibold leading-tight">
                {extraction.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={extraction.status} />
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-xl border bg-card text-card-foreground">
        <div className="p-5 md:p-6">
          <ExtractionResultsTable
            extraction={extraction as unknown as Extraction}
          />
        </div>
      </div>
    </div>
  );
}
