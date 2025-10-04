"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useExtractionDetail } from "@/hooks/use-extraction";
import { useToast } from "@/components/ui/toast";
import PDFDetailView from "../../../components/PDFDetailView";

export default function PDFDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const extractionId = params.id as string;
  const pdfId = params.pdfId as string;

  const {
    data: extraction,
    isLoading,
    error,
  } = useExtractionDetail(extractionId);

  const handleBack = () => {
    router.push("/extract");
  };

  const handleCopy = (data: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(data ?? {}, null, 2));
    showToast("Data copied to clipboard", "success");
  };

  // Find the specific PDF result
  const pdfResult = extraction?.extraction_result?.find(
    (result) => result.id === pdfId
  );

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading PDF details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <p className="text-red-600 font-medium mb-2">
              Error loading PDF details
            </p>
            <p className="text-gray-600 text-sm mb-4">
              {error instanceof Error
                ? error.message
                : "An unexpected error occurred"}
            </p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              Back to Extractions
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!extraction) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Extraction not found</p>
            <button
              onClick={() => router.push("/extract")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Back to Extractions
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!pdfResult) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              PDF not found in this extraction
            </p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              Back to Extractions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PDFDetailView
      extraction={extraction}
      pdfResult={pdfResult}
      onBack={handleBack}
      onCopy={handleCopy}
    />
  );
}
