"use client";

import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Download } from "lucide-react";
import { formatValue } from "./helpers";
import type { Extraction } from "./types";

interface ExtractionResultsTableProps {
  extraction: Extraction;
}

export default function ExtractionResultsTable({
  extraction,
}: ExtractionResultsTableProps) {
  // Get all unique keys from all extraction results
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

  const downloadAsCsv = () => {
    if (!extraction?.extraction_result) return;

    const headers = ["Document Name", ...allKeys];
    const rows = [
      headers.join(","),
      ...extraction.extraction_result.map((result) => {
        const rowData = [
          `"${result.file.replace(/\.[^/.]+$/, "").replace(/"/g, '""')}"`,
          ...allKeys.map((key) => {
            const value = (
              result.data as Record<string, unknown> | undefined
            )?.[key];
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
  };

  if (
    !extraction.extraction_result ||
    extraction.extraction_result.length === 0
  ) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No extraction results available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Download Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Extraction Results</h3>
          <p className="text-sm text-muted-foreground">
            {extraction.extraction_result.length} document(s) processed
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadAsCsv}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download CSV
        </Button>
      </div>

      {/* Results Table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-64">Document Name</TableHead>
                {allKeys.map((key) => (
                  <TableHead key={key} className="min-w-32">
                    {key
                      .replace(/_/g, " ")
                      .replace(/([A-Z])/g, " $1")
                      .toLowerCase()
                      .replace(/^\w/, (c) => c.toUpperCase())}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {extraction.extraction_result.map((result) => {
                const dataEntries = result.data
                  ? Object.entries(result.data)
                  : [];
                const hasData = dataEntries.length > 0;

                return (
                  <TableRow key={result.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            hasData ? "bg-blue-100" : "bg-gray-100"
                          }`}
                        >
                          <FileText
                            className={`w-4 h-4 ${
                              hasData ? "text-blue-600" : "text-gray-400"
                            }`}
                          />
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {result.file}
                          </div>
                          <div className="text-xs text-gray-500">
                            {hasData
                              ? `${dataEntries.length} fields`
                              : "No data"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    {allKeys.map((key) => {
                      const value = (
                        result.data as Record<string, unknown> | undefined
                      )?.[key];
                      return (
                        <TableCell key={key} className="max-w-xs">
                          <div className="truncate">
                            {value !== undefined && value !== null ? (
                              <span className="text-sm">
                                {formatValue(value)}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
