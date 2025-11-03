"use client";

import React, { useMemo, useState, memo, useCallback } from "react";
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

  // Hide placeholder bullet lists for extract chats (e.g., "- Description", "- **Description**:", "+28 more")
  const isPlaceholderExtractList = (text: string) => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return false;
    // Matches bullet lines that contain only the label name (Description/Value),
    // optionally wrapped in **bold** and/or ending with a colon, with no value text after
    const bulletLabelOnly = /^-\s*(?:\*\*)?\s*(Description|Value)\s*(?:\*\*)?\s*:?(?:\s*)$/i;
    const plusMoreLine = /^\+\s*\d+\s*more\s*$/i;
    const onlyPlaceholders = lines.every((l) => bulletLabelOnly.test(l) || plusMoreLine.test(l));
    const hasAtLeastTwoLabels = lines.filter((l) => bulletLabelOnly.test(l)).length >= 2;
    return onlyPlaceholders && hasAtLeastTwoLabels;
  };

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

    // Add the message content with Markdown-aware formatting for readability in DOCX
    const stripHtml = (s: string) => s.replace(/<[^>]+>/g, "");
    const stripCitations = (s: string) => s
      .replace(/<sup>\s*\[\[[^\]]+\]\]\s*<\/sup>/gi, "")
      .replace(/\[\[[^\]]+\]\]/g, "");
    const normalized = stripCitations(stripHtml((cleanContent || "").replace(/\r\n/g, "\n")));
    const normalizedDeduped = dedupeConsecutiveLines(normalized);

    const createRunsWithInlineStyles = (text: string): TextRun[] => {
      const runs: TextRun[] = [];
      if (!text) return [new TextRun("")];
      // Handle bold (**text**) and italics (*text*) minimally
      let remaining = text;
      const boldRegex = /\*\*(.+?)\*\*/g;
      let lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = boldRegex.exec(text))) {
        if (m.index > lastIndex) {
          runs.push(new TextRun({ text: text.slice(lastIndex, m.index) }));
        }
        runs.push(new TextRun({ text: m[1], bold: true }));
        lastIndex = m.index + m[0].length;
      }
      if (lastIndex < text.length) {
        runs.push(new TextRun({ text: text.slice(lastIndex) }));
      }
      return runs;
    };

    const blocks = normalizedDeduped.split(/\n\n+/);
    for (const block of blocks) {
      const lines = block.split("\n");
      const isListBlock = lines.every(l => /^\s*([*-])\s+/.test(l));
      const headingMatch = /^\s*(#{1,6})\s+(.*)$/.exec(lines[0] || "");

      if (headingMatch) {
        const level = headingMatch[1].length;
        const headingText = headingMatch[2];
        children.push(new Paragraph({
          text: headingText,
          heading: Math.min(level, 3) === 1 ? HeadingLevel.HEADING_1 : Math.min(level, 3) === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
          spacing: { after: 120 },
        }));
        const rest = lines.slice(1).join("\n").trim();
        if (rest) {
          const restLines = rest.split("\n");
          const runs: TextRun[] = [];
          restLines.forEach((line, idx) => {
            createRunsWithInlineStyles(line).forEach(r => runs.push(r));
            if (idx < restLines.length - 1) runs.push(new TextRun({ break: 1 }));
          });
          children.push(new Paragraph({ children: runs, spacing: { after: 200 } }));
        }
        continue;
      }

      if (isListBlock) {
        for (const line of lines) {
          const itemText = line.replace(/^\s*([*-])\s+/, "");
          children.push(new Paragraph({
            children: createRunsWithInlineStyles(itemText),
            bullet: { level: 0 },
            spacing: { after: 80 },
          }));
        }
        continue;
      }

      const runs: TextRun[] = [];
      lines.forEach((line, idx) => {
        createRunsWithInlineStyles(line).forEach(r => runs.push(r));
        if (idx < lines.length - 1) runs.push(new TextRun({ break: 1 }));
      });
      children.push(new Paragraph({ children: runs, spacing: { after: 200 } }));
    }

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
    const sanitize = (text: string): string => {
      return text
        // Remove any leading 'data:' prefixes at the start or after newlines
        .replace(/^\s*data:\s*/i, "")
        .replace(/\n\s*data:\s*/gi, "\n")
        // Remove citation superscripts and inline citations like [[1]] or [[C:...]]
        .replace(/<sup>\s*\[\[[^\]]+\]\]\s*<\/sup>/gi, "")
        .replace(/\[\[[^\]]+\]\]/g, "");
    };
    try {
      const lines = conversation.content.split('\n');
      const parts: string[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const data = JSON.parse(trimmed);
          if (data.type === "response" && data.content) {
            // Sanitize streamed JSONL content
            const clean = sanitize(String(data.content));
            parts.push(clean);
          }
        } catch {
          // ignore non-JSON lines
        }
      }
      if (parts.length > 0) return parts.join("");
      // Also clean the fallback content for saved messages
      return sanitize(conversation.content);
    } catch {
      return sanitize(conversation.content);
    }
  }, [conversation.content]);

  const dedupeConsecutiveLines = useCallback((text: string): string => {
    // Skip deduplication for extraction data as it might have legitimate repetitions
    if (conversation.type === "extract" || currentChat?.type === "extract") {
      return text;
    }
    const lines = text.split('\n');
    const result: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      const last = result.length > 0 ? result[result.length - 1].trim() : null;
      if (last !== null && trimmed && last === trimmed) {
        continue;
      }
      result.push(line);
    }
    return result.join('\n');
  }, [conversation.type, currentChat?.type]);

  const displayContent = useMemo(() => dedupeConsecutiveLines(cleanContent), [cleanContent, dedupeConsecutiveLines]);

  // Check if this is an extraction response and parse it
  const isExtraction = isExtractionResponse(cleanContent);
  const tableData = isExtraction ? parseExtractionData(cleanContent) : null;
  
  // Ensure tableData is valid before rendering
  const isValidTableData = tableData && tableData.columns && tableData.rows && 
                          Array.isArray(tableData.columns) && Array.isArray(tableData.rows);

  // Suppress placeholder bullets in extract chats when no table parsed
  if (
    (currentChat?.type === "extract" || conversation.type === "extract") &&
    !isExtraction &&
    isPlaceholderExtractList(cleanContent.trim())
  ) {
    return null;
  }

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
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Extracted Data</span>
                <Badge variant="secondary" className="text-xs">
                  {tableData!.rows.length} {tableData!.rows.length === 1 ? 'record' : 'records'}
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
            <p className="text-sm text-muted-foreground">
              Successfully extracted <strong>{tableData!.rows.length}</strong> {tableData!.rows.length === 1 ? 'record' : 'records'} with <strong>{tableData!.columns.length}</strong> columns.
            </p>
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
            <MarkdownRenderer content={displayContent} />
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
