import { useState, useEffect, useCallback, useRef } from "react";
import { Editor } from "@tiptap/react";
import { VariableDef } from "../types";
import {
  extractVariablesFromContent,
  normalizeBracketPlaceholders,
} from "../utils";

export const useVariables = (editor: Editor | null) => {
  const [variables, setVariables] = useState<VariableDef[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    {}
  );
  const [placeholderStatus, setPlaceholderStatus] = useState<
    Record<string, string>
  >({});
  const [editingVariable, setEditingVariable] = useState<string | null>(null);
  const [highlightedVariable, setHighlightedVariable] = useState<string | null>(
    null
  );
  const [isExtracting, setIsExtracting] = useState(false);
  const inputRefs = useRef<
    Record<string, HTMLInputElement | HTMLTextAreaElement | null>
  >({});
  const isProcessingRef = useRef(false);
  const [triggerUpdate, setTriggerUpdate] = useState(0);
  const extractionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const extractionSafetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced variable extraction to prevent performance issues with large documents
  useEffect(() => {
    if (!editor) {
      setIsExtracting(false);
      return;
    }

    // Clear any existing timeout
    if (extractionTimeoutRef.current) {
      clearTimeout(extractionTimeoutRef.current);
    }

    // Set loading state
    setIsExtracting(true);

    // Safety timeout to prevent stuck extraction state (10 seconds)
    extractionSafetyTimeoutRef.current = setTimeout(() => {
      setIsExtracting(false);
    }, 10000);

    // Debounce the extraction to prevent excessive processing
    extractionTimeoutRef.current = setTimeout(() => {
      extractVariables();
    }, 500); // 500ms debounce

    return () => {
      if (extractionTimeoutRef.current) {
        clearTimeout(extractionTimeoutRef.current);
      }
      if (extractionSafetyTimeoutRef.current) {
        clearTimeout(extractionSafetyTimeoutRef.current);
      }
      // Reset extraction state on cleanup
      setIsExtracting(false);
    };
  }, [editor, triggerUpdate]);

  const extractVariables = useCallback(() => {
    try {
      if (!editor) {
        setIsExtracting(false);
        if (extractionSafetyTimeoutRef.current) {
          clearTimeout(extractionSafetyTimeoutRef.current);
          extractionSafetyTimeoutRef.current = null;
        }
        return;
      }

      // Reset processing flag if it's been stuck
      if (isProcessingRef.current) {
        isProcessingRef.current = false;
      }

      let html = editor.getHTML() || "";

      const { curlyMatches, bracketMatches, bracketToCurly } =
        extractVariablesFromContent(html);

      // Normalize bracket placeholders to curly syntax
      const normalizedHtml = normalizeBracketPlaceholders(html, bracketToCurly);
      if (normalizedHtml !== html) {
        isProcessingRef.current = true;
        editor.chain().focus().setContent(normalizedHtml, false).run();
        html = normalizedHtml;
        // Reset the flag after a short delay
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 100);
      }

      // Recompute matches after potential normalization
      const matches = html.match(/\{\{([^}]+)\}\}/g) || curlyMatches;
      const foundIds = Array.from(
        new Set(
          matches
            .map((m) => (m.slice(2, -2) || "").trim())
            .filter((id) => id.length > 0)
        )
      );

      if (foundIds.length === 0 && variables.length === 0) {
        setIsExtracting(false);
        if (extractionSafetyTimeoutRef.current) {
          clearTimeout(extractionSafetyTimeoutRef.current);
          extractionSafetyTimeoutRef.current = null;
        }
        return;
      }

      const existingIds = new Set(variables.map((v) => v.unique_id));
      const newDefs: VariableDef[] = [];

      foundIds.forEach((id) => {
        if (!existingIds.has(id)) {
          // Try to find a pretty label from bracket source, else default to id
          const prettyLabelEntry = Object.entries(bracketToCurly).find(
            ([, to]) => to === `{{${id}}}`
          );
          const label = prettyLabelEntry
            ? prettyLabelEntry[0].slice(1, -1).trim()
            : id;
          newDefs.push({ unique_id: id, label, type: "text" });
        }
      });

      if (newDefs.length > 0) {
        setVariables((prev) => [...prev, ...newDefs]);
      }

      // Update placeholder status map
      if (variables.length > 0 || newDefs.length > 0) {
        const allVars =
          newDefs.length > 0 ? [...variables, ...newDefs] : variables;
        const foundSet = new Set(
          (html.match(/\{\{[^}]+\}\}/g) || []).map((p) => p.slice(2, -2).trim())
        );
        const status: Record<string, string> = {};
        allVars.forEach((v) => {
          status[v.unique_id] = foundSet.has(v.unique_id) ? "Found" : "Missing";
        });
        setPlaceholderStatus(status);
      }

      // Clear loading state and safety timeout
      setIsExtracting(false);
      if (extractionSafetyTimeoutRef.current) {
        clearTimeout(extractionSafetyTimeoutRef.current);
        extractionSafetyTimeoutRef.current = null;
      }
    } catch (error) {
      console.error("useVariables: Error during variable extraction:", error);
      setIsExtracting(false);
      if (extractionSafetyTimeoutRef.current) {
        clearTimeout(extractionSafetyTimeoutRef.current);
        extractionSafetyTimeoutRef.current = null;
      }
    }
  }, [editor, variables]);

  // Listen to editor updates to trigger variable extraction
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      setTriggerUpdate((prev) => prev + 1);
    };

    const handleSelectionUpdate = () => {
      setTriggerUpdate((prev) => prev + 1);
    };

    const handleTransaction = () => {
      setTriggerUpdate((prev) => prev + 1);
    };

    editor.on("update", handleUpdate);
    editor.on("selectionUpdate", handleSelectionUpdate);
    editor.on("transaction", handleTransaction);

    return () => {
      editor.off("update", handleUpdate);
      editor.off("selectionUpdate", handleSelectionUpdate);
      editor.off("transaction", handleTransaction);
    };
  }, [editor]);

  const handleChangeVariableValue = useCallback((id: string, value: string) => {
    setVariableValues((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleEditVariable = useCallback((id: string | null) => {
    setEditingVariable(id);
  }, []);

  const handleClearAll = useCallback(() => {
    setVariableValues({});
    setEditingVariable(null);
    setHighlightedVariable(null);
  }, []);

  const handleForceExtraction = useCallback(() => {
    setTriggerUpdate((prev) => prev + 1);
  }, []);

  const handleVariableClick = useCallback(
    (
      variableId: string,
      showVariablesPanel: boolean,
      setShowVariablesPanel: (show: boolean) => void
    ) => {
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
    []
  );

  return {
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
    handleVariableClick,
    handleForceExtraction,
  };
};
