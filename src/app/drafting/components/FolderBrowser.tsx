"use client";

import React from "react";
import { Home, ChevronRight, Folder, Loader2 } from "lucide-react";
import { DocumentItem } from "@/hooks/use-documents";
import DocumentListItem from "./DocumentListItem";

interface FolderPath {
  id: string;
  name: string;
}

interface FolderBrowserProps {
  documents: DocumentItem[];
  isLoading: boolean;
  folderPath: FolderPath[];
  onHome: () => void;
  onBack: () => void;
  onFolderClick: (folder: DocumentItem) => void;
  onCrumbClick: (index: number) => void;
  showBackButton?: boolean;
  className?: string;
}

export default function FolderBrowser({
  documents,
  isLoading,
  folderPath,
  onHome,
  onBack,
  onFolderClick,
  onCrumbClick,
  showBackButton = true,
  className = "",
}: FolderBrowserProps) {
  return (
    <div className={`border rounded-lg bg-white w-full ${className}`}>
      <div className="p-3 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <button
              onClick={onHome}
              className="flex items-center space-x-1 hover:text-gray-800 px-2 py-1 rounded"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
            {folderPath.map((folder, index) => (
              <React.Fragment key={`${folder.id}-${index}`}>
                <ChevronRight className="w-4 h-4" />
                <button
                  onClick={() => onCrumbClick(index)}
                  className="hover:text-gray-800 px-2 py-1 rounded"
                >
                  {folder.name}
                </button>
              </React.Fragment>
            ))}
          </div>
          {showBackButton && folderPath.length > 0 && (
            <button
              onClick={onBack}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 px-2 py-1 rounded"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span>Back</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-h-60 overflow-y-auto p-2">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
            Loading...
          </div>
        ) : (
          <div className="space-y-1">
            {/* Folders */}
            {documents
              ?.filter((doc) => doc.type === "folder")
              .map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => onFolderClick(folder)}
                  className="w-full flex items-center space-x-1.5 px-1.5 py-1 text-left hover:bg-gray-50 rounded min-h-[28px]"
                >
                  <Folder className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  <span
                    className="text-xs break-words flex-1 truncate"
                    title={folder.filename}
                  >
                    {folder.filename}
                  </span>
                  <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                </button>
              ))}

            {/* Files */}
            {documents
              ?.filter((doc) => doc.type === "file")
              .map((file) => (
                <DocumentListItem
                  key={file.id}
                  document={file}
                  showImportButton={false}
                  showSelection={false}
                />
              ))}

            {/* No content message */}
            {documents?.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-500">
                No files or folders in this directory
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
