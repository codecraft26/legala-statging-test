"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DocumentItem } from "@/hooks/use-documents";
import FolderSelection from "./FolderSelection";
import DocumentUploadArea from "./DocumentUploadArea";
import CreateFolderModal from "./CreateFolderModal";

interface FolderPath {
  id: string;
  name: string;
}

interface UploadTabProps {
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
  isDragOver: boolean;
  isLoading: boolean;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onFileSelect: (files: FileList | null) => void;
  showCreateFolder: boolean;
  newFolderName: string;
  onNewFolderNameChange: (name: string) => void;
  onCloseCreateFolder: () => void;
  onCreateFolder: () => void;
  isCreatingFolder: boolean;
}

export default function UploadTab({
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
  isDragOver,
  isLoading,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  showCreateFolder,
  newFolderName,
  onNewFolderNameChange,
  onCloseCreateFolder,
  onCreateFolder,
  isCreatingFolder,
}: UploadTabProps) {
  return (
    <>
      {/* Upload Tab Content - Scrollable */}
      <ScrollArea className="flex-1 min-h-0 w-full">
        <div className="p-4 space-y-6">
          {/* Folder Selection - Simplified */}
          <FolderSelection
            showFolderSelector={showFolderSelector}
            onToggleFolderSelector={onToggleFolderSelector}
            onShowCreateFolder={onShowCreateFolder}
            currentFolderName={currentFolderName}
            uploadDocuments={uploadDocuments}
            uploadDocumentsLoading={uploadDocumentsLoading}
            uploadFolderPath={uploadFolderPath}
            uploadFolderId={uploadFolderId}
            onUploadFolderHome={onUploadFolderHome}
            onUploadFolderBack={onUploadFolderBack}
            onUploadFolderClick={onUploadFolderClick}
            onUploadCrumbClick={onUploadCrumbClick}
          />

          {/* Upload Area - Compact */}
          <DocumentUploadArea
            isDragOver={isDragOver}
            isLoading={isLoading}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onFileSelect={onFileSelect}
          />
        </div>
      </ScrollArea>

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={showCreateFolder}
        newFolderName={newFolderName}
        onNameChange={onNewFolderNameChange}
        onClose={onCloseCreateFolder}
        onCreate={onCreateFolder}
        isCreating={isCreatingFolder}
        currentFolderName={currentFolderName}
      />
    </>
  );
}
