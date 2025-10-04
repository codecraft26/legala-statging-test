"use client";

import React from "react";
import { Home, Folder, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentItem } from "@/hooks/use-documents";
import FolderBrowser from "./FolderBrowser";

interface FolderPath {
  id: string;
  name: string;
}

interface FolderSelectionProps {
  showFolderSelector: boolean;
  onToggleFolderSelector: () => void;
  onShowCreateFolder: () => void;
  currentFolderName: string;
  uploadDocuments: DocumentItem[];
  uploadDocumentsLoading: boolean;
  uploadFolderPath: FolderPath[];
  uploadFolderId: string | null;
  onUploadFolderHome: () => void;
  onUploadFolderBack: () => void;
  onUploadFolderClick: (folder: DocumentItem) => void;
  onUploadCrumbClick: (index: number) => void;
}

export default function FolderSelection({
  showFolderSelector,
  onToggleFolderSelector,
  onShowCreateFolder,
  currentFolderName,
  uploadDocuments,
  uploadDocumentsLoading,
  uploadFolderPath,
  uploadFolderId,
  onUploadFolderHome,
  onUploadFolderBack,
  onUploadFolderClick,
  onUploadCrumbClick,
}: FolderSelectionProps) {
  return (
    <div className="space-y-3 w-full">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Upload Location</h4>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onShowCreateFolder}
            className="text-xs"
          >
            <FolderPlus className="w-3 h-3 mr-1" />
            New Folder
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onToggleFolderSelector}
            className="text-xs"
          >
            <Folder className="w-3 h-3 mr-1" />
            {showFolderSelector ? "Hide" : "Browse"}
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2 text-sm bg-gray-50 px-3 py-2 rounded-md">
        <Home className="w-4 h-4 text-gray-500" />
        <span className="text-gray-600">→</span>
        <span className="font-medium text-gray-900">{currentFolderName}</span>
      </div>

      {/* Folder Browser - Simplified */}
      {showFolderSelector && (
        <FolderBrowser
          documents={uploadDocuments || []}
          isLoading={uploadDocumentsLoading}
          folderPath={uploadFolderPath}
          onHome={onUploadFolderHome}
          onBack={onUploadFolderBack}
          onFolderClick={onUploadFolderClick}
          onCrumbClick={onUploadCrumbClick}
          showBackButton={!!uploadFolderId}
        />
      )}
    </div>
  );
}
