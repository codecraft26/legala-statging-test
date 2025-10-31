"use client";

import React, { useState, useEffect } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { Reasoning, ReasoningTrigger, ReasoningContent } from "@/components/ui/shadcn-io/ai/reasoning";
// Removed unused table display imports
import { ExtractionModal } from "./ExtractionModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Eye, Download } from "lucide-react";
import { isExtractionResponse, parseExtractionData, tableDataToCSV, downloadCSV } from "@/lib/extraction-utils";

interface StreamingMessageProps {
  streamingMessage: string;
  currentChatType?: string;
  isStreaming: boolean;
}

export function StreamingMessage({ streamingMessage, currentChatType, isStreaming }: StreamingMessageProps) {
  const [showExtractionModal, setShowExtractionModal] = useState(false);

  // Check if this is an extraction response and parse it
  const isExtraction = isExtractionResponse(streamingMessage);
  const tableData = isExtraction ? parseExtractionData(streamingMessage) : null;
  
  // Ensure tableData is valid before rendering
  const isValidTableData = tableData && tableData.columns && tableData.rows && 
                          Array.isArray(tableData.columns) && Array.isArray(tableData.rows);

  // For extraction tables, show compact preview with modal button
  if (currentChatType === 'extract' && isExtraction && isValidTableData) {
    return (
      <div className="flex gap-3 justify-start">
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
          <img 
            src="/logo.png" 
            alt="Infrahive" 
            className="w-8 h-8 object-contain"
          />
        </div>
        <div className="max-w-[80%]">
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">
                  {isStreaming ? 'Extracting Data...' : 'Extracted Data'}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {tableData!.rows.length} records
                </Badge>
              </div>
              {!isStreaming && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExtractionModal(true)}
                    className="h-7 px-3 text-xs"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View Data
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const csvContent = tableDataToCSV(tableData!);
                      const timestamp = new Date().toISOString().split('T')[0];
                      const filename = `extraction_data_${timestamp}.csv`;
                      downloadCSV(csvContent, filename);
                    }}
                    className="h-7 px-3 text-xs"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Export CSV
                  </Button>
                </div>
              )}
            </div>
            
            {/* While streaming, show live streamed markdown; after complete, show a concise summary */}
            {isStreaming ? (
              <div className="text-sm text-foreground">
                <MarkdownRenderer content={streamingMessage} />
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <p className="mb-1">
                  Successfully extracted <strong>{tableData!.rows.length}</strong> records with <strong>{tableData!.columns.length}</strong> columns.
                </p>
              </div>
            )}
          </div>
          
          {/* Extraction Modal */}
          <ExtractionModal
            isOpen={showExtractionModal}
            onClose={() => setShowExtractionModal(false)}
            tableData={tableData}
            title="Extracted Data"
          />
        </div>
      </div>
    );
  }

  // For regular streaming messages, use the normal message bubble layout
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
        <img 
          src="/logo.png" 
          alt="Infrahive" 
          className="w-8 h-8 object-contain"
        />
      </div>
      <div className="max-w-[80%]">
        <div className="bg-muted rounded-lg p-3 streaming-message">
          <div className="relative">
            {/* Only show thinking indicator when streaming and no content yet */}
            {isStreaming && !streamingMessage && (
              <Reasoning isStreaming={true} defaultOpen={true}>
                <ReasoningTrigger title="Thinking" />
                <ReasoningContent>{"Processing your request..."}</ReasoningContent>
              </Reasoning>
            )}
            {/* Show content when available */}
            {streamingMessage && (
              <MarkdownRenderer content={streamingMessage} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
