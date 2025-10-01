import { useCallback } from "react";
import { Editor } from "@tiptap/react";
import { useToast } from "@/components/ui/toast";
import { sanitizeHtmlContent } from "../utils";

export const useVariableOperations = (
  editor: Editor | null,
  variableValues: Record<string, string>,
  placeholderStatus: Record<string, string>
) => {
  const { showToast } = useToast();

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

      if (replacementsMade > 0) {
        showToast(
          `Applied ${replacementsMade} variable${
            replacementsMade === 1 ? "" : "s"
          } successfully!`,
          "success"
        );
      } else {
        showToast(
          "No variables were applied. Check if placeholders exist in the document.",
          "info"
        );
      }
      if (unmatchedVariables.length > 0) {
        showToast(
          `No placeholders found for: ${unmatchedVariables.join(", ")}.`,
          "info"
        );
      }
    } catch (error) {
      console.error("Failed to apply all variables:", error);
      showToast("Failed to apply variables due to an error.", "error");
    }
  }, [editor, variableValues, placeholderStatus, showToast]);

  const handleInsertPlaceholder = useCallback(
    (id: string) => {
      if (!editor) return;
      editor.chain().focus().insertContent(`{{${id}}}`).run();
    },
    [editor]
  );

  return {
    handleApplyAllVariables,
    handleInsertPlaceholder,
  };
};
