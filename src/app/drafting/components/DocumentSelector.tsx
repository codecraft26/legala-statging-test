"use client";

import React, { useState, useEffect } from "react";
import {
  useDocuments,
  DocumentItem,
  useUploadDocuments,
  useCreateFolder,
} from "@/hooks/use-documents";
import { useFetchFileContent } from "@/hooks/use-media";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Database } from "lucide-react";
import { getCookie as getCookieUtil } from "@/lib/utils";
import TabNavigation from "./TabNavigation";
import ImportTab from "./ImportTab";
import UploadTab from "./UploadTab";

interface DocumentSelectorProps {
  onDocumentSelect: (file: File, documentInfo: DocumentItem) => void;
  trigger?: React.ReactNode;
  disabled?: boolean;
  buttonStyle?: "default" | "black";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface FolderPath {
  id: string;
  name: string;
}

export default function DocumentSelector({
  onDocumentSelect,
  trigger,
  disabled = false,
  buttonStyle = "default",
  open,
  onOpenChange,
}: DocumentSelectorProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = open !== undefined ? open : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<FolderPath[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingDocumentId, setLoadingDocumentId] = useState<string | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"import" | "upload">("import");
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadFolderId, setUploadFolderId] = useState<string | null>(null);
  const [uploadFolderPath, setUploadFolderPath] = useState<FolderPath[]>([]);
  const [showFolderSelector, setShowFolderSelector] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const { data: documents, isLoading: documentsLoading } = useDocuments(
    workspaceId,
    currentFolderId
  );
  const { data: uploadDocuments, isLoading: uploadDocumentsLoading } =
    useDocuments(workspaceId, uploadFolderId);
  const fetchFileContent = useFetchFileContent();
  const uploadMutation = useUploadDocuments();
  const createFolderMutation = useCreateFolder();
  const { showToast } = useToast();

  // Get workspace ID from cookie
  useEffect(() => {
    const id =
      typeof window !== "undefined" ? getCookieUtil("workspaceId") : null;
    setWorkspaceId(id);
  }, []);

