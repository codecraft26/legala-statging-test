"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  FileText,
  Copy,
  Download,
  Calendar,
  User,
  ChevronRight,
  Home,
} from "lucide-react";
import type { Extraction, ExtractionResult } from "./types";
import PDFResultsTab from "./PDFResultsTab";
import MetadataTab from "./MetadataTab";
import { TruncatedFilename } from "@/components/ui/truncated-filename";

interface PDFDetailViewProps {
  extraction: Extraction;
  pdfResult: ExtractionResult;
  onBack: () => void;
  onCopy: (data: unknown) => void;
}

export default function PDFDetailView({
  extraction,
  pdfResult,
  onBack,
  onCopy,
}: PDFDetailViewProps) {
  const [activeTab, setActiveTab] = useState<"results" | "metadata">("results");

  const dataEntries = pdfResult.data ? Object.entries(pdfResult.data) : [];

  const getAgentStatus = (extraction: Extraction) => {
    if (extraction.status === "COMPLETED") return "completed";
    if (extraction.status === "PROCESSING") return "processing";
    if (extraction.status === "FAILED") return "failed";
    return "pending";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDownload = () => {
    // Create a downloadable JSON file with the extracted data
    const dataStr = JSON.stringify(pdfResult.data || {}, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${pdfResult.file.replace(/\.[^/.]+$/, "")}_extracted_data.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600">
        <button
          onClick={onBack}
          className="flex items-center gap-1 hover:text-gray-900 transition-colors"
        >
          <Home className="w-4 h-4" />
          Extractions
        </button>
        <ChevronRight className="w-4 h-4" />
        <button
          onClick={onBack}
          className="hover:text-gray-900 transition-colors"
        >
          {extraction.name}
        </button>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">
          <TruncatedFilename
            filename={pdfResult.file}
            maxLength={15}
            showExtension={true}
          />
        </span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Agent: {extraction.name}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">
                {new Date(extraction.createdAt).toLocaleString()}
              </span>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(getAgentStatus(extraction))}`}
            >
              {getAgentStatus(extraction)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {dataEntries.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopy(pdfResult.data)}
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Data
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download JSON
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("results")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "results"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Results
          </button>
          <button
            onClick={() => setActiveTab("metadata")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "metadata"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Metadata
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "results" ? (
          <PDFResultsTab
            extraction={extraction}
            pdfResult={pdfResult}
            onCopy={onCopy}
          />
        ) : (
          <MetadataTab extraction={extraction} />
        )}
      </div>
    </div>
  );
}
