"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronRight,
  ArrowLeft,
  Loader2,
  X,
  FileText,
  Folder,
  Search,
} from "lucide-react";
import { TruncatedFilename } from "@/components/ui/truncated-filename";

export interface DocumentItem {
  id: string;
  filename: string;
  type: "file" | "folder";
  s3_key_original?: string;
}

interface DocumentsImportModalProps {
  open: boolean;
  onClose: () => void;
  isFetching: boolean;
  isImporting: boolean;
  folderPath: { id: string; name: string }[];
  items: DocumentItem[];
  selectedIds: string[];
  onBack: () => void;
  onCrumbClick: (index: number) => void;
  onFolderClick: (folder: DocumentItem) => void;
  onToggleSelect: (id: string) => void;
  onImport: () => void;
}

export default function DocumentsImportModal({
  open,
  onClose,
  isFetching,
  isImporting,
  folderPath,
  items,
  selectedIds,
  onBack,
  onCrumbClick,
  onFolderClick,
  onToggleSelect,
  onImport,
}: DocumentsImportModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Clear search when modal closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase().trim();
    return items.filter((item) =>
      item.filename.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-background border rounded-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-medium text-foreground">
              Select Files from Documents
            </h3>
            <span className="px-3 py-1 bg-black text-white text-xs font-semibold rounded-md">
              Security: Documents not saved
            </span>
          </div>
          <Button 
            onClick={() => {
              setSearchQuery("");
              onClose();
            }} 
            variant="ghost" 
            size="sm"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center space-x-2 mb-4 text-sm text-muted-foreground">
          <Button
            onClick={() => onCrumbClick(-1)}
            variant="ghost"
            size="sm"
            className="p-0 h-auto hover:text-primary"
          >
            Documents
          </Button>
          {folderPath.map((folder, index) => (
            <React.Fragment key={folder.id}>
              <ChevronRight className="w-4 h-4" />
              <Button
                onClick={() => onCrumbClick(index)}
                variant="ghost"
                size="sm"
                className="p-0 h-auto hover:text-primary"
              >
                {folder.name}
              </Button>
            </React.Fragment>
          ))}
        </div>

        {/* Search Input */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto mb-4">
          {isFetching ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                      item.type === "file" && selectedIds.includes(item.id)
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => {
                      if (item.type === "folder") {
                        onFolderClick(item);
                        setSearchQuery(""); // Clear search when navigating
                      } else {
                        onToggleSelect(item.id);
                      }
                    }}
                  >
                    {item.type === "folder" ? (
                      <Folder className="w-5 h-5 text-primary mr-3" />
                    ) : (
                      <FileText className="w-5 h-5 text-muted-foreground mr-3" />
                    )}
                    <span className="flex-1 text-sm font-medium text-foreground">
                      <TruncatedFilename
                        filename={item.filename}
                        maxLength={25}
                        showExtension={true}
                      />
                    </span>
                    {item.type === "folder" ? (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => {}}
                        className="h-4 w-4 text-primary rounded"
                      />
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  {searchQuery.trim()
                    ? "No files or folders match your search"
                    : folderPath.length > 0
                      ? "This folder is empty"
                      : "No documents available"}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <Button 
            onClick={() => {
              setSearchQuery("");
              onClose();
            }} 
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={onImport}
            disabled={selectedIds.length === 0 || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Importing...
              </>
            ) : (
              `Import Selected (${selectedIds.length})`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