  // Filter documents based on search term
  const filteredDocuments =
    documents?.filter((doc) =>
      doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const handleFolderClick = (folder: DocumentItem) => {
    setFolderPath((prev) => {
      // Check if folder is already in path to prevent duplicates
      const isAlreadyInPath = prev.some((f) => f.id === folder.id);
      if (isAlreadyInPath) {
        return prev;
      }
      return [...prev, { id: folder.id, name: folder.filename }];
    });
    setCurrentFolderId(folder.id);
    setSearchTerm(""); // Clear search when navigating
  };

  const handleBackClick = () => {
    const newPath = [...folderPath];
    newPath.pop();
    setFolderPath(newPath);
    const newFolderId =
      newPath.length > 0 ? newPath[newPath.length - 1].id : null;
    setCurrentFolderId(newFolderId);
    setSearchTerm(""); // Clear search when navigating
  };

  const handleHomeClick = () => {
    setFolderPath([]);
    setCurrentFolderId(null);
    setSearchTerm(""); // Clear search when navigating
  };

  const handleCrumbClick = (index: number) => {
    const newPath = folderPath.slice(0, index + 1);
    setFolderPath(newPath);
    setCurrentFolderId(folderPath[index].id);
    setSearchTerm("");
  };

  const handleDocumentSelect = async (document: DocumentItem) => {
    if (document.type !== "file") return;

    setLoadingDocumentId(document.id);
    try {
      const filePath = document.filePath || document.filename;
      const blob = await fetchFileContent.mutateAsync({ filePath });
      const file = new File([blob], document.filename, {
        type: blob.type || "application/octet-stream",
      });

      onDocumentSelect(file, document);
      setIsOpen(false);
      setSearchTerm("");
      showToast(
        `Document "${document.filename}" imported successfully`,
        "success"
      );
    } catch (error) {
      console.error("Error importing document:", error);
      showToast("Failed to import document", "error");
    } finally {
      setLoadingDocumentId(null);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !workspaceId) return;

    const fileCount = files.length;

    setIsUploading(true);
    try {
      const filesArray = Array.from(files);
      await uploadMutation.mutateAsync({
        files: filesArray,
        workspaceId: workspaceId,
        parentId: uploadFolderId,
      });

      const folderName =
        uploadFolderPath.length > 0
          ? uploadFolderPath[uploadFolderPath.length - 1].name
          : "Root";

      showToast(
        `${fileCount} file(s) uploaded successfully to ${folderName}`,
        "success"
      );
      setIsOpen(false);
    } catch (error) {
      console.error("Error uploading files:", error);
      showToast("Failed to upload files", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  // Folder selection for upload
  const handleUploadFolderClick = (folder: DocumentItem) => {
    setUploadFolderPath((prev) => {
      const isAlreadyInPath = prev.some((f) => f.id === folder.id);
      if (isAlreadyInPath) return prev;
      return [...prev, { id: folder.id, name: folder.filename }];
    });
    setUploadFolderId(folder.id);
  };

  const handleUploadFolderBack = () => {
    const newPath = [...uploadFolderPath];
    newPath.pop();
    setUploadFolderPath(newPath);
    setUploadFolderId(
      newPath.length > 0 ? newPath[newPath.length - 1].id : null
    );
  };

  const handleUploadFolderHome = () => {
    setUploadFolderPath([]);
    setUploadFolderId(null);
  };

  const handleUploadCrumbClick = (index: number) => {
    const newPath = uploadFolderPath.slice(0, index + 1);
    setUploadFolderPath(newPath);
    setUploadFolderId(uploadFolderPath[index].id);
  };

  const getCurrentUploadFolderName = () => {
    return uploadFolderPath.length === 0
      ? "Root"
      : uploadFolderPath[uploadFolderPath.length - 1].name;
  };

  const handleCreateFolder = async () => {
    if (!workspaceId || !newFolderName.trim()) return;

    try {
      await createFolderMutation.mutateAsync({
        name: newFolderName.trim(),
        workspaceId: workspaceId,
        parentId: uploadFolderId,
      });

      setNewFolderName("");
      setShowCreateFolder(false);
      showToast(
        `Folder "${newFolderName.trim()}" created successfully`,
        "success"
      );
    } catch (error) {
      console.error("Error creating folder:", error);
      showToast("Failed to create folder", "error");
    }
  };

  const handleCloseCreateFolder = () => {
    setShowCreateFolder(false);
    setNewFolderName("");
  };

  const defaultTrigger = (
    <Button
      variant={buttonStyle === "black" ? "default" : "outline"}
      disabled={disabled}
      className={
        buttonStyle === "black" ? "bg-black text-white hover:bg-zinc-800" : ""
      }
    >
      <Database className="w-4 h-4 mr-2" />
      DataHub
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent
        className="max-w-none w-[100vw] h-[95vh] flex flex-col overflow-hidden"
        style={{
          margin: "2.5vh auto",
          maxWidth: "none !important",
          width: "100vw !important",
          height: "95vh !important",
        }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>DataHub - Import & Upload Documents</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 flex flex-col space-y-4 overflow-hidden w-full">
          {activeTab === "import" ? (
            <ImportTab
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              loadingDocumentId={loadingDocumentId}
              documentsLoading={documentsLoading}
              filteredDocuments={filteredDocuments}
              folderPath={folderPath}
              onHomeClick={handleHomeClick}
              onCrumbClick={handleCrumbClick}
              onFolderClick={handleFolderClick}
              onDocumentSelect={handleDocumentSelect}
            />
          ) : (
            <UploadTab
              showFolderSelector={showFolderSelector}
              onToggleFolderSelector={() =>
                setShowFolderSelector(!showFolderSelector)
              }
              onShowCreateFolder={() => setShowCreateFolder(true)}
              currentFolderName={getCurrentUploadFolderName()}
              uploadDocuments={uploadDocuments || []}
              uploadDocumentsLoading={uploadDocumentsLoading}
              uploadFolderPath={uploadFolderPath}
              uploadFolderId={uploadFolderId}
              onUploadFolderHome={handleUploadFolderHome}
              onUploadFolderBack={handleUploadFolderBack}
              onUploadFolderClick={handleUploadFolderClick}
              onUploadCrumbClick={handleUploadCrumbClick}
              isDragOver={isDragOver}
              isLoading={isUploading}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onFileSelect={handleUpload}
              showCreateFolder={showCreateFolder}
              newFolderName={newFolderName}
              onNewFolderNameChange={setNewFolderName}
              onCloseCreateFolder={handleCloseCreateFolder}
              onCreateFolder={handleCreateFolder}
              isCreatingFolder={createFolderMutation.isPending}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
