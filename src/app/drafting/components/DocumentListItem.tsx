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
      className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer min-h-[80px] ${
        isSelected ? "bg-blue-50 border-blue-200" : ""
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {document.type === "folder" ? (
          <Folder className="w-5 h-5 text-blue-500 flex-shrink-0" />
        ) : (
          <FileText
            className={`w-5 h-5 flex-shrink-0 ${isPDF ? "text-red-500" : "text-gray-500"}`}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="font-medium break-words" title={document.filename}>
            {document.filename}
          </div>
          {document.user && (
            <div className="text-sm text-gray-500 break-words">
              by {document.user.name} •{" "}
              {new Date(document.createdAt || "").toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 flex-shrink-0">
        {document.type === "file" && (
          <Badge
            variant={isPDF ? "destructive" : "secondary"}
            className="text-xs"
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
            onClick={(e) => {
              e.stopPropagation();
              onImport?.(document);
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Import"
            )}
          </Button>
        )}
        {document.type === "folder" && (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </div>
    </div>
  );
}
