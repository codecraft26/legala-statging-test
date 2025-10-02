"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  ArrowLeft,
  Loader2,
  X,
  FileText,
  Folder,
} from "lucide-react";

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
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Select Files from Documents
          </h3>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center space-x-2 mb-4 text-sm text-gray-600">
          <Button
            onClick={() => onCrumbClick(-1)}
            variant="ghost"
            size="sm"
            className="p-0 h-auto hover:text-blue-600"
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
                className="p-0 h-auto hover:text-blue-600"
              >
                {folder.name}
              </Button>
            </React.Fragment>
          ))}
        </div>

        {isFetching ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {items.length > 0 ? (
              items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center p-3 rounded-lg cursor-pointer ${
                    item.type === "file" && selectedIds.includes(item.id)
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    if (item.type === "folder") {
                      onFolderClick(item);
                    } else {
                      onToggleSelect(item.id);
                    }
                  }}
                >
                  {item.type === "folder" ? (
                    <Folder className="w-5 h-5 text-blue-500 mr-3" />
                  ) : (
                    <FileText className="w-5 h-5 text-gray-500 mr-3" />
                  )}
                  <span className="flex-1 text-sm font-medium text-gray-900">
                    {item.filename}
                  </span>
                  {item.type === "folder" ? (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  ) : (
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => {}}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center">
                {folderPath.length > 0
                  ? "This folder is empty"
                  : "No documents available"}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button onClick={onClose} variant="outline">
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
