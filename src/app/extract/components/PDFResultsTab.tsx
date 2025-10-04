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
import type { Extraction, ExtractionResult } from "./types";

type PDFResultsTabProps = {
  extraction: Extraction;
  pdfResult: ExtractionResult;
  onCopy: (data: unknown) => void;
};

const PDFResultsTab = memo(function PDFResultsTab({
  extraction,
  pdfResult,
  onCopy,
}: PDFResultsTabProps) {
  const dataEntries = pdfResult.data ? Object.entries(pdfResult.data) : [];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <h4 className="font-medium">{pdfResult.file}</h4>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(pdfResult.data)}
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
            <p className="text-sm">No data extracted from this document.</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default PDFResultsTab;
