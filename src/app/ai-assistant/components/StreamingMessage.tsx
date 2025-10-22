"use client";

import React, { useState, useEffect } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface StreamingMessageProps {
  streamingMessage: string;
}

export function StreamingMessage({ streamingMessage }: StreamingMessageProps) {
  const [showCursor, setShowCursor] = useState(true);

  // Smooth cursor blinking animation
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500); // Blink every 500ms for smoother animation

    return () => clearInterval(interval);
  }, []);

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
          </div>
        </div>
      </div>
    </div>
  );
}
