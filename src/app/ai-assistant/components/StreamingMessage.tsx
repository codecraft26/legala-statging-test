"use client";

import React from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface StreamingMessageProps {
  streamingMessage: string;
}

export function StreamingMessage({ streamingMessage }: StreamingMessageProps) {
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
          <MarkdownRenderer content={streamingMessage} />
          <span className="animate-pulse text-sm">|</span>
        </div>
      </div>
    </div>
  );
}
