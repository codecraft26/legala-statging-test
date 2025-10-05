"use client";

import React from "react";
import { Loader2, Search, Folder, File as FileIcon } from "lucide-react";
import { useDocuments, type DocumentItem } from "@/hooks/use-documents";

type Props = {
  workspaceId: string | null;
  currentFolderId: string | null;
  onFolderChange: (id: string | null) => void;
  searchTerm: string;
  onSearchTermChange: (s: string) => void;
  onSelectFile: (file: DocumentItem) => void;
};

export default function DataHubPicker({
  workspaceId,
  currentFolderId,
  onFolderChange,
  searchTerm,
  onSearchTermChange,
  onSelectFile,
}: Props) {
  const { data: availableDocuments = [], isLoading } = useDocuments(
    workspaceId,
    currentFolderId
  );

  const filtered = availableDocuments.filter(
    (file) =>
      !searchTerm ||
      (file.filename && file.filename.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-xs font-medium text-gray-700">Data Hub</label>
      </div>

        <div className="border border-gray-200 rounded-lg p-2 bg-gray-50 max-h-32 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
              <span className="text-xs text-gray-500">Loading...</span>
            </div>
          ) : (
            <>
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => onSearchTermChange(e.target.value)}
                  placeholder="Search files..."
                  className="w-full pl-7 pr-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-2 text-gray-500 text-xs">
                  {searchTerm ? `No files found matching "${searchTerm}"` : "No files available"}
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filtered.map((file, index) => (
                    <div
                      key={file.id || index}
                      className="flex items-center justify-between p-1.5 hover:bg-gray-100 rounded cursor-pointer text-xs"
                      onClick={() => {
                        if (file.type === "folder") {
                          onFolderChange(file.id);
                        } else {
                          onSelectFile(file);
                        }
                      }}
                    >
                      <div className="flex items-center space-x-1.5 flex-1 truncate">
                        {file.type === "folder" ? (
                          <Folder className="w-3 h-3 text-gray-700 flex-shrink-0" />
                        ) : (
                          <FileIcon className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        )}
                        <span className="truncate" title={file.filename}>
                          {file.filename || "Unnamed file"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      
    </div>
  );
}


