"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  ChevronLeft,
  FileText,
  Download,
  Database,
  Eye,
  Copy,
  Check,
} from "lucide-react";

interface ExtractedDataItem {
  fileName: string;
  extractedData: Record<string, any>;
  usage?: any;
  rawResponse?: any;
  agent?: string;
}

interface DataViewProps {
  extractedData: ExtractedDataItem[];
  uploadedFiles: { file: File }[];
  onBack: () => void;
}

export default function DataView({
  extractedData = [],
  uploadedFiles = [],
  onBack,
}: DataViewProps) {
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Format the data to match expected structure
  const formattedData = extractedData.map((item) => ({
    fileName: item.fileName,
    extractedData: item.extractedData || {},
    usage: item.usage,
  }));

  // Get all unique keys from extracted data
  const allKeys = [
    ...new Set(
      formattedData.flatMap((data) =>
        data.extractedData ? Object.keys(data.extractedData) : []
      )
    ),
  ];

  const formatValue = (value: any, key: string) => {
    if (!value) return "-";

    // Handle address fields differently
    const addressFields = [
      "address",
      "location",
      "premises",
      "property",
      "site",
    ];
    const isAddressField = addressFields.some((field) =>
      key.toLowerCase().includes(field)
    );

    if (Array.isArray(value)) {
      return value.join(", ");
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return isAddressField ? (
      <div
        className="max-h-[4.5em] overflow-hidden text-ellipsis"
        style={{
          WebkitLineClamp: 3,
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
        }}
      >
        {String(value)}
      </div>
    ) : (
      String(value)
    );
  };

  const cleanFileName = (fileName: string) => {
    return fileName ? fileName.replace(/\.[^/.]+$/, "") : "";
  };

  const handleCopy = (content: any) => {
    navigator.clipboard.writeText(JSON.stringify(content, null, 2));
    setCopySuccess("copied");
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const exportData = () => {
    try {
      if (!formattedData || formattedData.length === 0) {
        console.warn("No data to export");
        return;
      }

      const headers = ["Document Name", ...allKeys];
      const rows = [
        headers.join(","),
        ...formattedData.map(({ fileName, extractedData }) => {
          const rowData = [
            `"${cleanFileName(fileName)}"`,
            ...allKeys.map((key) => {
              const value = extractedData?.[key];
              return `"${value ? String(value).replace(/"/g, '""') : ""}"`;
            }),
          ];
          return rowData.join(",");
        }),
      ];

      const csvContent = "data:text/csv;charset=utf-8," + rows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "extracted_data.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };

  const exportJSON = () => {
    try {
      const dataToExport = formattedData.map(({ fileName, extractedData }) => ({
        document: cleanFileName(fileName),
        data: extractedData,
      }));

      const jsonContent =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(dataToExport, null, 2));
      const link = document.createElement("a");
      link.setAttribute("href", jsonContent);
      link.setAttribute("download", "extracted_data.json");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting JSON:", error);
    }
  };

  if (!Array.isArray(formattedData) || formattedData.length === 0) {
    return (
      <div className="space-y-8">
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                No Data Available
              </h3>
              <p className="text-gray-700 text-sm">
                Upload documents to start extracting data.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-start">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Configuration
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Extracted Data
            </h2>
            <p className="text-gray-500">
              Review and interact with your processed documents
            </p>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Document Name</span>
                  </div>
                </th>
                {allKeys.map((key) => (
                  <th
                    key={key}
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  >
                    {key
                      .replace(/_/g, " ")
                      .replace(/([A-Z])/g, " $1")
                      .toLowerCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {formattedData.map(({ fileName, extractedData }, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-normal break-words text-sm font-medium text-gray-900">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="max-w-[200px] break-words">
                        {cleanFileName(fileName)}
                      </div>
                    </div>
                  </td>

                  {allKeys.map((key) => (
                    <td
                      key={`${index}-${key}`}
                      className="px-6 py-4 text-sm text-gray-700"
                    >
                      <div className="max-w-xs">
                        {formatValue(extractedData?.[key], key)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-4">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex items-center"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Configuration
        </Button>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            {formattedData.length} document
            {formattedData.length !== 1 ? "s" : ""} processed
          </div>

          <Button
            onClick={() => handleCopy(formattedData)}
            variant="outline"
            className="flex items-center"
          >
            {copySuccess ? (
              <Check className="w-4 h-4 mr-2 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            {copySuccess ? "Copied!" : "Copy All"}
          </Button>

          <Button
            onClick={exportJSON}
            variant="outline"
            className="flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>

          <Button onClick={exportData} className="flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>
    </div>
  );
}
