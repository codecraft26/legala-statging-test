"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download, User } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import { type Conversation, type AssistantChat } from "@/hooks/use-assistant";

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
