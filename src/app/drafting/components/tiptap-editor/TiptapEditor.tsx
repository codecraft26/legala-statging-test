"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { MinimalTiptap } from "@/components/ui/shadcn-io/minimal-tiptap";
import EditorHeader from "./components/EditorHeader";
import EditorToolbar from "./components/EditorToolbar";
import SelectionToolbar from "./components/SelectionToolbar";
import SelectionRefineMenu from "./SelectionRefineMenu";
import VariablesPanel from "./components/VariablesPanel";
import DraftsList from "./components/DraftsList";
import AIModal from "./components/AIModal";
import { TiptapEditorProps } from "./types";
import {
  useEditorSetup,
  useEditorState,
  useVariables,
  useDocumentOperations,
  useVariableOperations,
} from "./hooks";
import { fetchDraftingDetailViaClient } from "@/hooks/use-drafting";
import { normalizeToHtml } from "./utils/html";
import "./styles/EditorStyles.css";

export default function TiptapEditor({
  onDocumentTitleChange,
  onEditorContentChange,
  currentDraftId,
  initialTitle,
  onSave,
  isSaving,
  onNewDraft,
  onDraftIdChange,
}: TiptapEditorProps = {}) {
  // State management
  const [documentTitle, setDocumentTitle] = useState(
    initialTitle || "Untitled Document"
  );
  const [internalDraftId, setInternalDraftId] = useState<string | null>(
    currentDraftId || null
  );
  const [content, setContent] = useState("");

  const [showTableMenu, setShowTableMenu] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableWithHeader, setTableWithHeader] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showCustomFontSizeInput, setShowCustomFontSizeInput] = useState(false);
  const [showDraftsPanel, setShowDraftsPanel] = useState(true);
  const [showAIModal, setShowAIModal] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<"drafts" | "variables">(
    "drafts"
  );
  const queryClient = useQueryClient();

  // Keep a synchronous ref of the current draft id to avoid races during rename
  const currentIdRef = useRef<string | null>(currentDraftId || null);
  useEffect(() => {
    const nextId = internalDraftId || currentDraftId || null;
    currentIdRef.current = nextId;
  }, [internalDraftId, currentDraftId]);

  // Custom hooks - need to set up editor first
  const { editor, contentUpdateTrigger } = useEditorSetup(
    content,
    () => {}, // Will be updated via useEffect
    [], // Will be updated via useEffect
    () => setShowAIModal(true) // AI modal callback
  );

  const {
    variables,
    setVariables,
    variableValues,
    setVariableValues,
    placeholderStatus,
    setPlaceholderStatus,
    editingVariable,
    setEditingVariable,
    highlightedVariable,
    setHighlightedVariable,
    isExtracting,
    inputRefs,
    handleChangeVariableValue,
    handleEditVariable,
    handleClearAll,
    handleVariableClick: handleVariableClickBase,
    handleForceExtraction,
  } = useVariables(editor);

  const handleVariableClick = useCallback(
    (variableId: string) => {
      handleVariableClickBase(
        variableId,
        showDraftsPanel,
        setShowDraftsPanel
      );
    },
    [handleVariableClickBase, showDraftsPanel]
  );

  // Update editor's variable click handler when it changes
  useEffect(() => {
    if (editor && handleVariableClick) {
      // The VariableHighlight extension will use this handler
      editor.storage.variableHighlight?.setVariableClickHandler?.(
        handleVariableClick
      );
    }
  }, [editor, handleVariableClick]);

  // Update editor's variables when they change
  useEffect(() => {
    if (editor && variables) {
      // The VariableHighlight extension will use these variables
      editor.storage.variableHighlight?.setVariables?.(variables);
    }
  }, [editor, variables]);

  // Listen for AI modal events from slash commands (fallback)
  useEffect(() => {
    const handleOpenAIModal = (event: CustomEvent) => {
      setShowAIModal(true);
    };

    window.addEventListener(
      "open-ai-modal",
      handleOpenAIModal as EventListener
    );

    return () => {
      window.removeEventListener(
        "open-ai-modal",
        handleOpenAIModal as EventListener
      );
    };
  }, []);

  const { editorState, updateEditorState } = useEditorState(editor);
  // use shared normalizer

  const {
    currentWorkspaceId,
    debouncedUpdateDraftName,
    exportPDF,
    exportDOCX,
    importWord,
    importPDF,
    handleSave,
    handleSaveWithVariablesReplaced,
    handlePreviewFinal,
    handleDraftFromDocuments,
    handleSaveDraftToDocument,
    handleDocumentImport,
  } = useDocumentOperations(editor, documentTitle, variableValues, variables);

  const { handleApplyAllVariables, handleInsertPlaceholder } =
    useVariableOperations(editor, variableValues, placeholderStatus);

  // Handle document title changes
  const handleDocumentTitleChange = useCallback(
    (newTitle: string) => {
      setDocumentTitle(newTitle);

      // If we have a current draft, update it via API
      const currentId = currentIdRef.current;
      if (currentId && newTitle.trim()) {
        debouncedUpdateDraftName(currentId, newTitle.trim());
      }
    },
    [debouncedUpdateDraftName]
  );

  // Sync internal draft ID with prop
  useEffect(() => {
    if (currentDraftId !== internalDraftId) {
      setInternalDraftId(currentDraftId || null);
      if (onDraftIdChange) onDraftIdChange(currentDraftId || null);
    }
  }, [currentDraftId, internalDraftId, onDraftIdChange]);

  // Update document title when initialTitle prop changes
  useEffect(() => {
    if (initialTitle) {
      setDocumentTitle(initialTitle);
    }
  }, [initialTitle]);

  // Callback effects for parent component communication
  const onDocumentTitleChangeRef = useRef(onDocumentTitleChange);
  onDocumentTitleChangeRef.current = onDocumentTitleChange;

  useEffect(() => {
    if (onDocumentTitleChangeRef.current) {
      onDocumentTitleChangeRef.current(documentTitle);
    }
  }, [documentTitle]);

  // Editor content callback effect
  const onEditorContentChangeRef = useRef(onEditorContentChange);
  onEditorContentChangeRef.current = onEditorContentChange;

  useEffect(() => {
    if (onEditorContentChangeRef.current && editor) {
      const getContent = () => editor.getHTML();
      onEditorContentChangeRef.current(getContent);
    }
  }, [editor]);

  // Update editor content when editor changes
  useEffect(() => {
    if (editor) {
      const handleUpdate = ({ editor }: { editor: any }) => {
        const newContent = editor.getHTML();
        setContent(newContent);
        updateEditorState();
      };

      editor.on("update", handleUpdate);
      return () => {
        editor.off("update", handleUpdate);
      };
    }
  }, [editor, updateEditorState]);

  if (!editor) return null;

  return (
    <div className="h-screen flex bg-gray-50 max-w-full overflow-hidden">
      <style>{`
        .variable-highlight {
          position: relative;
          padding: 2px 4px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
          border: 1px solid transparent;
        }
        .variable-highlight.known-variable {
          background-color: #dbeafe;
          color: #1e40af;
          border-color: #93c5fd;
        }
        .variable-highlight.unknown-variable {
          background-color: #fef3c7;
          color: #92400e;
          border-color: #fbbf24;
        }
        .variable-highlight.applied-variable {
          background-color: #d1fae5;
          color: #065f46;
          border-color: #6ee7b7;
          font-weight: 600;
        }
        .variable-highlight:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .variable-highlight.known-variable:hover {
          background-color: #bfdbfe;
          border-color: #60a5fa;
        }
        .variable-highlight.unknown-variable:hover {
          background-color: #fde68a;
          border-color: #f59e0b;
        }
        .variable-highlight.applied-variable:hover {
          background-color: #a7f3d0;
          border-color: #34d399;
        }
      `}</style>
      <div
        className={`flex-1 min-w-0 ${showDraftsPanel ? "mr-2" : ""} transition-all duration-300`}
      >
        <div className="h-full bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col max-w-full overflow-hidden">
          <EditorHeader
            documentTitle={documentTitle}
            onDocumentTitleChange={handleDocumentTitleChange}
            onExportPDF={exportPDF}
            onExportDOCX={exportDOCX}
            onImportWord={importWord}
            onImportPDF={importPDF}
            isEditingEnabled={true}
            onSave={onSave}
            isSaving={isSaving}
          />
          <EditorToolbar
            editor={editor}
            editorState={editorState}
            updateEditorState={updateEditorState}
            showTableMenu={showTableMenu}
            setShowTableMenu={setShowTableMenu}
            tableRows={tableRows}
            setTableRows={setTableRows}
            tableCols={tableCols}
            setTableCols={setTableCols}
            tableWithHeader={tableWithHeader}
            setTableWithHeader={setTableWithHeader}
            setShowLinkModal={setShowLinkModal}
            setShowCustomFontSizeInput={setShowCustomFontSizeInput}
            content={content}
            onSave={onSave}
            isSaving={isSaving}
          />

          <div className="flex-1 relative bg-white overflow-hidden">
            <div className="h-full overflow-y-auto px-6 py-6">
              <MinimalTiptap
                editor={editor}
                showToolbar={false}
                className="border-0"
                key={contentUpdateTrigger}
              />
              <SelectionToolbar
                editor={editor}
                onRefine={(originalText, refinedText, instruction) => {
                  // Text refinement completed
                }}
              />
              <SelectionRefineMenu editor={editor} />
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-gray-200 px-4 py-2 text-sm text-gray-500 flex items-center justify-between">
            <span>Words: {editor.storage.characterCount?.words?.() ?? 0}</span>
            <span>
              Characters: {editor.storage.characterCount?.characters?.() ?? 0}
            </span>
          </div>
        </div>
      </div>

      {showDraftsPanel ? (
        <div className="flex-shrink-0 h-full w-80 flex flex-col min-h-0">
          <div className="border-b border-gray-200 bg-white">
            <div className="px-3 py-2 text-sm font-semibold text-gray-900 flex items-center justify-between gap-2">
              <button
                className={`px-2 py-1 rounded ${
                  rightPanelTab === "drafts"
                    ? "bg-gray-200 text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => setRightPanelTab("drafts")}
              >
                Drafts
              </button>
              <button
                className={`px-2 py-1 rounded ${
                  rightPanelTab === "variables"
                    ? "bg-gray-200 text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => setRightPanelTab("variables")}
              >
                Variables
              </button>
              <button
                onClick={() => setShowDraftsPanel(false)}
                className="ml-auto px-2 py-1 text-xs text-gray-600 hover:text-black rounded border border-gray-200"
                title="Hide sidebar"
              >
                Hide
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            {rightPanelTab === "drafts" ? (
              <DraftsList
                workspaceId={currentWorkspaceId || undefined}
                onLoadDraftContent={({ id, name, content }) => {
                  try {
                    if (id) {
                      setInternalDraftId(id);
                      if (onDraftIdChange) onDraftIdChange(id);
                    }
                    if (name) setDocumentTitle(name);
                    if (typeof content === "string") {
                      const safeContent =
                        content.trim() !== "" ? content : "<p></p>";
                      Promise.resolve().then(() => {
                        setVariables([]);
                        setVariableValues({});
                        setPlaceholderStatus({});
                        setContent(safeContent);
                        editor
                          ?.chain()
                          .focus()
                          .clearContent()
                          .setContent(safeContent, false)
                          .run();
                      });
                    }
                  } catch (e) {
                    console.error(
                      "Failed to load draft content into editor:",
                      e
                    );
                  }
                }}
                onCreateNewDraft={() => {
                  setInternalDraftId(null);
                  if (onDraftIdChange) onDraftIdChange(null);
                  setDocumentTitle("New Draft");
                  setVariables([]);
                  setVariableValues({});
                  setPlaceholderStatus({});
                  const safeContent = "<p></p>";
                  setContent(safeContent);
                  editor
                    ?.chain()
                    .focus()
                    .clearContent()
                    .setContent(safeContent, false)
                    .run();
                  if (onNewDraft) onNewDraft();
                }}
              />
            ) : (
              <VariablesPanel
                variables={variables}
                values={variableValues}
                placeholderStatus={placeholderStatus}
                editingVariable={editingVariable}
                highlightedVariable={highlightedVariable}
                isExtracting={isExtracting}
                hasContent={Boolean(
                  content &&
                    content.trim() !== "" &&
                    content !== "<p></p>" &&
                    content !== "<p><br></p>" &&
                    content.length > 10
                )}
                inputRefs={inputRefs}
                onChangeValue={handleChangeVariableValue}
                onEditVariable={handleEditVariable}
                onInsertPlaceholder={handleInsertPlaceholder}
                onApplyAllVariables={handleApplyAllVariables}
                onSaveDocument={handleSave}
                onSaveWithVariablesReplaced={handleSaveWithVariablesReplaced}
                onPreviewFinal={handlePreviewFinal}
                onSaveDraftToDocument={(fileName, workspaceId, fileFormat) =>
                  handleSaveDraftToDocument({
                    fileName,
                    workspaceId,
                    fileFormat,
                  })
                }
                onClearAll={handleClearAll}
                onForceExtraction={handleForceExtraction}
              />
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowDraftsPanel(true)}
          className="absolute right-2 top-20 z-10 px-2 py-1 text-xs bg-white border border-gray-200 rounded shadow hover:bg-gray-50"
          title="Show sidebar"
        >
          Show Panel
        </button>
      )}

      {/* AI Modal */}
      <AIModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        editor={editor}
        onSwitchToDraft={async (draftId: string) => {
          try {
            const data = await fetchDraftingDetailViaClient(queryClient, draftId);
            if (data?.name) setDocumentTitle(data.name);
            const contentToSet = normalizeToHtml(
              typeof data?.content === "string" ? data.content : ""
            );
            setInternalDraftId(draftId);
            if (onDraftIdChange) onDraftIdChange(draftId);
            setVariables([]);
            setVariableValues({});
            setPlaceholderStatus({});
            setContent(contentToSet);
            editor?.chain().focus().clearContent().setContent(contentToSet, false).run();
            setRightPanelTab("drafts");
            setShowAIModal(false);
          } catch (e) {
            console.error("Failed to switch to generated draft:", e);
          }
        }}
      />

      
    </div>
  );
}
