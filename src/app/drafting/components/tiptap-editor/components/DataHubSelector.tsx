"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Folder, FileText, Search } from "lucide-react";
import { VariableDef } from "./VariablesPanel";
import { Api } from "@/lib/api-client";

type Workspace = {
  id: number;
  name: string;
};

type Document = {
  id: number;
  filename: string;
  s3_key_original: string;
  folder_id?: number;
  content?: string;
  variables?: VariableDef[];
  type?: "file" | "folder";
};

type Folder = {
  id: number;
  name: string;
  parent_id?: number;
};

type Props = {
  onApply: (html: string, variables: VariableDef[], title: string) => void;
};

export default function DataHubSelector({ onApply }: Props) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [availableDocuments, setAvailableDocuments] = useState<Document[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    null
  );
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [folderPath, setFolderPath] = useState<Folder[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState<boolean>(false);
  const [isDocumentOpen, setIsDocumentOpen] = useState<boolean>(false);
  const [showDataHub, setShowDataHub] = useState<boolean>(false);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState<boolean>(false);
  const [loadingDocuments, setLoadingDocuments] = useState<boolean>(false);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<HTMLDivElement>(null);

  // Fetch workspaces from API
  const fetchWorkspaces = async () => {
    setLoadingWorkspaces(true);
    try {
      const workspacesData = await Api.get<Workspace[]>(
        "legal-api/get-workspaces"
      );
      setWorkspaces(workspacesData);

      // Auto-select default workspace or first workspace
      const defaultWorkspace =
        workspacesData.find((ws: any) => ws.is_default) || workspacesData[0];
      if (defaultWorkspace) {
        setSelectedWorkspace(defaultWorkspace);
        // Fetch documents for the selected workspace
        fetchDocuments(defaultWorkspace.id);
      }
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      setWorkspaces([]);
    } finally {
      setLoadingWorkspaces(false);
    }
  };

  // Fetch documents for a specific workspace
  const fetchDocuments = async (
    workspaceId: number,
    folderId: number | null = null
  ) => {
    setLoadingDocuments(true);
    try {
      const query: string[] = [
        `workspaceId=${encodeURIComponent(workspaceId)}`,
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
      const documents: Document[] = rawList.map((d: any) => ({
        id: Number(d?.id ?? 0),
        type:
          String(d?.type ?? "file").toLowerCase() === "folder"
            ? "folder"
            : "file",
        filename: String(d?.name ?? d?.filename ?? ""),
        s3_key_original: d?.s3_key_original,
      }));
      setAvailableDocuments(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      setAvailableDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Handle folder navigation
  const handleFolderClick = (folder: Document) => {
    if (folder.type === "folder") {
      setFolderPath((prev) => [
        ...prev,
        { id: folder.id, name: folder.filename },
      ]);
      setCurrentFolderId(folder.id);
      if (selectedWorkspace) {
        fetchDocuments(selectedWorkspace.id, folder.id);
      }
    }
  };

  // Handle back navigation
  const handleBackNavigation = () => {
    const newPath = [...folderPath];
    newPath.pop();
    setFolderPath(newPath);
    const newFolderId =
      newPath.length > 0 ? newPath[newPath.length - 1].id : null;
    setCurrentFolderId(newFolderId);
    if (selectedWorkspace) {
      fetchDocuments(selectedWorkspace.id, newFolderId);
    }
  };

  // Load workspaces when DataHub is shown
  useEffect(() => {
    if (showDataHub && workspaces.length === 0) {
      fetchWorkspaces();
    }
  }, [showDataHub, workspaces.length]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        workspaceRef.current &&
        !workspaceRef.current.contains(event.target as Node)
      ) {
        setIsWorkspaceOpen(false);
      }
      if (
        documentRef.current &&
        !documentRef.current.contains(event.target as Node)
      ) {
        setIsDocumentOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Get filtered documents based on search term
  const getFilteredDocuments = (): Document[] => {
    if (!searchTerm) return availableDocuments;

    return availableDocuments.filter((doc) =>
      doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleWorkspaceSelect = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setIsWorkspaceOpen(false);
    setCurrentFolderId(null);
    setFolderPath([]);
    setSelectedDocument(null);
    fetchDocuments(workspace.id);

    // Refresh the page when workspace is switched
    window.location.reload();
  };

  const handleDocumentSelect = async (document: Document) => {
    if (document.type === "folder") {
      handleFolderClick(document);
      return;
    }

    setSelectedDocument(document);
    setIsDocumentOpen(false);

    try {
      // Document application started

      // Fetch the actual file content
      let fileBlob: Blob;

      // Check if s3_key_original is available
      if (!document.s3_key_original) {
        throw new Error(
          `Document "${document.filename}" cannot be downloaded - missing storage reference. Please re-upload this document.`
        );
      }

      try {
        const response = await Api.get<{ url: string }>(
          `/get-signed-url?key=${encodeURIComponent(document.s3_key_original)}`
        );
        const signedUrl = response.url;
        const fileResponse = await fetch(signedUrl);

        if (!fileResponse.ok) {
          throw new Error(
            `Failed to fetch document "${document.filename}": ${fileResponse.statusText}`
          );
        }
        fileBlob = await fileResponse.blob();
      } catch (signedUrlError) {
        console.error("Failed to download document:", signedUrlError);
        throw new Error(
          `Cannot download document "${document.filename}". Please try again or contact support.`
        );
      }
      let htmlContent = "";

      if (document.filename.toLowerCase().endsWith(".docx")) {
        const arrayBuffer = await fileBlob.arrayBuffer();
        const mammoth = (await import("mammoth")) as any;
        const result = await mammoth.convertToHtml({ arrayBuffer });
        htmlContent = result.value;
      } else {
        // For non-DOCX files, treat as plain text
        htmlContent = await fileBlob.text();
      }

      // Document content fetched successfully

      // Create basic variables for the document (in a real app, this might come from metadata)
      const basicVariables: VariableDef[] = [
        { unique_id: "document_title", label: "Document Title", type: "text" },
        { unique_id: "date", label: "Date", type: "date" },
        { unique_id: "party_1", label: "First Party", type: "text" },
        { unique_id: "party_2", label: "Second Party", type: "text" },
      ];

      // Applying document to editor
      onApply(htmlContent, basicVariables, document.filename);
    } catch (error) {
      console.error("Error loading document from DataHub:", error);
      alert(
        `Failed to load document: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">Select from Data Hub</label>
        <button
          onClick={() => setShowDataHub(!showDataHub)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
          disabled={loadingWorkspaces || loadingDocuments}
        >
          {showDataHub ? "Hide" : "Show"}
          <ChevronDown
            size={12}
            className={`transition-transform ${
              showDataHub ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {showDataHub && (
        <div className="space-y-3">
          {/* Workspace selector hidden on drafting page; auto-selects in background */}

          {/* Document Selector */}
          {selectedWorkspace && (
            <div className="relative" ref={documentRef}>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Document
              </label>

              {/* Search Input */}
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                onClick={() => setIsDocumentOpen(!isDocumentOpen)}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-left shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm truncate">
                      {selectedDocument?.filename || "Select from Datahub"}
                      {folderPath.length > 0 &&
                        ` (in ${folderPath.map((f) => f.name).join("/")})`}
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform ${
                      isDocumentOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {isDocumentOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {/* Folder Navigation */}
                  {folderPath.length > 0 && (
                    <button
                      onClick={handleBackNavigation}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-sm border-b border-gray-100 font-medium text-blue-600"
                    >
                      ← Back to{" "}
                      {folderPath.length > 1
                        ? folderPath[folderPath.length - 2].name
                        : "Root"}
                    </button>
                  )}

                  {/* Loading State */}
                  {loadingDocuments ? (
                    <div className="px-3 py-2 text-sm text-gray-500 text-center">
                      Loading documents...
                    </div>
                  ) : getFilteredDocuments().length > 0 ? (
                    getFilteredDocuments().map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => handleDocumentSelect(doc)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-sm border-b border-gray-100 last:border-b-0 flex items-center space-x-2"
                      >
                        {doc.type === "folder" ? (
                          <Folder className="w-4 h-4 text-blue-500" />
                        ) : (
                          <FileText className="w-4 h-4 text-gray-500" />
                        )}
                        <span className="truncate">{doc.filename}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500 text-center">
                      {searchTerm
                        ? "No documents match your search"
                        : "No documents found"}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
