"use client";

import React, { useState, useEffect } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { TableDisplay, CompactTableDisplay } from "./TableDisplay";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet } from "lucide-react";
import { isExtractionResponse, parseExtractionData } from "@/lib/extraction-utils";

interface StreamingMessageProps {
  streamingMessage: string;
}

export function StreamingMessage({ streamingMessage }: StreamingMessageProps) {
  const [showCursor, setShowCursor] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  // Smooth cursor blinking animation
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500); // Blink every 500ms for smoother animation

    return () => clearInterval(interval);
  }, []);

  // Check if streaming is complete (no new content for a while)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsComplete(true);
    }, 2000); // Consider complete after 2 seconds of no updates

    return () => clearTimeout(timer);
  }, [streamingMessage]);

  // Check if this is an extraction response and parse it
  const isExtraction = isExtractionResponse(streamingMessage);
  const tableData = isExtraction ? parseExtractionData(streamingMessage) : null;
  
  // Ensure tableData is valid before rendering
  const isValidTableData = tableData && tableData.columns && tableData.rows && 
                          Array.isArray(tableData.columns) && Array.isArray(tableData.rows);

  // For extraction tables, show compact table in chat
  if (isExtraction && isValidTableData) {
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
            <div className="flex items-center gap-2 mb-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">
                {isComplete ? 'Extracted Data' : 'Extracting Data...'}
              </span>
              <Badge variant="secondary" className="text-xs">
                {tableData!.rows.length} records
              </Badge>
            </div>
            
            {/* Compact table display */}
            <div className="overflow-x-auto max-h-48 border rounded">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    {tableData!.columns.slice(0, 4).map((column, index) => (
                      <th key={`${column.key}_${index}`} className="px-2 py-1 text-left font-medium text-muted-foreground min-w-16">
                        {column.label}
                      </th>
                    ))}
                    {tableData!.columns.length > 4 && (
                      <th className="px-2 py-1 text-left font-medium text-muted-foreground">
                        +{tableData!.columns.length - 4} more
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {tableData!.rows.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b last:border-b-0">
                      {tableData!.columns.slice(0, 4).map((column, colIndex) => {
                        const dataKey = column.originalKey || column.key;
                        const value = row[dataKey];
                        const displayValue = value ? String(value).substring(0, 20) + (String(value).length > 20 ? '...' : '') : '-';
                        return (
                          <td key={`${column.key}_${colIndex}`} className="px-2 py-1 min-w-16">
                            <span className="text-xs">{displayValue}</span>
                          </td>
                        );
                      })}
                      {tableData!.columns.length > 4 && (
                        <td className="px-2 py-1 text-xs text-muted-foreground">
                          ...
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-2 text-xs text-muted-foreground text-center">
              {isComplete 
                ? `Showing ${Math.min(5, tableData!.rows.length)} of ${tableData!.rows.length} rows`
                : 'Processing extraction data...'
              }
            </div>
          </div>
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
            <MarkdownRenderer content={streamingMessage} />
            {!isComplete && (
              <span 
                className={`inline-block w-2 h-4 ml-1 bg-current streaming-cursor ${
                  showCursor ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ 
                  verticalAlign: 'text-bottom'
                }}
              >
                |
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
