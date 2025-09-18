"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Upload,
  X,
  FileText,
  Plus,
  Folder,
  Loader2,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Api } from "@/lib/api-client";

interface FileUploadProps {
  files: { file: File }[];
  setFiles: (v: { file: File }[]) => void;
  onNext: () => void;
}

interface DocumentItem {
  id: string;
  filename: string;
  type: "file" | "folder";
  s3_key_original?: string;
}

export default function FileUpload({
  files,
  setFiles,
  onNext,
}: FileUploadProps) {
  const { currentWorkspace } = useSelector((s: RootState) => s.auth);
  const [isDragging, setIsDragging] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentFiles, setDocumentFiles] = useState<DocumentItem[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
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
    if (selectedDocuments.length === 0) return;

    try {
      setIsImporting(true);
      const documentsToImport = documentFiles.filter(
        (item) => item.type === "file" && selectedDocuments.includes(item.id)
      );

      const importedFiles = await Promise.all(
        documentsToImport.map(async (doc) => {
          let blob: Blob;

          // Check if s3_key_original is available
          if (!doc.s3_key_original) {
            throw new Error(
              `Document "${doc.filename}" cannot be downloaded - missing storage reference. Please re-upload this document.`
            );
          }

          try {
            const response = await Api.get<{ url: string }>(
              `/get-signed-url?key=${encodeURIComponent(doc.s3_key_original)}`
            );
            const signedUrl = response.url;
            const fileResponse = await fetch(signedUrl);
            if (!fileResponse.ok) {
              throw new Error(
                `Failed to fetch document "${doc.filename}": ${fileResponse.statusText}`
              );
            }
            blob = await fileResponse.blob();
          } catch (signedUrlError) {
            console.error("Failed to download document:", signedUrlError);
            throw new Error(
              `Cannot download document "${doc.filename}". Please try again or contact support.`
            );
          }

          const file = new File([blob], doc.filename, {
            type: blob.type || "application/octet-stream",
          });

          return file;
        })
      );

      handleFilesAdded(importedFiles);
      setShowDocumentModal(false);
      setSelectedDocuments([]);
    } catch (error) {
      console.error("Error importing documents:", error);
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
        <div
          className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-200 flex-1 ${
            isDragging
              ? "border-blue-400 bg-blue-50"
              : "border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept=".pdf,.doc,.docx,.txt,.xlsx,.xls"
          />
          <div className="flex flex-col items-center justify-center text-center">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                isDragging ? "bg-blue-100" : "bg-white"
              }`}
            >
              <Upload
                className={`w-8 h-8 ${
                  isDragging ? "text-blue-500" : "text-gray-400"
                }`}
              />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">
                {isDragging
                  ? "Drop your files here"
                  : "Choose files or drag & drop"}
              </h3>
              <p className="text-sm text-gray-500">
                Supports PDF, DOC, DOCX, TXT, XLS, XLSX up to 10MB each
              </p>
            </div>
            <Button type="button" variant="outline" className="mt-6">
              <Plus className="w-4 h-4 mr-2" />
              Browse Files
            </Button>
          </div>
        </div>

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
      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-900">
            Selected Files ({files.length})
          </h3>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="group flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => removeFile(index)}
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {showDocumentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Select Files from Documents
              </h3>
              <Button
                onClick={() => {
                  setShowDocumentModal(false);
                  setSelectedDocuments([]);
                  setCurrentFolderId(null);
                  setFolderPath([]);
                }}
                variant="ghost"
                size="sm"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center space-x-2 mb-4 text-sm text-gray-600">
              <Button
                onClick={() => handleBreadcrumbClick(-1)}
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
                    onClick={() => handleBreadcrumbClick(index)}
                    variant="ghost"
                    size="sm"
                    className="p-0 h-auto hover:text-blue-600"
                  >
                    {folder.name}
                  </Button>
                </React.Fragment>
              ))}
            </div>

            {/* Back Button */}
            {folderPath.length > 0 && (
              <Button
                onClick={handleBackClick}
                variant="ghost"
                size="sm"
                className="mb-4 text-blue-600 hover:text-blue-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}

            {isFetchingDocuments ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {documentFiles.length > 0 ? (
                  documentFiles.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center p-3 rounded-lg cursor-pointer ${
                        item.type === "file" &&
                        selectedDocuments.includes(item.id)
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        if (item.type === "folder") {
                          handleFolderClick(item);
                        } else {
                          setSelectedDocuments((prev) =>
                            prev.includes(item.id)
                              ? prev.filter((id) => id !== item.id)
                              : [...prev, item.id]
                          );
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
                          checked={selectedDocuments.includes(item.id)}
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
              <Button
                onClick={() => {
                  setShowDocumentModal(false);
                  setSelectedDocuments([]);
                  setCurrentFolderId(null);
                  setFolderPath([]);
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={importDocuments}
                disabled={selectedDocuments.length === 0 || isImporting}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Importing...
                  </>
                ) : (
                  `Import Selected (${selectedDocuments.length})`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Continue Button */}
      <div className="flex justify-between items-center pt-4">
        <div className="text-sm text-gray-500">
          {files.length > 0 && (
            <span>
              {files.length} file{files.length !== 1 ? "s" : ""} selected
            </span>
          )}
        </div>
        <Button onClick={onNext} disabled={files.length === 0}>
          Continue
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
