"use client";

import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import FontFamily from "@tiptap/extension-font-family";
import TextStyle from "@tiptap/extension-text-style";
import Gapcursor from "@tiptap/extension-gapcursor";
import { TrailingNode } from "./extensions/TrailingNode";
import EditorHeader from "./components/EditorHeader";
import EditorToolbar from "./components/EditorToolbar";
import SelectionToolbar from "./components/SelectionToolbar";
import { SlashCommands } from "./slash-commands";
import SelectionRefineMenu from "./SelectionRefineMenu";
import VariablesPanel, { VariableDef } from "./components/VariablesPanel";
import DocumentBrowser from "./components/DocumentBrowser";
import DraftsList from "./components/DraftsList";
import { Api } from "@/lib/api-client";
import { DraftingApi } from "@/lib/drafting-api";
import { useUpdateDraft } from "@/hooks/use-drafting";
import { useToast } from "@/components/ui/toast";
import { FontSize } from "./extensions/FontSize";
import "./styles/EditorStyles.css";

// Variable Highlighting Extension
const VariableHighlight = Extension.create({
  name: "variableHighlight",
  addOptions() {
    return {
      onVariableClick: null,
      currentVariables: [],
    };
  },
  addProseMirrorPlugins() {
    const { onVariableClick, currentVariables } = this.options;
    return [
      new Plugin({
        key: new PluginKey("variableHighlight"),
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, decorationSet) {
            const doc = tr.doc;
            const decorations: any[] = [];
            const variableIds = new Set(
              currentVariables.map((v: any) => v.unique_id)
            );
            doc.descendants((node, pos) => {
              if (node.isText && node.text) {
                const text = node.text;
                const variableRegex = /\{\{([^}]+)\}\}/g;
                let match;
                while ((match = variableRegex.exec(text)) !== null) {
                  const variableId = (match[1] || "").trim();
                  const isKnownVariable = variableIds.has(variableId);
                  const decoration = Decoration.inline(
                    pos + match.index,
                    pos + match.index + match[0].length,
                    {
                      class: `variable-highlight ${
                        isKnownVariable ? "known-variable" : "unknown-variable"
                      }`,
                      "data-variable-id": variableId,
                    }
                  );
                  decorations.push(decoration);
                }
              }
            });
            return DecorationSet.create(doc, decorations);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
          handleClick(view, pos, event) {
            const target = event.target as HTMLElement;
            if (
              target?.classList?.contains("variable-highlight") ||
              target?.hasAttribute("data-variable-id")
            ) {
              const variableId =
                target?.getAttribute("data-variable-id") ||
                target?.dataset?.variableId;
              if (variableId && onVariableClick) {
                onVariableClick(variableId);
                return true;
              }
            }
            return false;
          },
        },
      }),
    ];
  },
});

