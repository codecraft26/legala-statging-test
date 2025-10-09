"use client";

import React, { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TruncatedFilenameProps {
  filename: string;
  maxLength?: number;
  className?: string;
  showExtension?: boolean;
}

export function TruncatedFilename({
  filename,
  maxLength = 20,
  className = "",
  showExtension = true,
}: TruncatedFilenameProps) {
  const shouldTruncate = filename.length > maxLength;
  
  if (!shouldTruncate) {
    return <span className={className}>{filename}</span>;
  }

  // Separate name and extension
  const lastDotIndex = filename.lastIndexOf('.');
  const hasExtension = lastDotIndex > 0 && lastDotIndex < filename.length - 1;
  
  let truncatedText = filename;
  
  if (hasExtension && showExtension) {
    const name = filename.substring(0, lastDotIndex);
    const extension = filename.substring(lastDotIndex);
    
    if (name.length > maxLength) {
      truncatedText = name.substring(0, maxLength) + "..." + extension;
    }
  } else {
    truncatedText = filename.substring(0, maxLength) + "...";
  }

  const [isOpen, setIsOpen] = useState(false);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimer) clearTimeout(hoverTimer);
    const timer = setTimeout(() => setIsOpen(true), 300); // 300ms delay
    setHoverTimer(timer);
  };

  const handleMouseLeave = () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    setIsOpen(false);
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
      }
    };
  }, [hoverTimer]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <span 
          className={`cursor-help ${className}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {truncatedText}
        </span>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto max-w-xs p-3 text-sm bg-gray-900 text-white border-gray-700 shadow-lg rounded-md break-all"
        side="top"
        align="center"
      >
        {filename}
      </PopoverContent>
    </Popover>
  );
}