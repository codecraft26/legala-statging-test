"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Folder,
  ChevronRight,
} from "lucide-react";
import { getCookie as getCookieUtil } from "@/lib/utils";
import { Api } from "@/lib/api-client";
import DragDropArea from "./DragDropArea";
import SelectedFilesList from "./SelectedFilesList";
import DocumentsImportModal, { DocumentItem } from "./DocumentsImportModal";

interface FileUploadProps {
  files: { file: File }[];
  setFiles: (v: { file: File }[]) => void;
  onNext: () => void;
  selectedDocumentIds: string[];
  onSelectedDocumentsChange: (ids: string[]) => void;
  onSuggestedNameChange?: (name: string) => void;
}

// DocumentItem type imported from DocumentsImportModal

export default function FileUpload({
  files,
  setFiles,
  onNext,
  selectedDocumentIds,
  onSelectedDocumentsChange,
  onSuggestedNameChange,
}: FileUploadProps) {
  const currentWorkspace = React.useMemo(() => {
    const id = typeof window !== "undefined" ? getCookieUtil("workspaceId") : null;
    if (!id) return undefined as any;
    return { id, name: "Workspace" } as any;
  }, []);
  const [isDragging, setIsDragging] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentFiles, setDocumentFiles] = useState<DocumentItem[]>([]);
  // selection moved to parent
  const [isFetchingDocuments, setIsFetchingDocuments] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>(
    []
  );

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFilesAdded(droppedFiles);
  };

  // File Upload Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    handleFilesAdded(newFiles);
  };

  const handleFilesAdded = (selectedFiles: File[]) => {
    const newFilesWithUrls = selectedFiles.map((file) => ({ file }));
    setFiles([...files, ...newFilesWithUrls]);
  };

  const fetchDocumentFiles = async (folderId: string | null = null) => {
    if (!currentWorkspace?.id) return;

    setIsFetchingDocuments(true);
    try {
      const query: string[] = [
        `workspaceId=${encodeURIComponent(currentWorkspace.id)}`,
      ];
      if (folderId) {
        // Send both to be compatible with different backends expecting either param
        const enc = encodeURIComponent(folderId);
        query.push(`parentId=${enc}`);
        query.push(`folderId=${enc}`);
      }
      const res = await Api.get<any>(
        `/document?${query.join("&")}`,
        "no-store"
      );
      const rawList: any[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];
      const documents: DocumentItem[] = rawList.map((d: any) => ({
        id: String(d?.id ?? ""),
        type:
          String(d?.type ?? "file").toLowerCase() === "folder"
            ? "folder"
            : "file",
        filename: String(d?.name ?? d?.filename ?? ""),
        s3_key_original: d?.s3_key_original,
      }));
      setDocumentFiles(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      setDocumentFiles([]);
    } finally {
      setIsFetchingDocuments(false);
    }
  };

  const openDocumentModal = async () => {
    setCurrentFolderId(null);
    setFolderPath([]);
    await fetchDocumentFiles();
    setShowDocumentModal(true);
  };

  const handleFolderClick = async (folder: DocumentItem) => {
    setFolderPath((prev) => [
      ...prev,
      { id: folder.id, name: folder.filename },
    ]);
    setCurrentFolderId(folder.id);
    await fetchDocumentFiles(folder.id);
  };

  const handleBackClick = async () => {
    const newPath = [...folderPath];
    newPath.pop();
    setFolderPath(newPath);

    const parentFolderId =
      newPath.length > 0 ? newPath[newPath.length - 1].id : null;
    setCurrentFolderId(parentFolderId);
    await fetchDocumentFiles(parentFolderId);
  };

  const handleBreadcrumbClick = async (index: number) => {
    const newPath = folderPath.slice(0, index + 1);
    setFolderPath(newPath);

    const targetFolderId = index === -1 ? null : newPath[index].id;
    setCurrentFolderId(targetFolderId);
    await fetchDocumentFiles(targetFolderId);
  };

  const importDocuments = async () => {
    if (selectedDocumentIds.length === 0) return;
    try {
      setIsImporting(true);
      // No download; let parent submit document IDs directly
      setShowDocumentModal(false);
      // Suggest a name from selected documents
      const selected = documentFiles.filter(
        (i) => i.type === "file" && selectedDocumentIds.includes(i.id)
      );
      if (selected.length > 0) {
        const first = selected[0].filename;
        const base = first.replace(/\.[^/.]+$/, "");
        const suggestion =
          selected.length === 1 ? base : `${base} + ${selected.length - 1} more`;
        onSuggestedNameChange && onSuggestedNameChange(suggestion);
      }
    } catch (error) {
      console.error("Error confirming document selection:", error);
    } finally {
      setIsImporting(false);
    }
  };

  // File Management
  const removeFile = (index: number) => {
    const updated = [...files];
    updated.splice(index, 1);
    setFiles(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header and description */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Upload Your Documents
        </h2>
        <p className="text-gray-500">
          Select or drag and drop your files to get started
        </p>
      </div>

      {/* Upload and Import buttons */}
      <div className="flex space-x-4">
        {/* Drag and Drop Upload Area */}
        <DragDropArea
          isDragging={isDragging}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onFileChange={handleFileUpload}
        />

        {/* Import from Documents Button */}
        <Button
          onClick={openDocumentModal}
          variant="outline"
          className="flex items-center justify-center px-6 py-4 h-auto flex-1"
        >
          <Folder className="w-5 h-5 mr-2" />
          Import from Documents
        </Button>
      </div>

      {/* Selected Files List */}
      <SelectedFilesList files={files} onRemove={removeFile} />

      {/* Documents Modal */}
      <DocumentsImportModal
        open={showDocumentModal}
        onClose={() => {
          setShowDocumentModal(false);
          onSelectedDocumentsChange([]);
          setCurrentFolderId(null);
          setFolderPath([]);
        }}
        isFetching={isFetchingDocuments}
        isImporting={isImporting}
        folderPath={folderPath}
        items={documentFiles}
        selectedIds={selectedDocumentIds}
        onBack={handleBackClick}
        onCrumbClick={handleBreadcrumbClick}
        onFolderClick={handleFolderClick}
        onToggleSelect={(id) => {
          const next = selectedDocumentIds.includes(id)
            ? selectedDocumentIds.filter((x) => x !== id)
            : [...selectedDocumentIds, id];
          onSelectedDocumentsChange(next);
          // Update suggestion live while selecting
          const selected = documentFiles.filter(
            (i) => i.type === "file" && next.includes(i.id)
          );
          if (selected.length > 0) {
            const first = selected[0].filename;
            const base = first.replace(/\.[^/.]+$/, "");
            const suggestion =
              selected.length === 1 ? base : `${base} + ${selected.length - 1} more`;
            onSuggestedNameChange && onSuggestedNameChange(suggestion);
          } else {
            onSuggestedNameChange && onSuggestedNameChange("");
          }
        }}
        onImport={importDocuments}
      />

      {/* Continue Button */}
      <div className="flex justify-between items-center pt-4">
        <div className="text-sm text-gray-500">
          {(files.length > 0 || selectedDocumentIds.length > 0) && (
            <span>
              {files.length > 0
                ? `${files.length} file${files.length !== 1 ? "s" : ""}`
                : (() => {
                    const selected = documentFiles.filter(
                      (i) => i.type === "file" && selectedDocumentIds.includes(i.id)
                    );
                    if (selected.length === 0) return "";
                    const first = selected[0].filename;
                    return selected.length === 1
                      ? first
                      : `${first} + ${selected.length - 1} more`;
                  })()}
            </span>
          )}
        </div>
        <Button onClick={onNext} disabled={files.length === 0 && selectedDocumentIds.length === 0}>
          Continue
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