interface TiptapEditorProps {
  onDocumentTitleChange?: (title: string) => void;
  onEditorContentChange?: (getContentFn: () => string) => void;
  currentDraftId?: string | null;
  initialTitle?: string;
  onSave?: () => void;
  isSaving?: boolean;
  onNewDraft?: () => void;
}

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null;
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export default function TiptapEditor({ 
  onDocumentTitleChange, 
  onEditorContentChange, 
  currentDraftId,
  initialTitle,
  onSave,
  isSaving,
  onNewDraft,
}: TiptapEditorProps = {}) {
  const [editorState, setEditorState] = useState<Record<string, unknown>>({});
  const [documentTitle, setDocumentTitle] = useState(initialTitle || "Untitled Document");
  const [internalDraftId, setInternalDraftId] = useState<string | null>(currentDraftId || null);
  const [content, setContent] = useState("");
  const [contentUpdateTrigger, setContentUpdateTrigger] = useState(0);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableWithHeader, setTableWithHeader] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showCustomFontSizeInput, setShowCustomFontSizeInput] = useState(false);
  const [showVariablesPanel, setShowVariablesPanel] = useState(true);
  const [variables, setVariables] = useState<VariableDef[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    {}
  );
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(
    null
  );
  const [placeholderStatus, setPlaceholderStatus] = useState<
    Record<string, string>
  >({});
  
  // Hook for updating drafts
  const updateDraft = useUpdateDraft(currentWorkspaceId);
  const { showToast } = useToast();
  const [editingVariable, setEditingVariable] = useState<string | null>(null);
  const [highlightedVariable, setHighlightedVariable] = useState<string | null>(
    null
  );
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Get workspace ID from cookie on mount (fallback to localStorage for old data)
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const cookieMatch = document.cookie.match(/(?:^|; )workspaceId=([^;]*)/);
        const workspaceId = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
        setCurrentWorkspaceId(workspaceId);
      } catch {}
    }
  }, []);

  // Debounced function to update draft name
  const debouncedUpdateDraftName = useMemo(
    () => debounce(async (draftId: string, name: string) => {
      try {
        await updateDraft.mutateAsync({ id: draftId, name });
      } catch (error) {
        console.error('Failed to update draft name:', error);
        showToast('Failed to update draft name', 'error');
      }
    }, 1000),
    [updateDraft, showToast]
  );

  // Handle document title changes
  const handleDocumentTitleChange = useCallback((newTitle: string) => {
    setDocumentTitle(newTitle);
    
    // If we have a current draft, update it via API
    const currentId = internalDraftId || currentDraftId;
    if (currentId && newTitle.trim()) {
      debouncedUpdateDraftName(currentId, newTitle.trim());
    }
  }, [internalDraftId, currentDraftId, debouncedUpdateDraftName]);

  // Sync internal draft ID with prop
  useEffect(() => {
    if (currentDraftId !== internalDraftId) {
      setInternalDraftId(currentDraftId || null);
    }
  }, [currentDraftId, internalDraftId]);

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

  const charLimit = useMemo(() => undefined, []);

  // Handle variable click to navigate to variables panel
  const handleVariableClick = useCallback(
    (variableId: string) => {
      if (!showVariablesPanel) {
        setShowVariablesPanel(true);
      }
      setEditingVariable(variableId);
      setHighlightedVariable(variableId);
      setTimeout(() => {
        setHighlightedVariable(null);
      }, 2000);
      setTimeout(() => {
        const variableElement = document.querySelector(
          `[data-variable-id="${variableId}"]`
        );
        if (variableElement) {
          variableElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
        if (inputRefs.current[variableId]) {
          inputRefs.current[variableId]?.focus();
        }
      }, 100);
    },
    [showVariablesPanel]
  );

  const editor = useEditor({
    autofocus: true,
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      TextStyle,
      FontFamily,
      FontSize,
      TextAlign.configure({ 
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
        defaultAlignment: "left",
      }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: 'Start typing or press "/" for commands…',
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
        includeChildren: false,
      }),
      CharacterCount.configure({ limit: charLimit }),
      VariableHighlight.configure({
        onVariableClick: handleVariableClick,
        currentVariables: variables,
      }),
      Gapcursor,
      TrailingNode.configure({ node: "paragraph" }),
      SlashCommands,
    ],
    editorProps: {
      attributes: {
        class:
          "prose prose-lg max-w-none focus:outline-none tiptap-editor-content",
      },
    },
    content: content || "<p>Start drafting your document…</p>",
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
      updateEditorState();
    },
  });

  // Editor content callback effect
  const onEditorContentChangeRef = useRef(onEditorContentChange);
  onEditorContentChangeRef.current = onEditorContentChange;
  
  useEffect(() => {
    if (onEditorContentChangeRef.current && editor) {
      const getContent = () => editor.getHTML();
      onEditorContentChangeRef.current(getContent);
    }
  }, [editor]);

  const updateEditorState = useCallback(() => {
    if (!editor) return;
    setEditorState({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      strike: editor.isActive("strike"),
      code: editor.isActive("code"),
      codeBlock: editor.isActive("codeBlock"),
      bulletList: editor.isActive("bulletList"),
      orderedList: editor.isActive("orderedList"),
      blockquote: editor.isActive("blockquote"),
      link: editor.isActive("link"),
      table: editor.isActive("table"),
      textAlignLeft: editor.isActive({ textAlign: "left" }),
      textAlignCenter: editor.isActive({ textAlign: "center" }),
      textAlignRight: editor.isActive({ textAlign: "right" }),
      textAlignJustify: editor.isActive({ textAlign: "justify" }),
      heading1: editor.isActive("heading", { level: 1 }),
      heading2: editor.isActive("heading", { level: 2 }),
      heading3: editor.isActive("heading", { level: 3 }),
      heading4: editor.isActive("heading", { level: 4 }),
      heading5: editor.isActive("heading", { level: 5 }),
      heading6: editor.isActive("heading", { level: 6 }),
      fontSize: editor.getAttributes("textStyle").fontSize || "",
      fontFamily: editor.getAttributes("textStyle").fontFamily || "inherit",
    });
  }, [editor]);

  const exportPDF = useCallback(() => {
    if (!editor) return;
    const html = editor.getHTML();
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(
      `<!doctype html><html><head><title>${documentTitle}</title></head><body>${html}</body></html>`
    );
    w.document.close();
    setTimeout(() => w.print(), 250);
  }, [editor, documentTitle]);

  const exportDOCX = useCallback(() => {
    if (!editor) return;
    const html = editor.getHTML();
    const wordContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>${documentTitle}</title></head>
        <body>${html}</body>
      </html>`;
    const blob = new Blob(["\ufeff", wordContent], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${documentTitle}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [editor, documentTitle]);

  const importWord = useCallback(
    async (file: File) => {
      try {
        const arr = await file.arrayBuffer();
        const mammoth = (await import("mammoth")) as any;
        const result = await mammoth.convertToHtml({ arrayBuffer: arr });
        const html = result.value || "<p></p>";
        editor?.chain().focus().setContent(html, false).run();
        setDocumentTitle(file.name.replace(/\.[^.]+$/, ""));
      } catch (e: any) {
        alert(`Failed to import Word document: ${e?.message || e}`);
      }
    },
    [editor]
  );

  const importPDF = useCallback(
    async (file: File) => {
      try {
        const arr = await file.arrayBuffer();
        // Lazy import pdfjs-dist only if available
        // @ts-ignore
        const pdfjs = await import("pdfjs-dist/build/pdf");
        // @ts-ignore
        const workerSrc = await import("pdfjs-dist/build/pdf.worker.mjs");
        // @ts-ignore
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
        const pdf = await pdfjs.getDocument({ data: arr }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((it: any) => it.str).join(" ") + "\n";
        }
        const html = text
          .split("\n")
          .filter((l) => l.trim())
          .map((l) => `<p>${l}</p>`)
          .join("");
        editor
          ?.chain()
          .focus()
          .setContent(html || "<p></p>", false)
          .run();
        setDocumentTitle(file.name.replace(/\.[^.]+$/, ""));
      } catch (e: any) {
        alert(`Failed to import PDF: ${e?.message || e}`);
      }
    },
    [editor]
  );

  // Update variable highlighting when variables change
  useEffect(() => {
    if (editor) {
      const variableHighlightExt = editor.extensionManager.extensions.find(
        (ext) => ext.name === "variableHighlight"
      );
      if (variableHighlightExt) {
        variableHighlightExt.options.currentVariables = variables;
        editor.view.dispatch(editor.state.tr);
      }
    }
  }, [editor, variables]);

  // Effect to update editor content when content state changes
  useEffect(() => {
    if (editor && content && content !== editor.getHTML()) {
      // Content state changed, updating editor
      editor.chain().focus().setContent(content, false).run();
    }
  }, [editor, content]);

  // Utility function to sanitize HTML content
  const sanitizeHtmlContent = (content: string) =>
    content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  // Preprocess HTML content to ensure proper variable placeholders
  const preprocessHtmlContent = (html: string, variables: VariableDef[]) => {
    let processedHtml = html;
    const foundPlaceholders = new Set(
      (html.match(/\{\{[^}]+\}\}/g) || []).map((p) => p.slice(2, -2).trim())
    );
    const variableIds = new Set(variables.map((v) => v.unique_id));
    const status: Record<string, string> = {};

    variables.forEach((v) => {
      status[v.unique_id] = foundPlaceholders.has(v.unique_id)
        ? "Found"
        : "Missing";
    });
    setPlaceholderStatus(status);

    variables.forEach((variable) => {
      const placeholder = `{{${variable.unique_id}}}`;
      const escapedPlaceholder = placeholder.replace(
        /[-[\]{}()*+?.,\\^$|#\s]/g,
        "\\$&"
      );
      const regex = new RegExp(
        `\\{\\{\\s*${variable.unique_id}\\s*\\}\\}`,
        "gi"
      );
      processedHtml = processedHtml.replace(regex, placeholder);
    });

    const unmatchedVariables = variables.filter(
      (v) => !foundPlaceholders.has(v.unique_id)
    );
    if (unmatchedVariables.length > 0) {
      console.warn(
        "Variables with no placeholders in content:",
        unmatchedVariables.map((v) => v.unique_id)
      );
    }

    return processedHtml;
  };

  // Apply all variables to the document
  const handleApplyAllVariables = useCallback(async () => {
    if (!editor) return;
    let updatedContent = editor.getHTML();
    let replacementsMade = 0;
    const unmatchedVariables: string[] = [];

    Object.entries(variableValues).forEach(([variableId, value]) => {
      const escapedVariableId = variableId.replace(
        /[-[\]{}()*+?.,\\^$|#\s]/g,
        "\\$&"
      );
      const regex = new RegExp(
        `(?:<span[^>]*data-variable-id="${escapedVariableId}"[^>]*>[^<]+</span>|\\{\\{\\s*${escapedVariableId}\\s*\\}\\})`,
        "gi"
      );
      const sanitizedValue =
        value && value.trim() !== ""
          ? sanitizeHtmlContent(value)
          : `{{${variableId}}}`;
      const replacement =
        value && value.trim() !== ""
          ? `<span class="variable-highlight known-variable applied-variable" data-variable-id="${variableId}">${sanitizedValue}</span>`
          : `{{${variableId}}}`;

      const matchCount = (updatedContent.match(regex) || []).length;
      if (matchCount > 0) {
        replacementsMade += matchCount;
        updatedContent = updatedContent.replace(regex, replacement);
      } else {
        console.warn(
          `No matches found for variable ${variableId} in content. Placeholder status:`,
          placeholderStatus[variableId] || "Unknown"
        );
        unmatchedVariables.push(variableId);
      }
    });

    try {
      editor
        .chain()
        .setContent(updatedContent, false, { preserveWhitespace: true } as any)
        .run();
      setContent(updatedContent);

      if (replacementsMade > 0) {
        alert(
          `Applied ${replacementsMade} variable${
            replacementsMade === 1 ? "" : "s"
          } successfully!`
        );
      } else {
        alert(
          "No variables were applied. Check if placeholders exist in the document."
        );
      }
      if (unmatchedVariables.length > 0) {
        alert(
          `The following variables have no matching placeholders: ${unmatchedVariables.join(
            ", "
          )}. Ensure their placeholders (e.g., {{variableId}}) exist in the document.`
        );
      }
    } catch (error) {
      console.error("Failed to apply all variables:", error);
      alert("Failed to apply variables due to an error.");
    }
  }, [editor, variableValues, placeholderStatus]);

  // Save document with variables (template mode)
  const handleSave = useCallback(() => {
    if (!editor) return;
    const content = editor.getHTML();
    const docData = {
      title: documentTitle,
      content: content,
      variables: variableValues,
      variableDefinitions: variables,
      lastModified: new Date().toISOString(),
      type: "template",
    };
    const savedDocs = JSON.parse(
      localStorage.getItem("tiptap-documents") || "[]"
    );
    const existingIndex = savedDocs.findIndex(
      (doc: any) => doc.title === documentTitle
    );
    if (existingIndex >= 0) {
      savedDocs[existingIndex] = docData;
    } else {
      savedDocs.push(docData);
    }
    localStorage.setItem("tiptap-documents", JSON.stringify(savedDocs));
    alert(`Template "${documentTitle}" saved successfully!`);
  }, [editor, documentTitle, variableValues, variables]);

  // Save document with variables replaced (final document)
  const handleSaveWithVariablesReplaced = useCallback(async () => {
    if (!editor) return;

    // First apply all variables
    let finalContent = editor.getHTML();
    let replacementsMade = 0;

    Object.entries(variableValues).forEach(([variableId, value]) => {
      if (value && value.trim() !== "") {
        const escapedVariableId = variableId.replace(
          /[-[\]{}()*+?.,\\^$|#\s]/g,
          "\\$&"
        );
        const regex = new RegExp(
          `(?:<span[^>]*data-variable-id="${escapedVariableId}"[^>]*>[^<]*</span>|\\{\\{\\s*${escapedVariableId}\\s*\\}\\})`,
          "gi"
        );
        const sanitizedValue = sanitizeHtmlContent(value);

        const matchCount = (finalContent.match(regex) || []).length;
        if (matchCount > 0) {
          replacementsMade += matchCount;
          finalContent = finalContent.replace(regex, sanitizedValue);
        }
      }
    });

    // Remove any remaining variable highlighting spans
    finalContent = finalContent.replace(
      /<span[^>]*class="[^"]*variable-highlight[^"]*"[^>]*data-variable-id="[^"]*"[^>]*>([^<]*)<\/span>/gi,
      "$1"
    );

    const docData = {
      title: `${documentTitle} - Final`,
      content: finalContent,
      originalVariables: variableValues,
      variableDefinitions: variables,
      lastModified: new Date().toISOString(),
      type: "final",
      replacementsMade: replacementsMade,
    };

    const savedDocs = JSON.parse(
      localStorage.getItem("tiptap-documents") || "[]"
    );
    savedDocs.push(docData);
    localStorage.setItem("tiptap-documents", JSON.stringify(savedDocs));

    alert(
      `Final document "${docData.title}" saved successfully!\n${replacementsMade} variables were replaced.`
    );
  }, [editor, documentTitle, variableValues, variables, sanitizeHtmlContent]);

  // Preview final document (temporary view)
  const handlePreviewFinal = useCallback(async () => {
    if (!editor) return;

    // Create a temporary preview with variables replaced
    let previewContent = editor.getHTML();
    let replacementsMade = 0;

    Object.entries(variableValues).forEach(([variableId, value]) => {
      if (value && value.trim() !== "") {
        const escapedVariableId = variableId.replace(
          /[-[\]{}()*+?.,\\^$|#\s]/g,
          "\\$&"
        );
        const regex = new RegExp(
          `(?:<span[^>]*data-variable-id="${escapedVariableId}"[^>]*>[^<]*</span>|\\{\\{\\s*${escapedVariableId}\\s*\\}\\})`,
          "gi"
        );
        const sanitizedValue = sanitizeHtmlContent(value);

        if (regex.test(previewContent)) {
          replacementsMade++;
          previewContent = previewContent.replace(
            regex,
            `<mark style="background-color: #d1fae5;">${sanitizedValue}</mark>`
          );
        }
      }
    });

    // Remove variable highlighting spans but keep content
    previewContent = previewContent.replace(
      /<span[^>]*class="[^"]*variable-highlight[^"]*"[^>]*data-variable-id="[^"]*"[^>]*>([^<]*)<\/span>/gi,
      '<mark style="background-color: #fef3c7;">$1</mark>'
    );

    // Open preview in new window
    const previewWindow = window.open("", "_blank");
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Preview: ${documentTitle}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.6; 
              color: #374151; 
              max-width: 8.5in; 
              margin: 0 auto; 
              padding: 1in; 
              background: white; 
            }
            h1 { font-size: 2rem; font-weight: 700; margin: 1.5rem 0 1rem 0; color: #1f2937; }
            h2 { font-size: 1.5rem; font-weight: 600; margin: 1.25rem 0 0.75rem 0; color: #374151; }
            p { margin: 1rem 0; line-height: 1.6; }
            .preview-header {
              background: #f3f4f6;
              padding: 1rem;
              border-radius: 8px;
              margin-bottom: 2rem;
              border-left: 4px solid #3b82f6;
            }
            mark { padding: 2px 4px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <div class="preview-header">
            <h3 style="margin: 0; color: #1f2937;">Document Preview</h3>
            <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: #6b7280;">
              ${replacementsMade} variables replaced • 
              <span style="background: #d1fae5; padding: 2px 4px; border-radius: 3px;">Green</span> = Replaced variables • 
              <span style="background: #fef3c7; padding: 2px 4px; border-radius: 3px;">Yellow</span> = Unfilled variables
            </p>
          </div>
          ${previewContent}
        </body>
        </html>
      `);
      previewWindow.document.close();
    }
  }, [editor, documentTitle, variableValues, sanitizeHtmlContent]);

  // Draft from existing documents
  const handleDraftFromDocuments = useCallback(
    async (
      documentIds: string[],
      instruction: string,
      workspaceId: string
    ) => {
      try {
        const draftResponse = await DraftingApi.draftFromDocuments({
          documentId: documentIds,
          instruction: instruction,
          workspaceId: workspaceId,
        });

        // If the API returns content, update the editor
        if (draftResponse.content && editor) {
          editor.commands.setContent(draftResponse.content);
        }

        return draftResponse;
      } catch (error) {
        console.error("Error drafting from documents:", error);
        throw error;
      }
    },
    [editor]
  );

  // Save draft to document (create draft and save as document)
  const handleSaveDraftToDocument = useCallback(
    async (
      fileName: string,
      workspaceId: string,
      fileFormat: "docx" | "pdf" | "txt" = "docx"
    ) => {
      if (!editor) return;

      try {
        // Get the current editor content with variables replaced
        let finalContent = editor.getHTML();

        // Replace variables with their values
        Object.entries(variableValues).forEach(([variableId, value]) => {
          if (value && value.trim() !== "") {
            const escapedVariableId = variableId.replace(
              /[-[\]{}()*+?.,\\^$|#\s]/g,
              "\\$&"
            );
            const regex = new RegExp(
              `(?:<span[^>]*data-variable-id="${escapedVariableId}"[^>]*>[^<]*</span>|\\{\\{\\s*${escapedVariableId}\\s*\\}\\})`,
              "gi"
            );
            const sanitizedValue = sanitizeHtmlContent(value);
            finalContent = finalContent.replace(regex, sanitizedValue);
          }
        });

        // Remove any remaining variable highlighting spans
        finalContent = finalContent.replace(
          /<span[^>]*class="[^"]*variable-highlight[^"]*"[^>]*data-variable-id="[^"]*"[^>]*>([^<]*)<\/span>/gi,
          "$1"
        );

        // First create a draft
        const createDraftResponse = await DraftingApi.draftFromDocuments({
          documentId: [], // Array of document IDs to draft from (empty for new drafts)
          instruction: `Auto-generated draft: ${documentTitle}`,
          workspaceId: workspaceId,
        });

        const draftId = createDraftResponse.id;

        // Then save the draft as a document
        const saveResponse = await DraftingApi.saveDraftToDocument(
          draftId,
          fileName,
          workspaceId,
          fileFormat
        );

        alert(`Draft "${fileName}" saved successfully as document!`);
      } catch (error) {
        console.error("Error saving draft to document:", error);
        alert(
          `Failed to save draft: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },
    [editor, documentTitle, variableValues, sanitizeHtmlContent]
  );

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
        className={`flex-1 min-w-0 ${showVariablesPanel ? "mr-2" : ""} transition-all duration-300`}
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
              <EditorContent editor={editor} key={contentUpdateTrigger} />
              <SelectionToolbar
                editor={editor}
                onRefine={(originalText, refinedText, instruction) => {
                  console.warn("Text refined:", {
                    originalText,
                    refinedText,
                    instruction,
                  });
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

      {showVariablesPanel ? (
        <div className="flex-shrink-0 h-full overflow-hidden w-80">
          <DraftsList
            workspaceId={currentWorkspaceId || undefined}
            onLoadDraftContent={({ name, content }) => {
              try {
                if (name) setDocumentTitle(name);
                if (typeof content === "string") {
                  const safeContent = content.trim() !== "" ? content : "<p></p>";
                  // Avoid synchronous heavy operations; batch in microtask
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
                console.error("Failed to load draft content into editor:", e);
              }
            }}
            onCreateNewDraft={() => {
              setInternalDraftId(null);
              setDocumentTitle("New Draft");
              setVariables([]);
              setVariableValues({});
              setPlaceholderStatus({});
              const safeContent = "<p></p>";
              setContent(safeContent);
              editor?.chain().focus().clearContent().setContent(safeContent, false).run();
              if (onNewDraft) onNewDraft();
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
