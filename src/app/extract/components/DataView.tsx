"use client";

import React from "react";
import { Button } from "@/components/ui/button";

export default function DataView({
  extractedData,
  uploadedFiles,
  onBack,
}: {
  extractedData: Array<{
    fileName: string;
    extractedData: unknown;
    usage?: unknown;
    rawResponse?: unknown;
    agent?: string;
  }>;
  uploadedFiles: { file: File }[];
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-2">Results</h3>
        <div className="space-y-4">
          {extractedData?.length ? (
            extractedData.map((r, i) => (
              <div key={i} className="rounded-md border p-4">
                <div className="text-sm font-medium">{r.fileName}</div>
                <pre className="mt-2 overflow-auto rounded bg-muted p-3 text-xs">
                  {JSON.stringify(r.extractedData, null, 2)}
                </pre>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No extraction output yet.
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline">Download JSON</Button>
          <Button>Save</Button>
        </div>
      </div>
    </div>
  );
}
