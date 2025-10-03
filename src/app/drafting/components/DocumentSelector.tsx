"use client";

import React, { useState, useEffect } from "react";
import { useDocuments, DocumentItem } from "@/hooks/use-documents";
import { useFetchFileContent } from "@/hooks/use-media";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Folder, 
  ChevronRight, 
  Home, 
  Search, 
  Upload,
  Loader2,
  X
} from "lucide-react";
import { getCookie as getCookieUtil } from "@/lib/utils";

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
  onOpenChange
}: DocumentSelectorProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = open !== undefined ? open : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<FolderPath[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const { data: documents, isLoading: documentsLoading } = useDocuments(workspaceId, currentFolderId);
  const fetchFileContent = useFetchFileContent();
  const { showToast } = useToast();

  // Get workspace ID from cookie
  useEffect(() => {
    const id = typeof window !== "undefined" ? getCookieUtil("workspaceId") : null;
    setWorkspaceId(id);
  }, []);

  // Filter documents based on search term
  const filteredDocuments = documents?.filter((doc) =>
    doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleFolderClick = (folder: DocumentItem) => {
    setFolderPath((prev) => [
      ...prev,
      { id: folder.id, name: folder.filename },
    ]);
    setCurrentFolderId(folder.id);
    setSearchTerm(""); // Clear search when navigating
  };

  const handleBackClick = () => {
    const newPath = [...folderPath];
    newPath.pop();
    setFolderPath(newPath);
    const newFolderId = newPath.length > 0 ? newPath[newPath.length - 1].id : null;
    setCurrentFolderId(newFolderId);
    setSearchTerm(""); // Clear search when navigating
  };

  const handleHomeClick = () => {
    setFolderPath([]);
    setCurrentFolderId(null);
    setSearchTerm(""); // Clear search when navigating
  };

  const handleDocumentSelect = async (document: DocumentItem) => {
    if (document.type !== "file") return;

    setIsLoading(true);
    try {
      // Get the file content using the signed URL
      const filePath = document.filePath || document.filename;
      const blob = await fetchFileContent.mutateAsync({
        filePath: filePath,
      });

      // Create a File object from the blob
      const file = new File([blob], document.filename, {
        type: blob.type || "application/octet-stream",
      });

      // Call the parent callback
      onDocumentSelect(file, document);
      
      // Close the modal
      setIsOpen(false);
      setSelectedDocuments(new Set());
      setSearchTerm("");
      
      showToast(`Document "${document.filename}" imported successfully`, "success");
    } catch (error) {
      console.error("Error importing document:", error);
      showToast("Failed to import document", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentToggle = (documentId: string) => {
    setSelectedDocuments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  };

  const handleImportSelected = async () => {
    if (selectedDocuments.size === 0) return;

    setIsLoading(true);
    try {
      const selectedDocs = filteredDocuments.filter((doc) => 
        doc.type === "file" && selectedDocuments.has(doc.id)
      );

      for (const document of selectedDocs) {
        const filePath = document.filePath || document.filename;
        const blob = await fetchFileContent.mutateAsync({
          filePath: filePath,
        });

        const file = new File([blob], document.filename, {
          type: blob.type || "application/octet-stream",
        });

        onDocumentSelect(file, document);
      }

      setIsOpen(false);
      setSelectedDocuments(new Set());
      setSearchTerm("");
      
      showToast(`${selectedDocs.length} document(s) imported successfully`, "success");
    } catch (error) {
      console.error("Error importing documents:", error);
      showToast("Failed to import documents", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const defaultTrigger = (
    <Button 
      variant={buttonStyle === "black" ? "default" : "outline"} 
      disabled={disabled}
      className={buttonStyle === "black" ? "bg-black text-white hover:bg-zinc-800" : ""}
    >
      <Upload className="w-4 h-4 mr-2" />
      Import from Documents
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Documents from DataHub</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col space-y-4">
          {/* Search and Controls */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {selectedDocuments.size > 0 && (
              <Button onClick={handleImportSelected} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Import Selected ({selectedDocuments.size})
              </Button>
            )}
          </div>

          {/* Breadcrumb Navigation */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <button
              onClick={handleHomeClick}
              className="flex items-center space-x-1 hover:text-gray-800"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
            {folderPath.map((folder, index) => (
              <React.Fragment key={folder.id}>
                <ChevronRight className="w-4 h-4" />
                <button
                  onClick={() => {
                    const newPath = folderPath.slice(0, index + 1);
                    setFolderPath(newPath);
                    setCurrentFolderId(folder.id);
                    setSearchTerm("");
                  }}
                  className="hover:text-gray-800"
                >
                  {folder.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Documents List */}
          <ScrollArea className="flex-1 border rounded-md">
            <div className="p-4">
              {documentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading documents...</span>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? "No documents found matching your search." : "No documents in this folder."}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDocuments.map((document) => (
                    <div
                      key={document.id}
                      className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer ${
                        selectedDocuments.has(document.id) ? "bg-blue-50 border-blue-200" : ""
                      }`}
                      onClick={() => {
                        if (document.type === "folder") {
                          handleFolderClick(document);
                        } else {
                          handleDocumentToggle(document.id);
                        }
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        {document.type === "folder" ? (
                          <Folder className="w-5 h-5 text-blue-500" />
                        ) : (
                          <FileText className="w-5 h-5 text-gray-500" />
                        )}
                        <div>
                          <div className="font-medium">{document.filename}</div>
                          {document.user && (
                            <div className="text-sm text-gray-500">
                              by {document.user.name} • {new Date(document.createdAt || "").toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {document.type === "file" && (
                          <Badge variant="secondary" className="text-xs">
                            {document.filename.split('.').pop()?.toUpperCase()}
                          </Badge>
                        )}
                        {document.type === "file" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDocumentSelect(document);
                            }}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Import"
                            )}
                          </Button>
                        )}
                        {document.type === "folder" && (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
