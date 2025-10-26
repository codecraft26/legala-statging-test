"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download, User, FileSpreadsheet } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { TableDisplay } from "./TableDisplay";
import { Badge } from "@/components/ui/badge";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import { type Conversation, type AssistantChat } from "@/hooks/use-assistant";
import { isExtractionResponse, parseExtractionData, tableDataToCSV, downloadCSV } from "@/lib/extraction-utils";

interface MessageBubbleProps {
  conversation: Conversation;
  currentChat?: AssistantChat | null;
}

export function MessageBubble({ conversation, currentChat }: MessageBubbleProps) {
  // Export individual message to DOCX
  const exportMessageDOCX = async (message: Conversation) => {
    const children: Paragraph[] = [];
    
    // Add header with chat info
    children.push(new Paragraph({ text: "AI Assistant Message", heading: HeadingLevel.HEADING_1 }));
    if (currentChat?.name) {
      children.push(new Paragraph({ text: `Chat: ${currentChat.name}`, heading: HeadingLevel.HEADING_2 }));
    }
    children.push(new Paragraph({ text: `Message from: ${message.role.toUpperCase()}`, heading: HeadingLevel.HEADING_3 }));
    children.push(new Paragraph({ text: `Date: ${new Date(message.createdAt).toLocaleString()}`, heading: HeadingLevel.HEADING_3 }));
    children.push(new Paragraph({ text: "" }));

    // Clean the message content (remove citation codes)
    let cleanContent = message.content;
    try {
      const lines = message.content.split('\n');
      const parts: string[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const data = JSON.parse(trimmed);
          if (data.type === "response" && data.content) {
            const cleanContent = String(data.content).replace(/\[\[C:[^\]]+\]\]/g, '');
            parts.push(cleanContent);
          }
        } catch {
          // ignore non-JSON lines
        }
      }
      if (parts.length > 0) {
        cleanContent = parts.join("");
      } else {
        cleanContent = message.content.replace(/\[\[C:[^\]]+\]\]/g, '');
      }
    } catch {
      cleanContent = message.content.replace(/\[\[C:[^\]]+\]\]/g, '');
    }

    // Add the message content
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: cleanContent }),
        ],
        spacing: { after: 200 },
      })
    );

    const doc = new Document({ sections: [{ properties: {}, children }] });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `message-${message.role}-${message.id}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cleanContent = (() => {
    try {
      const lines = conversation.content.split('\n');
      const parts: string[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const data = JSON.parse(trimmed);
          if (data.type === "response" && data.content) {
            // Remove citation codes like [[C:...]] from the content
            const cleanContent = String(data.content).replace(/\[\[C:[^\]]+\]\]/g, '');
            parts.push(cleanContent);
          }
        } catch {
          // ignore non-JSON lines
        }
      }
      if (parts.length > 0) return parts.join("");
      // Also clean the fallback content
      return conversation.content.replace(/\[\[C:[^\]]+\]\]/g, '');
    } catch {
      return conversation.content.replace(/\[\[C:[^\]]+\]\]/g, '');
    }
  })();

  // Check if this is an extraction response and parse it
  const isExtraction = isExtractionResponse(cleanContent);
  const tableData = isExtraction ? parseExtractionData(cleanContent) : null;
  
  // Ensure tableData is valid before rendering
  const isValidTableData = tableData && tableData.columns && tableData.rows && 
                          Array.isArray(tableData.columns) && Array.isArray(tableData.rows);

  // For extraction tables, show compact table in chat
  if (conversation.role === "assistant" && isExtraction && isValidTableData) {
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
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Extracted Data</span>
                <Badge variant="secondary" className="text-xs">
                  {tableData!.rows.length} records
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const csvContent = tableDataToCSV(tableData!);
                  const timestamp = new Date().toISOString().split('T')[0];
                  const filename = `extraction_data_${timestamp}.csv`;
                  downloadCSV(csvContent, filename);
                }}
                className="h-6 px-2 text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                Export CSV
              </Button>
            </div>
            
            {/* Compact table display */}
            <div className="overflow-x-auto max-h-64 border rounded">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    {tableData!.columns.slice(0, 5).map((column, index) => (
                      <th key={`${column.key}_${index}`} className="px-2 py-1 text-left font-medium text-muted-foreground min-w-20">
                        {column.label}
                      </th>
                    ))}
                    {tableData!.columns.length > 5 && (
                      <th className="px-2 py-1 text-left font-medium text-muted-foreground">
                        +{tableData!.columns.length - 5} more
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {tableData!.rows.slice(0, 8).map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b last:border-b-0">
                      {tableData!.columns.slice(0, 5).map((column, colIndex) => {
                        const dataKey = column.originalKey || column.key;
                        const value = row[dataKey];
                        const displayValue = value ? String(value).substring(0, 30) + (String(value).length > 30 ? '...' : '') : '-';
                        return (
                          <td key={`${column.key}_${colIndex}`} className="px-2 py-1 min-w-20">
                            <span className="text-xs">{displayValue}</span>
                          </td>
                        );
                      })}
                      {tableData!.columns.length > 5 && (
                        <td className="px-2 py-1 text-xs text-muted-foreground">
                          ...
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {(tableData!.rows.length > 8 || tableData!.columns.length > 5) && (
              <div className="mt-2 text-xs text-muted-foreground text-center">
                Showing {Math.min(8, tableData!.rows.length)} of {tableData!.rows.length} rows, {Math.min(5, tableData!.columns.length)} of {tableData!.columns.length} columns
              </div>
            )}
          </div>
          {/* Export button for extraction data */}
          <div className="flex justify-end mt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => exportMessageDOCX(conversation)}
              className="h-6 px-2 text-xs opacity-70 hover:opacity-100"
              title="Export this message as DOCX"
            >
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // For regular messages, use the normal message bubble layout
  return (
    <div className={`flex gap-3 ${conversation.role === "user" ? "justify-end" : "justify-start"}`}>
      {conversation.role === "assistant" && (
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
          <img 
            src="/logo.png" 
            alt="Infrahive" 
            className="w-8 h-8 object-contain"
          />
        </div>
      )}
      <div className={`max-w-[80%] ${conversation.role === "user" ? "order-first" : ""}`}>
        <div className={`rounded-lg p-3 ${
          conversation.role === "user" 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted"
        }`}>
          {conversation.role === "assistant" ? (
            <MarkdownRenderer content={cleanContent} />
          ) : (
            <p className="text-sm whitespace-pre-wrap">
              {conversation.content}
            </p>
          )}
        </div>
        {/* Export button only for assistant messages */}
        {conversation.role === "assistant" && (
          <div className="flex justify-end mt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => exportMessageDOCX(conversation)}
              className="h-6 px-2 text-xs opacity-70 hover:opacity-100"
              title="Export this message as DOCX"
            >
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>
          </div>
        )}
      </div>
      {conversation.role === "user" && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-primary text-primary-foreground">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
