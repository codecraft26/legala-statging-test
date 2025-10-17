"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Check, X } from "lucide-react";
import { Document } from "../page";

interface DocumentSelectorProps {
  documents: Document[];
  selectedDocuments: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export function DocumentSelector({ documents, selectedDocuments, onSelectionChange }: DocumentSelectorProps) {
  const handleSelectAll = () => {
    if (selectedDocuments.length === documents.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(documents.map(doc => doc.id));
    }
  };

  const handleSelectDocument = (documentId: string) => {
    if (selectedDocuments.includes(documentId)) {
      onSelectionChange(selectedDocuments.filter(id => id !== documentId));
    } else {
      onSelectionChange([...selectedDocuments, documentId]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileTypeColor = (type: string) => {
    if (type.includes("pdf")) return "bg-red-500";
    if (type.includes("word") || type.includes("document")) return "bg-blue-500";
    if (type.includes("text")) return "bg-green-500";
    return "bg-gray-500";
  };

  const getFileTypeIcon = (type: string) => {
    if (type.includes("pdf")) return "📄";
    if (type.includes("word") || type.includes("document")) return "📝";
    if (type.includes("text")) return "📃";
    return "📄";
  };

  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold">Select Documents</h3>
          <p className="text-[10px] text-muted-foreground">
            Choose documents for analysis
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="h-6 px-2 text-[10px]"
          >
            {selectedDocuments.length === documents.length ? (
              <>
                <X className="w-2.5 h-2.5 mr-1" />
                Deselect All
              </>
            ) : (
              <>
                <Check className="w-2.5 h-2.5 mr-1" />
                Select All
              </>
            )}
          </Button>
          <Badge variant="secondary" className="text-[10px]">
            {selectedDocuments.length}/{documents.length}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 lg:grid-cols-4 gap-1">
        {documents.map((document) => {
          const isSelected = selectedDocuments.includes(document.id);
          const fileTypeColor = getFileTypeColor(document.type);
          const fileTypeIcon = getFileTypeIcon(document.type);

          return (
            <Card 
              key={document.id}
              className={`cursor-pointer transition-all hover:shadow-sm ${
                isSelected 
                  ? "ring-1 ring-primary border-primary/50 bg-primary/5" 
                  : "hover:border-muted-foreground/50"
              }`}
              onClick={() => handleSelectDocument(document.id)}
            >
              <CardContent className="p-1.5">
                <div className="space-y-1">
                  <div className="flex items-start gap-1">
                    <div className={`w-4 h-4 rounded ${fileTypeColor} flex items-center justify-center text-white text-[10px]`}>
                      {fileTypeIcon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-[10px] font-medium truncate leading-tight">{document.name}</CardTitle>
                      <CardDescription className="text-[9px]">
                        {formatFileSize(document.size)}
                      </CardDescription>
                    </div>
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleSelectDocument(document.id)}
                      className="mt-0 w-3 h-3"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedDocuments.length === 0 && (
        <div className="text-center py-2 text-muted-foreground">
          <FileText className="w-4 h-4 mx-auto mb-1 opacity-50" />
          <p className="text-[10px]">Select at least one document to start your analysis</p>
        </div>
      )}

      {selectedDocuments.length > 0 && (
        <div className="p-1.5 bg-primary/5 rounded border border-primary/20">
          <div className="flex items-center gap-1">
            <Check className="w-2.5 h-2.5 text-primary" />
            <span className="text-[10px] font-medium text-primary">
              {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
