import { useCallback, useState, useEffect, useMemo } from "react";
import { Editor } from "@tiptap/react";
import { useUpdateDraft } from "@/hooks/use-drafting";
import { useToast } from "@/components/ui/toast";
import { DraftingApi } from "@/lib/drafting-api";
import {
  DocumentData,
  DraftFromDocumentsParams,
  SaveDraftToDocumentParams,
} from "../types";
import { debounce, sanitizeHtmlContent } from "../utils";

export const useDocumentOperations = (
  editor: Editor | null,
  documentTitle: string,
  variableValues: Record<string, string>,
  variables: any[]
) => {
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(
    null
  );
  const updateDraft = useUpdateDraft(currentWorkspaceId);
  const { showToast } = useToast();

  // Get workspace ID from cookie on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const cookieMatch = document.cookie.match(
          /(?:^|; )workspaceId=([^;]*)/
        );
        const workspaceId = cookieMatch
          ? decodeURIComponent(cookieMatch[1])
          : null;
        setCurrentWorkspaceId(workspaceId);
      } catch {}
    }
  }, []);

  // Debounced function to update draft name
  const debouncedUpdateDraftName = useMemo(
    () =>
      debounce(async (draftId: string, name: string) => {
        try {
          await updateDraft.mutateAsync({ id: draftId, name });
        } catch (error) {
          console.error("Failed to update draft name:", error);
          showToast("Failed to update draft name", "error");
        }
      }, 1000),
    [updateDraft, showToast]
  );

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
        return file.name.replace(/\.[^.]+$/, "");
      } catch (e: any) {
        alert(`Failed to import Word document: ${e?.message || e}`);
        return null;
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
        return file.name.replace(/\.[^.]+$/, "");
      } catch (e: any) {
        alert(`Failed to import PDF: ${e?.message || e}`);
        return null;
      }
    },
    [editor]
  );

  const handleSave = useCallback(() => {
    if (!editor) return;
    const content = editor.getHTML();
    const docData: DocumentData = {
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

    const docData: DocumentData = {
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
  }, [editor, documentTitle, variableValues, variables]);

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
  }, [editor, documentTitle, variableValues]);

  const handleDraftFromDocuments = useCallback(
    async (params: DraftFromDocumentsParams) => {
      try {
        const draftResponse = await DraftingApi.draftFromDocuments({
          documentId: params.documentId,
          instruction: params.instruction,
          workspaceId: params.workspaceId,
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

  const handleSaveDraftToDocument = useCallback(
    async (params: SaveDraftToDocumentParams) => {
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
          workspaceId: params.workspaceId,
        });

        const draftId = createDraftResponse.id;

        // Then save the draft as a document
        const saveResponse = await DraftingApi.saveDraftToDocument(
          draftId,
          params.fileName,
          params.workspaceId,
          params.fileFormat || "docx"
        );

        alert(`Draft "${params.fileName}" saved successfully as document!`);
      } catch (error) {
        console.error("Error saving draft to document:", error);
        alert(
          `Failed to save draft: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },
    [editor, documentTitle, variableValues]
  );

  return {
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
  };
};
