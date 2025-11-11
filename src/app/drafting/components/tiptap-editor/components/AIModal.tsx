"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Sparkles, 
  Loader2, 
  X, 
  File as FileIcon, 
  Send,
  Trash2,
  History,
} from "lucide-react";
import { useRefineText } from "@/hooks/use-refine";
import { useDocuments, type DocumentItem, useUploadDocuments, useDeleteDocument } from "@/hooks/use-documents";
import { 
  useDeleteDrafting, 
  useUpdateDraft, 
  useDraftFromDocuments,
  useDraftingInstructions,
  useCreateDraftingInstruction,
  useDeleteDraftingInstruction,
} from "@/hooks/use-drafting";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import DataHubPicker from "./DataHubPicker";
import GeneratedContentView from "./GeneratedContentView";
import AIModalFooter from "./AIModalFooter";
import { getCookie as getCookieUtil } from "@/lib/utils";
import { normalizeToHtml } from "../utils/html";

// Component for displaying instruction items with hover tooltip
function InstructionItem({
  instruction,
  onSelect,
  onDelete,
  isDeleting,
}: {
  instruction: string;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  isDeleting: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const textRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if text is truncated
  useEffect(() => {
    if (textRef.current) {
      const element = textRef.current;
      setIsTruncated(element.scrollWidth > element.clientWidth);
    }
  }, [instruction]);

  // Update tooltip position when it's shown
  useEffect(() => {
    if (showTooltip && isTruncated && textRef.current) {
      const updatePosition = () => {
        if (textRef.current) {
          const rect = textRef.current.getBoundingClientRect();
          setTooltipPosition({
            top: rect.top,
            left: rect.left,
          });
        }
      };
      
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [showTooltip, isTruncated]);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (isTruncated) {
      hoverTimeoutRef.current = setTimeout(() => {
        setShowTooltip(true);
      }, 200); // Reduced delay for better UX
    }
  };

  const handleMouseLeave = () => {
    // Use a small delay to allow moving to tooltip
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 100);
  };

  const handleTooltipMouseEnter = () => {
    // Cancel any pending hide
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setShowTooltip(true);
  };

  const handleTooltipMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setShowTooltip(false);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-between group hover:bg-gray-100 rounded px-2 py-1 cursor-pointer relative"
      onClick={onSelect}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span
        ref={textRef}
        className="text-xs text-gray-700 flex-1 truncate"
        title={isTruncated ? instruction : undefined}
      >
        {instruction}
      </span>
      
      {/* Tooltip for truncated text - using fixed positioning */}
      {showTooltip && isTruncated && (
        <div
          ref={tooltipRef}
          className="fixed z-[9999] w-auto max-w-md p-3 text-sm bg-gray-900 text-white border border-gray-700 shadow-xl rounded-md break-words pointer-events-auto"
          style={{
            top: `${tooltipPosition.top - 8}px`,
            left: `${tooltipPosition.left}px`,
            transform: 'translateY(-100%)',
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          {instruction}
          {/* Tooltip arrow */}
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
      
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(e);
        }}
        disabled={isDeleting}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-opacity ml-2 flex-shrink-0"
        title="Delete instruction"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

function TemplatesInlineList({
  workspaceId,
  onPick,
}: {
  workspaceId: string | null;
  onPick: (args: { docId: string; name: string }) => void;
}) {
  const [templates, setTemplates] = React.useState<any[]>([]);
  const uploadDocuments = useUploadDocuments();

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import("@/lib/template-service");
        const list = await mod.TemplateService.getAllTemplates();
        if (mounted) setTemplates(list);
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-1">
      {templates.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={async () => {
            try {
              if (!workspaceId) return;
              const mod = await import("@/lib/template-service");
              const url = mod.TemplateService.getTemplateFileUrl(t.filename);
              const res = await fetch(url);
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const blob = await res.blob();
              const file = new File([blob], t.filename, { type: blob.type || "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
              const uploadRes: any = await uploadDocuments.mutateAsync({ files: [file], workspaceId });
              const uploaded = Array.isArray(uploadRes)
                ? uploadRes[0]
                : Array.isArray(uploadRes?.data)
                  ? uploadRes.data[0]
                  : uploadRes?.document || uploadRes?.file || uploadRes;
              const docId = String(uploaded?.id || uploaded?.documentId || uploaded?.fileId || "");
              if (docId) onPick({ docId, name: t.name });
            } catch (e) {
              console.error("Failed to upload template for drafting:", e);
            }
          }}
          className="w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-100"
          title={t.description || t.name}
        >
          <span className="font-medium">{t.name}</span>
          <span className="ml-1 text-[10px] text-purple-700 bg-purple-100 px-1 py-0.5 rounded">InfraHive.ai</span>
        </button>
      ))}
      {templates.length === 0 && (
        <div className="text-xs text-gray-500">No templates found</div>
      )}
    </div>
  );
}

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
  const [templateUploads, setTemplateUploads] = useState<string[]>([]);
  
  
  // Get workspace ID from cookie
  const workspaceId = getCookieUtil("workspaceId");
  
  // Use the existing documents hook
  const { 
    data: availableDocuments = [], 
    isLoading: loadingDocuments 
  } = useDocuments(workspaceId, currentFolderId);
  const uploadDocuments = useUploadDocuments();
  const deleteDocument = useDeleteDocument();

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

  // Drafting instructions hooks
  const { data: previousInstructions = [], isLoading: loadingInstructions } = useDraftingInstructions(workspaceId);
  const { mutateAsync: createInstruction, isPending: isSavingInstruction } = useCreateDraftingInstruction(workspaceId);
  const { mutateAsync: deleteInstruction, isPending: isDeletingInstruction } = useDeleteDraftingInstruction(workspaceId);
  const [showPreviousInstructions, setShowPreviousInstructions] = useState(false);
  const [isPromptFromHistory, setIsPromptFromHistory] = useState(false);
  const { showToast } = useToast();

  // moved to shared util normalizeToHtml

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

  // Handle deleting an instruction
  const handleDeleteInstruction = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteInstruction(id);
      showToast("Instruction deleted successfully!", "success");
    } catch (error) {
      console.error("Failed to delete instruction:", error);
      showToast("Failed to delete instruction", "error");
    }
  };

  // Handle selecting a previous instruction
  const handleSelectInstruction = (instruction: string) => {
    setPrompt(instruction);
    setIsPromptFromHistory(true); // Mark that this came from history
    setShowPreviousInstructions(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Check if instruction already exists in history
  const isInstructionAlreadySaved = (instruction: string): boolean => {
    return previousInstructions.some(
      (item) => item.instruction.trim().toLowerCase() === instruction.trim().toLowerCase()
    );
  };

  // Auto-save instruction if it's new and not from history
  const autoSaveInstruction = async (instruction: string) => {
    if (!instruction.trim() || !workspaceId || isPromptFromHistory) return;
    
    // Check if already saved
    if (isInstructionAlreadySaved(instruction)) return;

    try {
      await createInstruction({
        instruction: instruction.trim(),
        workspaceId,
      });
    } catch (error) {
      console.error("Failed to auto-save instruction:", error);
      // Don't show toast for auto-save failures to avoid noise
    }
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

    // Auto-save the instruction if it's new
    await autoSaveInstruction(prompt);

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
        const POLL_INTERVAL_MS = 5000; // 3 seconds
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
          }, POLL_INTERVAL_MS);
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
        // Delete temporary template uploads from DataHub after content accepted (template-only)
        try {
          for (const tempDocId of templateUploads) {
            if (tempDocId) {
              try {
                await deleteDocument.mutateAsync({ id: String(tempDocId) });
              } catch (_e) {}
            }
          }
        } catch (_e) {}

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
    setShowPreviousInstructions(false);
    setIsPromptFromHistory(false);
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
      <DialogContent className="w-[92vw] max-w-[1400px] max-h-[96vh] flex flex-col p-0">
        {/* Header */}
        <div className="px-4 py-3 border-b bg-white">
          <div className="flex items-center justify-between gap-2">
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
        </div>

        {/* Content - Two Column Layout */}
        <div className="flex-1 grid grid-cols-2 h-[500px]">
          {/* Left Column - Input */}
          <div className="p-4 space-y-3 overflow-y-auto border-r border-gray-200">
            {(availableDocuments.length > 0 || loadingDocuments) && (
              <DataHubPicker
                workspaceId={workspaceId}
                currentFolderId={currentFolderId}
                onFolderChange={(id) => setCurrentFolderId(id)}
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                onSelectFile={(file) => {
                  if (allFiles.length < 2) handleDataHubFileSelect(file);
                }}
              />
            )}

            {/* Templates List (below DataHub) */}
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Templates
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 max-h-40 overflow-y-auto space-y-1">
                <TemplatesInlineList
                  workspaceId={workspaceId}
                  onPick={({ docId, name }) => {
                    const tempId = `template-${docId}`;
                    setDataHubSelectedFiles((prev) => [
                      ...prev,
                      {
                        id: tempId,
                        name,
                        isFromDataHub: true,
                        originalFile: { id: docId },
                      },
                    ]);
                    setSelectedFiles((prev) => [...prev, tempId]);
                    setTemplateUploads((prev) => [...prev, docId]);
                    setShowDataHub(true);
                  }}
                />
              </div>
            </div>
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-gray-700">
                  What would you like me to write?
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreviousInstructions(!showPreviousInstructions)}
                  className="h-6 px-2 text-xs"
                  title="Show previous instructions"
                >
                  <History size={12} className="mr-1" />
                  History
                </Button>
              </div>
              
              {/* Previous Instructions Dropdown */}
              {showPreviousInstructions && previousInstructions.length > 0 && (
                <div className="mb-2 bg-gray-50 border border-gray-200 rounded-lg p-2 max-h-32 overflow-y-auto">
                  <div className="text-xs font-medium text-gray-700 mb-1">Previous Instructions:</div>
                  <div className="space-y-1">
                    {previousInstructions.map((item) => (
                      <InstructionItem
                        key={item.id}
                        instruction={item.instruction}
                        onSelect={() => handleSelectInstruction(item.instruction)}
                        onDelete={(e) => handleDeleteInstruction(item.id, e)}
                        isDeleting={isDeletingInstruction}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {showPreviousInstructions && previousInstructions.length === 0 && !loadingInstructions && (
                <div className="mb-2 bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-500">
                  No previous instructions found
                </div>
              )}

              <Textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  // Reset the flag when user manually types
                  if (isPromptFromHistory) {
                    setIsPromptFromHistory(false);
                  }
                }}
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
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-black text-white rounded hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
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
          <GeneratedContentView
            html={generatedContent}
            isLoading={isGenerating || isRefining}
            error={error || (refineError as any)?.message}
          />
        </div>

        {/* Footer */}
        <AIModalFooter
          onDeny={async () => {
            try {
              if (activeDraftId) await deleteDraft(activeDraftId);
            } finally {
              handleClose();
            }
          }}
          onInsert={handleInsertContent}
          canInsert={!!generatedContent.trim()}
          isBusy={isGenerating || isRefining}
        />
      </DialogContent>

      
    </Dialog>
  );
}
