import { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Copy } from "lucide-react";
import { formatValue } from "./helpers";
import type { Extraction } from "./types";

type ResultsTabProps = {
  extraction: Extraction;
  onCopy: (data: unknown) => void;
};

const ResultsTab = memo(function ResultsTab({
  extraction,
  onCopy,
}: ResultsTabProps) {
  return (
    <div className="space-y-6">
      {extraction.extraction_result &&
      extraction.extraction_result.length > 0 ? (
        <div className="space-y-4">
          {extraction.extraction_result.map((result) => {
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
                    onClick={() => onCopy(result.data)}
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
                                .replace(/^\w/, (c) => c.toUpperCase())}
                            </TableCell>
                            <TableCell>
                              <pre className="whitespace-pre-wrap font-sans leading-relaxed text-sm">
                                {formatValue(value)}
                              </pre>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">
                      No data extracted from this document.
                    </p>
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
        </div>
      )}
    </div>
  );
});

export default ResultsTab;
