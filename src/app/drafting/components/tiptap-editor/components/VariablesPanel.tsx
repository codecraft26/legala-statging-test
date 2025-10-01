"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  Check,
  Plus,
  X,
  Edit3,
  Save,
  RefreshCw,
  Trash2,
  Eye,
  Download,
  FileText,
} from "lucide-react";
import { Api } from "@/lib/api-client";

export type VariableDef = {
  unique_id: string;
  label: string;
  type?: "text" | "date" | "decimal" | "number";
};

type Props = {
  variables: VariableDef[];
  values: Record<string, string>;
  placeholderStatus: Record<string, string>;
  editingVariable?: string | null;
  highlightedVariable?: string | null;
  inputRefs?: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  onChangeValue: (id: string, value: string) => void;
  onEditVariable?: (id: string | null) => void;
  onInsertPlaceholder: (id: string) => void;
  onApplyAllVariables?: () => void;
  onSaveDocument?: () => void;
  onSaveWithVariablesReplaced?: () => void;
  onPreviewFinal?: () => void;
  onSaveDraftToDocument?: (
    fileName: string,
    workspaceId: string,
    fileFormat: "docx" | "pdf" | "txt"
  ) => void;
  onClearAll: () => void;
};

export default function VariablesPanel({
  variables,
  values,
  placeholderStatus,
  editingVariable,
  highlightedVariable,
  inputRefs,
  onChangeValue,
  onEditVariable,
  onInsertPlaceholder,
  onApplyAllVariables,
  onSaveDocument: _onSaveDocument,
  onSaveWithVariablesReplaced: _onSaveWithVariablesReplaced,
  onPreviewFinal,
  onSaveDraftToDocument,
  onClearAll,
}: Props) {
  const [showCustom, setShowCustom] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [showSaveDraftModal, setShowSaveDraftModal] = useState(false);
  const [saveDraftForm, setSaveDraftForm] = useState({
    fileName: "",
    workspaceId: "",
    fileFormat: "docx" as "docx" | "pdf" | "txt",
  });
  const [workspaces, setWorkspaces] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch workspaces when modal opens
  const fetchWorkspaces = async () => {
    try {
      const workspacesData = await Api.get<Array<{ id: string; name: string }>>(
        "legal-api/get-workspaces"
      );
      setWorkspaces(workspacesData);
    } catch (error) {
      console.error("Error fetching workspaces:", error);
    }
  };

  // Handle save draft to document
  const handleSaveDraftToDocument = async () => {
    if (!saveDraftForm.fileName.trim() || !saveDraftForm.workspaceId) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      // First, we need to create a draft in the backend
      // This would typically happen when the user generates content
      // For now, we'll assume we have the content and call the save API directly

      if (onSaveDraftToDocument) {
        onSaveDraftToDocument(
          saveDraftForm.fileName,
          saveDraftForm.workspaceId,
          saveDraftForm.fileFormat
        );
      }

      setShowSaveDraftModal(false);
      setSaveDraftForm({ fileName: "", workspaceId: "", fileFormat: "docx" });
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("Failed to save draft as document");
    } finally {
      setIsSaving(false);
    }
  };

  // Open save draft modal
  const openSaveDraftModal = () => {};

  return (
    <div className="h-full bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 pb-28 space-y-3">
        {variables.length === 0 ? (
          <div className="text-sm text-gray-500 text-center">
            No variables defined. Import a document to add variables.
          </div>
        ) : (
          variables.map((variable) => (
            <div
              key={variable.unique_id}
              className={`bg-gray-50 rounded-lg p-3 transition-all duration-300 ${
                highlightedVariable === variable.unique_id
                  ? "bg-gray-100 border-2 border-gray-400 shadow-lg transform scale-105"
                  : "border border-transparent"
              }`}
              data-variable-id={variable.unique_id}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  {variable.label}
                </label>
                <div className="flex items-center space-x-1">
                  {editingVariable === variable.unique_id ? (
                    <button
                      onClick={() => onEditVariable?.(null)}
                      className="p-1 text-green-600 hover:text-green-700"
                      title="Save"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onEditVariable?.(variable.unique_id)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {editingVariable === variable.unique_id ? (
                variable.type === "date" ? (
                  <input
                    type="date"
                    value={values[variable.unique_id] || ""}
                    onChange={(e) =>
                      onChangeValue(variable.unique_id, e.target.value)
                    }
                    ref={(el) => {
                      if (inputRefs) inputRefs.current[variable.unique_id] = el;
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                ) : variable.type === "decimal" ? (
                  <input
                    type="number"
                    step="0.01"
                    value={values[variable.unique_id] || ""}
                    onChange={(e) =>
                      onChangeValue(variable.unique_id, e.target.value)
                    }
                    ref={(el) => {
                      if (inputRefs) inputRefs.current[variable.unique_id] = el;
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                ) : (
                  <input
                    type="text"
                    value={values[variable.unique_id] || ""}
                    onChange={(e) =>
                      onChangeValue(variable.unique_id, e.target.value)
                    }
                    ref={(el) => {
                      if (inputRefs) inputRefs.current[variable.unique_id] = el;
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                )
              ) : (
                <div className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm min-h-[40px] flex items-center">
                  <span className="break-words">
                    {values[variable.unique_id] || `{{${variable.unique_id}}}`}
                  </span>
                </div>
              )}

              <div className="mt-2 text-xs text-gray-500">
                Type: {variable.type} | ID: {variable.unique_id} | Status:{" "}
                {placeholderStatus[variable.unique_id] || "Unknown"}
              </div>

              {placeholderStatus[variable.unique_id] === "Missing" && (
                <button
                  onClick={() => onInsertPlaceholder(variable.unique_id)}
                  className="mt-2 w-full px-2 py-1 text-xs text-black hover:text-gray-900 border border-gray-300 hover:border-gray-500 rounded-md flex items-center justify-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Insert {`{{${variable.unique_id}}}`} Placeholder</span>
                </button>
              )}
            </div>
          ))
        )}

        {variables.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-md">
              <strong>Actions:</strong> Preview to check final result, Apply variables to see changes.
            </div>
            
            {onPreviewFinal && (
              <button
                onClick={onPreviewFinal}
                className="w-full px-4 py-2 bg-black text-white rounded-md hover:bg-zinc-800 flex items-center justify-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
            )}
            
            {onApplyAllVariables && (
              <button
                onClick={onApplyAllVariables}
                className="w-full px-4 py-2 bg-black text-white rounded-md hover:bg-zinc-800 flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Apply All Variables</span>
              </button>
            )}
          </div>
        )}
      </div>
      {/* Bottom spacer to prevent last button from being cut off */}
      <div className="flex-shrink-0 h-4" />
    </div>
  );
}
