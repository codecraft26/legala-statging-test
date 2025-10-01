import { useState, useEffect, useCallback, useRef } from "react";
import { Editor } from "@tiptap/react";
import { VariableDef } from "../types";
import { 
  extractVariablesFromContent, 
  normalizeBracketPlaceholders 
} from "../utils";

export const useVariables = (editor: Editor | null, content: string) => {
  const [variables, setVariables] = useState<VariableDef[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [placeholderStatus, setPlaceholderStatus] = useState<Record<string, string>>({});
  const [editingVariable, setEditingVariable] = useState<string | null>(null);
  const [highlightedVariable, setHighlightedVariable] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Derive variables from content placeholders like {{variable_id}}
  useEffect(() => {
    if (!editor) return;
    
    let html = editor.getHTML() || "";
    const { curlyMatches, bracketMatches, bracketToCurly } = extractVariablesFromContent(html);

    // Normalize bracket placeholders to curly syntax
    const normalizedHtml = normalizeBracketPlaceholders(html, bracketToCurly);
    if (normalizedHtml !== html) {
      editor.chain().focus().setContent(normalizedHtml, false).run();
      html = normalizedHtml;
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

    if (foundIds.length === 0 && variables.length === 0) return;

    const existingIds = new Set(variables.map((v) => v.unique_id));
    const newDefs: VariableDef[] = [];
    
    foundIds.forEach((id) => {
      if (!existingIds.has(id)) {
        // Try to find a pretty label from bracket source, else default to id
        const prettyLabelEntry = Object.entries(bracketToCurly).find(
          ([, to]) => to === `{{${id}}}`
        );
        const label = prettyLabelEntry ? prettyLabelEntry[0].slice(1, -1).trim() : id;
        newDefs.push({ unique_id: id, label, type: "text" });
      }
    });

    if (newDefs.length > 0) {
      setVariables((prev) => [...prev, ...newDefs]);
    }

    // Update placeholder status map
    if (variables.length > 0 || newDefs.length > 0) {
      const allVars = newDefs.length > 0 ? [...variables, ...newDefs] : variables;
      const foundSet = new Set(
        (html.match(/\{\{[^}]+\}\}/g) || []).map((p) => p.slice(2, -2).trim())
      );
      const status: Record<string, string> = {};
      allVars.forEach((v) => {
        status[v.unique_id] = foundSet.has(v.unique_id) ? "Found" : "Missing";
      });
      setPlaceholderStatus(status);
    }
  }, [editor, content, variables]);

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

  const handleVariableClick = useCallback(
    (variableId: string, showVariablesPanel: boolean, setShowVariablesPanel: (show: boolean) => void) => {
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
    inputRefs,
    handleChangeVariableValue,
    handleEditVariable,
    handleClearAll,
    handleVariableClick,
  };
};
