"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, FileText, Table, CheckCircle, Clock } from "lucide-react";
import { Session, Conversation } from "../page";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  format: "csv" | "pdf";
}

export function ExportModal({ open, onOpenChange, session, format }: ExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const handleExport = async () => {
    if (!session) return;

    setIsExporting(true);
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (format === "csv") {
        await exportToCSV(session);
      } else {
        await exportToPDF(session);
      }
      
      setExportComplete(true);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = async (session: Session) => {
    const csvData = generateCSVData(session);
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session.name}_export.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = async (session: Session) => {
    // In a real implementation, you would use a PDF library like jsPDF or Puppeteer
    // For now, we'll simulate the download
    const pdfContent = generatePDFContent(session);
    const blob = new Blob([pdfContent], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session.name}_export.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateCSVData = (session: Session): string => {
    const headers = [
      "Conversation ID",
      "Mode",
      "User Prompt",
      "AI Response",
      "Selected Documents",
      "Citations",
      "Timestamp"
    ];

    const rows = session.conversations.map(conv => [
      conv.id,
      conv.mode,
      `"${conv.userPrompt.replace(/"/g, '""')}"`,
      `"${conv.response.replace(/"/g, '""')}"`,
      conv.selectedDocuments.join(";"),
      conv.citations?.map(c => `${c.documentId}:${c.pageNumber}`).join(";") || "",
      conv.timestamp
    ]);

    return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
  };

  const generatePDFContent = (session: Session): string => {
    // This is a simplified version - in reality you'd use a proper PDF library
    return `
AI Assistant Export Report
Session: ${session.name}
Generated: ${new Date().toLocaleString()}

Documents:
${session.documents.map(doc => `- ${doc.name} (${doc.type})`).join("\n")}

Conversations:
${session.conversations.map(conv => `
Mode: ${conv.mode}
User: ${conv.userPrompt}
AI: ${conv.response}
Documents: ${conv.selectedDocuments.join(", ")}
Citations: ${conv.citations?.length || 0}
Time: ${conv.timestamp}
`).join("\n---\n")}
    `;
  };

  const getFormatIcon = () => {
    return format === "csv" ? <Table className="w-5 h-5" /> : <FileText className="w-5 h-5" />;
  };

  const getFormatDescription = () => {
    return format === "csv" 
      ? "Export conversation data in CSV format for spreadsheet analysis"
      : "Export complete session report in PDF format for sharing and archiving";
  };

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFormatIcon()}
            Export Session as {format.toUpperCase()}
          </DialogTitle>
          <DialogDescription>
            {getFormatDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Session Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Session Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Session Name:</span>
                <span className="text-sm">{session.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Documents:</span>
                <Badge variant="secondary">{session.documents.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Conversations:</span>
                <Badge variant="secondary">{session.conversations.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Created:</span>
                <span className="text-sm">{new Date(session.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Export Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Export Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {format === "csv" ? (
                  <>
                    <p>• Conversation data in tabular format</p>
                    <p>• User prompts and AI responses</p>
                    <p>• Document selections and citations</p>
                    <p>• Timestamps and mode information</p>
                  </>
                ) : (
                  <>
                    <p>• Complete session report</p>
                    <p>• All conversations with formatting</p>
                    <p>• Document summaries and metadata</p>
                    <p>• Source citations and references</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Export Status */}
          {isExporting && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary animate-spin" />
                  <div>
                    <p className="text-sm font-medium">Exporting...</p>
                    <p className="text-xs text-muted-foreground">
                      Preparing your {format.toUpperCase()} file
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {exportComplete && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Export Complete!</p>
                    <p className="text-xs text-muted-foreground">
                      Your {format.toUpperCase()} file has been downloaded
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {exportComplete ? "Close" : "Cancel"}
          </Button>
          {!exportComplete && (
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export {format.toUpperCase()}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
