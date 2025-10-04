"use client";

import React from "react";
import { FileText, Folder, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DocumentItem } from "@/hooks/use-documents";

interface DocumentListItemProps {
  document: DocumentItem;
  isSelected?: boolean;
  isLoading?: boolean;
  onSelect?: (document: DocumentItem) => void;
  onToggle?: (documentId: string) => void;
  onImport?: (document: DocumentItem) => void;
  showImportButton?: boolean;
  showSelection?: boolean;
}

export default function DocumentListItem({
  document,
  isSelected = false,
  isLoading = false,
  onSelect,
  onToggle,
  onImport,
  showImportButton = false,
  showSelection = false,
}: DocumentListItemProps) {
  const isPDF =
    document.type === "file" &&
    document.filename.toLowerCase().endsWith(".pdf");
  const fileExtension = document.filename.split(".").pop()?.toUpperCase();

  const handleClick = () => {
    if (document.type === "folder") {
      onSelect?.(document);
    } else if (showSelection) {
      onToggle?.(document.id);
    }
    // Note: Import is only triggered by the Import button, not by clicking the document item
  };

  return (
    <div
      className={`flex items-center justify-between px-2 py-1.5 border rounded hover:bg-gray-50 cursor-pointer min-h-[36px] ${
        isSelected ? "bg-blue-50 border-blue-200" : ""
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center space-x-1.5 flex-1 min-w-0">
        {document.type === "folder" ? (
          <Folder className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
        ) : (
          <FileText
            className={`w-3.5 h-3.5 flex-shrink-0 ${isPDF ? "text-red-500" : "text-gray-500"}`}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="font-medium text-xs truncate" title={document.filename}>
            {document.filename}
          </div>
          {document.user && (
            <div className="text-xs text-gray-500 truncate">
              by {document.user.name} •{" "}
              {new Date(document.createdAt || "").toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-1 flex-shrink-0">
        {document.type === "file" && (
          <Badge
            variant={isPDF ? "destructive" : "secondary"}
            className="text-xs px-1 py-0.5 h-4"
          >
            {fileExtension}
          </Badge>
        )}
        {isPDF && (
          <span
            className="text-xs text-red-500"
            title="PDF files cannot be directly edited"
          >
            📄
          </span>
        )}
        {document.type === "file" && showImportButton && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-1.5 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onImport?.(document);
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              "Import"
            )}
          </Button>
        )}
        {document.type === "folder" && (
          <ChevronRight className="w-3 h-3 text-gray-400" />
        )}
      </div>
    </div>
  );
}
