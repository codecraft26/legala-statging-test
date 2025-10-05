"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Sparkles, 
  Loader2, 
  X, 
  File as FileIcon, 
  Search, 
  Folder, 
  ChevronDown,
  Send,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useRefineText } from "@/hooks/use-refine";
import { useDocuments, type DocumentItem } from "@/hooks/use-documents";
import { useDeleteDrafting, useUpdateDraft, useDraftFromDocuments } from "@/hooks/use-drafting";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getCookie as getCookieUtil } from "@/lib/utils";

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  editor: any;
  onSwitchToDraft?: (draftId: string) => Promise<void> | void;
}

export default function AIModal({ isOpen, onClose, editor, onSwitchToDraft }: AIModalProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [error, setError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  
  // Data hub related state
  const [showDataHub, setShowDataHub] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dataHubSelectedFiles, setDataHubSelectedFiles] = useState<any[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([]);
  
  // Get workspace ID from cookie
  const workspaceId = getCookieUtil("workspaceId");
  
  // Use the existing documents hook
  const { 
    data: availableDocuments = [], 
    isLoading: loadingDocuments 
  } = useDocuments(workspaceId, currentFolderId);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    mutateAsync: refineText,
    isPending: isRefining,
    error: refineError,
  } = useRefineText();

  // Track server-side draft lifecycle
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const { mutateAsync: deleteDraft } = useDeleteDrafting(workspaceId);
  const { mutateAsync: updateDraft } = useUpdateDraft(workspaceId);
  const { mutateAsync: draftFromDocuments } = useDraftFromDocuments(workspaceId);
  const queryClient = useQueryClient();

  const normalizeToHtml = (input: string): string => {
    const trimmed = (input || "").trim();
    if (!trimmed) return "<p></p>";
    // Heuristic: if it looks like HTML already, return as-is
    if (/[<][a-zA-Z!/]/.test(trimmed)) return trimmed;
    // Convert plaintext to paragraphs; double newlines split paragraphs, single newlines become <br/>
    const paragraphs = trimmed
      .split(/\n{2,}/)
      .map((block) => `<p>${block.replace(/\n/g, "<br/>")}</p>`)
      .join("");
    return paragraphs || "<p></p>";
  };

  // Quick prompts for quick selection
  const quickPrompts = [
    "Draft an NDA",
    "Create a project proposal",
    "Write a meeting agenda",
    "Generate a product requirements document",
    "Create a marketing brief",
    "Write a press release",
    "Draft a job description",
    "Create a project timeline",
    "Write a user story",
    "Generate a business plan outline",
  ];

  // Filter available documents by search term
  const filteredDataHubFiles = availableDocuments.filter(
    (file) =>
      !searchTerm ||
      (file.filename &&
        file.filename.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // No need for custom fetch functions - using the existing hooks

  // Handle folder navigation
  const handleFolderClick = (folder: DocumentItem) => {
    setFolderPath((prev) => [
      ...prev,
      { id: folder.id, name: folder.filename },
    ]);
    setCurrentFolderId(folder.id);
  };

  // Handle back navigation
  const handleBackNavigation = () => {
    const newPath = [...folderPath];
    newPath.pop();
    setFolderPath(newPath);
    const newFolderId =
      newPath.length > 0 ? newPath[newPath.length - 1].id : null;
    setCurrentFolderId(newFolderId);
  };

  // Handle data hub file selection
  const handleDataHubFileSelect = (file: DocumentItem) => {
    if (getAllFiles().length >= 2) return;

    const selected = {
      id: `datahub-${file.id}`,
      name: file.filename,
      isFromDataHub: true,
      originalFile: file,
    } as any;

    setDataHubSelectedFiles((prev) => [...prev, selected]);
    setSelectedFiles((prev) => [...prev, selected.id]);
  };

  const handleFileSelection = (id: string) => {
    setSelectedFiles((prev) => {
      if (prev.includes(id)) {
        return prev.filter((fileId) => fileId !== id);
      } else if (prev.length < 2) {
        return [...prev, id];
      }
      return prev;
    });
  };


  const removeFile = (id: string) => {
    setDataHubSelectedFiles((prev) => prev.filter((file) => file.id !== id));
    setSelectedFiles((prev) => prev.filter((fileId) => fileId !== id));
  };

  // Get all files (only data hub selected)
  const getAllFiles = () => [...dataHubSelectedFiles];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError("");
    setGeneratedContent("");
    setActiveDraftId(null);

    try {
      // Get data hub files to process
      const dataHubFilesToProcess = selectedFiles
        .map((id) => dataHubSelectedFiles.find((f) => f.id === id))
        .filter(Boolean);

      // If we have files, use the drafting API
      if (dataHubFilesToProcess.length > 0) {
        const documentIds = dataHubSelectedFiles
          .filter((f) => selectedFiles.includes(f.id))
          .map((f) => f.originalFile.id);

        const draftPayload = {
          documentId: documentIds,
          instruction: prompt,
          workspaceId: workspaceId,
        };

        const created = await draftFromDocuments(draftPayload as any);
        const createdId = created?.id;
        if (!createdId) {
          throw new Error("Invalid response: draft id missing");
        }
        setActiveDraftId(createdId);
        // list invalidation handled by hook

        // Poll detail until completed
        await new Promise<void>((resolve, reject) => {
          const start = Date.now();
          const timeoutMs = 2 * 60 * 1000; // 2 minutes
          const interval = setInterval(async () => {
            try {
              // use query client to fetch detail (deduped via cache)
              const data = await queryClient.fetchQuery({
                queryKey: ["drafting-detail", createdId],
                queryFn: async () => {
                  const base = (await import("@/lib/utils")).getApiBaseUrl();
                  const token = (await import("@/lib/utils")).getCookie("token") || "";
                  const res = await fetch(`${base}/drafting/detail?id=${encodeURIComponent(createdId)}`, {
                    headers: {
                      "Content-Type": "application/json",
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    cache: "no-store",
                  });
                  if (!res.ok) throw new Error(`HTTP ${res.status}`);
                  const json = await res.json();
                  return json?.data || json;
                },
                staleTime: 0,
              });
              const status = data?.status;
              if (status === "COMPLETED") {
                clearInterval(interval);
                setGeneratedContent(data?.content || "");
                // Refresh drafts list to reflect updated status/content
                if (workspaceId) {
                  queryClient.invalidateQueries({
                    queryKey: ["drafting", workspaceId],
                  });
                }
                resolve();
              } else if (status === "FAILED") {
                clearInterval(interval);
                reject(new Error(data?.error || "Drafting failed"));
              } else if (Date.now() - start > timeoutMs) {
                clearInterval(interval);
                reject(new Error("Drafting timed out"));
              }
            } catch (e) {
              clearInterval(interval);
              reject(e);
            }
          }, 2000);
        });
      } else {
        // Use the refine API for text-only generation
        const request = {
          text: "",
          instruction: prompt,
        };

        const result = await refineText(request);
        setGeneratedContent(result.refined_text || "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsertContent = async () => {
    if (!generatedContent || !editor) {
      return;
    }

    try {
      // Persist generated content to the same draft so it appears from the list
      if (activeDraftId) {
        const normalized = normalizeToHtml(generatedContent);
        await updateDraft({ id: activeDraftId, content: normalized });
        if (workspaceId) {
          queryClient.invalidateQueries({ queryKey: ["drafting", workspaceId] });
        }
        // Switch editor to that draft instead of inserting at cursor
        if (onSwitchToDraft) {
          await Promise.resolve(onSwitchToDraft(activeDraftId));
        }
      }
    } catch (_e) {
      // If update fails, still insert locally to not block the user
    }
    handleClose();
  };

  const handleClose = () => {
    setPrompt("");
    setGeneratedContent("");
    setError("");
    setSelectedFiles([]);
    setDataHubSelectedFiles([]);
    setShowDataHub(false);
    setSearchTerm("");
    setCurrentFolderId(null);
    setFolderPath([]);
    setIsGenerating(false);
    setActiveDraftId(null);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  // Auto-show data hub if documents are available
  useEffect(() => {
    if (
      isOpen &&
      availableDocuments.length > 0 &&
      !showDataHub
    ) {
      setShowDataHub(true);
    }
  }, [isOpen, availableDocuments.length, showDataHub]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const allFiles = getAllFiles();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] flex flex-col p-0">
        {/* Header */}
        <div className="px-4 py-3 border-b bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Ask AI
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-600 dark:text-gray-400">
                Generate content with AI assistance
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content - Two Column Layout */}
        <div className="flex-1 grid grid-cols-2 h-[500px]">
          {/* Left Column - Input */}
          <div className="p-4 space-y-3 overflow-y-auto border-r border-gray-200">
            {/* Data Hub Section */}
            {(availableDocuments.length > 0 || loadingDocuments) && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-700">
                    Data Hub
                  </label>
                  <button
                    onClick={() => setShowDataHub(!showDataHub)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                    disabled={loadingDocuments}
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
                  <div className="border border-gray-200 rounded-lg p-2 bg-gray-50 max-h-32 overflow-y-auto">
                    {/* Loading States */}
                    {loadingDocuments ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        <span className="text-xs text-gray-500">
                          Loading...
                        </span>
                      </div>
                    ) : (
                      <>
                        {/* Search */}
                        <div className="relative mb-2">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search files..."
                            className="w-full pl-7 pr-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {/* Breadcrumb Navigation */}
                        {folderPath.length > 0 && (
                          <div className="mb-2 text-xs text-gray-600">
                            <button
                              onClick={() => {
                                setFolderPath([]);
                                setCurrentFolderId(null);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Root
                            </button>
                            {folderPath.map((folder, index) => (
                              <span key={folder.id}>
                                <span className="mx-1">/</span>
                                <button
                                  onClick={() => {
                                    const newPath = folderPath.slice(0, index + 1);
                                    setFolderPath(newPath);
                                    setCurrentFolderId(folder.id);
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  {folder.name}
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Back Button */}
                        {folderPath.length > 0 && (
                          <button
                            onClick={handleBackNavigation}
                            className="w-full text-left p-1 hover:bg-gray-100 text-xs border-b border-gray-200 flex items-center mb-2"
                          >
                            <span className="mr-1">←</span> Back
                          </button>
                        )}

                        {/* File List */}
                        {filteredDataHubFiles.length === 0 ? (
                          <div className="text-center py-2 text-gray-500 text-xs">
                            {searchTerm
                              ? `No files found matching "${searchTerm}"`
                              : "No files available"}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            {filteredDataHubFiles.map((file, index) => (
                              <div
                                key={file.id || index}
                                className="flex items-center justify-between p-1.5 hover:bg-gray-100 rounded cursor-pointer text-xs"
                                onClick={() => {
                                  if (file.type === "folder") {
                                    handleFolderClick(file);
                                  } else if (allFiles.length < 2) {
                                    handleDataHubFileSelect(file);
                                  }
                                }}
                              >
                                <div className="flex items-center space-x-1.5 flex-1 truncate">
                                  {file.type === "folder" ? (
                                    <Folder className="w-3 h-3 text-yellow-600 flex-shrink-0" />
                                  ) : (
                                    <FileIcon className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                  )}
                                  <span className="truncate" title={file.filename}>
                                    {file.filename || "Unnamed file"}
                                  </span>
                                </div>
                                {file.type === "folder" ? (
                                  <span className="text-xs text-gray-400">📁</span>
                                ) : allFiles.length >= 2 ? (
                                  <span className="text-xs text-gray-400">Full</span>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}


            {/* File Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Selected Files
              </label>
              <div className="bg-gray-50 p-2 rounded-lg max-h-20 overflow-y-auto">
                {allFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-1.5 py-0.5 text-xs text-gray-700"
                  >
                    <input
                      type="checkbox"
                      value={file.id}
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => handleFileSelection(file.id)}
                      disabled={
                        !selectedFiles.includes(file.id) &&
                        selectedFiles.length >= 2
                      }
                      className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="truncate flex-1">
                      {file.name}
                      {file.isFromDataHub && (
                        <span className="text-blue-600 ml-1">(Hub)</span>
                      )}
                    </span>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {allFiles.length === 0 && (
                  <p className="text-xs text-gray-500">No files selected</p>
                )}
              </div>
            </div>

            {/* Prompt Input */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                What would you like me to write?
              </label>
              <Textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="E.g., Draft an NDA for a software company..."
                className="resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500 min-h-[80px] text-xs"
                rows={3}
                disabled={isGenerating || isRefining}
              />
              <p className="text-xs text-gray-500 mt-1">
                Press Cmd/Ctrl + Enter to generate
              </p>
            </div>

            {/* Quick Prompts */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Quick Prompts
              </label>
              <div className="bg-gray-100 p-2 rounded-lg space-y-0.5 max-h-20 overflow-y-auto">
                {quickPrompts.slice(0, 4).map((quickPrompt, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(quickPrompt)}
                    className="w-full text-left px-1.5 py-0.5 text-xs text-gray-700 hover:bg-gray-200 rounded transition-colors"
                  >
                    {quickPrompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <div className="mt-3">
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating || isRefining}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {isGenerating || isRefining ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Column - Generated Content */}
          <div className="p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-gray-700">
                Generated Content
              </label>
              {generatedContent && !isGenerating && !isRefining && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle size={14} />
                  <span className="text-xs">Ready</span>
                </div>
              )}
            </div>

            {/* Content Display */}
            <div className="flex-1 overflow-y-auto border border-gray-300 bg-gray-50 rounded-lg p-3">
              {error || refineError ? (
                <div className="flex items-start gap-1.5 text-red-600">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium">Error</p>
                    <p className="text-xs text-red-500">
                      {error || (refineError as any)?.message}
                    </p>
                  </div>
                </div>
              ) : generatedContent ? (
                <div className="text-xs text-gray-800 leading-relaxed">
                  <div dangerouslySetInnerHTML={{ __html: generatedContent }} />
                  {isGenerating && (
                    <span className="inline-block w-1 h-3 bg-blue-600 animate-pulse ml-1"></span>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 flex flex-col items-center justify-center h-full">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                    <Sparkles size={16} className="text-gray-400" />
                  </div>
                  <p className="text-xs">Generated content will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              AI-generated content
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={async () => {
                  try {
                    if (activeDraftId) {
                      await deleteDraft(activeDraftId);
                    }
                  } catch (e) {
                    // ignore delete error in deny flow
                  } finally {
                    handleClose();
                  }
                }}
                variant="outline"
                className="px-3 py-1.5 text-sm"
              >
                Deny
              </Button>
              <Button
                onClick={handleInsertContent}
                disabled={!generatedContent.trim() || isGenerating || isRefining}
                className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                Insert Content
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
