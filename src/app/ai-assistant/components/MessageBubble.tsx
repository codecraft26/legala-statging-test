"use client";

import React, { useMemo, useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { Download, User, FileSpreadsheet, Eye } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { TableDisplay } from "./TableDisplay";
import { ExtractionModal } from "./ExtractionModal";
import { Badge } from "@/components/ui/badge";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import { type Conversation, type AssistantChat } from "@/hooks/use-assistant";
import { isExtractionResponse, parseExtractionData, tableDataToCSV, downloadCSV } from "@/lib/extraction-utils";

interface MessageBubbleProps {
  conversation: Conversation;
  currentChat?: AssistantChat | null;
}

function MessageBubbleComponent({ conversation, currentChat }: MessageBubbleProps) {
  const [showExtractionModal, setShowExtractionModal] = useState(false);

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

  const cleanContent = useMemo(() => {
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
            const clean = String(data.content).replace(/\[\[C:[^\]]+\]\]/g, '');
            parts.push(clean);
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
  }, [conversation.content]);

  // Check if this is an extraction response and parse it
  const isExtraction = isExtractionResponse(cleanContent);
  const tableData = isExtraction ? parseExtractionData(cleanContent) : null;
  
  // Ensure tableData is valid before rendering
  const isValidTableData = tableData && tableData.columns && tableData.rows && 
                          Array.isArray(tableData.columns) && Array.isArray(tableData.rows);

  // Show extraction tables only for messages with type 'extract' (do not force using chat type)
  if (
    conversation.role === "assistant" &&
    isExtraction &&
    isValidTableData &&
    conversation.type === "extract"
  ) {
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
                <span className="text-sm font-medium">Extracted Data</span>
                <Badge variant="secondary" className="text-xs">
                  {tableData!.rows.length} records
                </Badge>
              </div>
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
            </div>
            
            {/* Data preview */}
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">
                Successfully extracted <strong>{tableData!.rows.length}</strong> records with <strong>{tableData!.columns.length}</strong> columns.
              </p>
              <div className="flex flex-wrap gap-1">
                {tableData!.columns.slice(0, 6).map((column, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {column.label}
                  </Badge>
                ))}
                {tableData!.columns.length > 6 && (
                  <Badge variant="outline" className="text-xs">
                    +{tableData!.columns.length - 6} more
                  </Badge>
                )}
              </div>
            </div>
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

export const MessageBubble = memo(MessageBubbleComponent);
