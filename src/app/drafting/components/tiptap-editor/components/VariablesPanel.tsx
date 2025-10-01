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
  onSaveDocument,
  onSaveWithVariablesReplaced,
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
  const openSaveDraftModal = () => {
    setShowSaveDraftModal(true);
    fetchWorkspaces();
  };

  return (
    <div className="h-full bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                  ? "bg-blue-100 border-2 border-blue-300 shadow-lg transform scale-105"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="mt-2 w-full px-2 py-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-300 hover:border-blue-500 rounded-md flex items-center justify-center space-x-1"
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
              <strong>Actions:</strong> Apply variables to see changes, Preview
              to check final result, Save Template to keep variables, Save Final
              to replace all variables permanently.
            </div>
            {onApplyAllVariables && (
              <button
                onClick={onApplyAllVariables}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Apply All Variables</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              {onPreviewFinal && (
                <button
                  onClick={onPreviewFinal}
                  className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center justify-center space-x-1 text-sm"
                >
                  <Eye className="w-3 h-3" />
                  <span>Preview</span>
                </button>
              )}
              {onSaveDocument && (
                <button
                  onClick={onSaveDocument}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center space-x-1 text-sm"
                >
                  <Save className="w-3 h-3" />
                  <span>Save Template</span>
                </button>
              )}
            </div>

            {onSaveWithVariablesReplaced && (
              <button
                onClick={onSaveWithVariablesReplaced}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center justify-center space-x-2 font-semibold"
              >
                <Download className="w-4 h-4" />
                <span>Save Final Document</span>
              </button>
            )}

            {/* Save as Draft Button */}
            <button
              onClick={openSaveDraftModal}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Save as Draft</span>
            </button>
          </div>
        )}
      </div>

      {/* Save Draft Modal */}
      {showSaveDraftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Save as Draft
              </h3>
              <button
                onClick={() => setShowSaveDraftModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* File Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Name *
                </label>
                <input
                  type="text"
                  value={saveDraftForm.fileName}
                  onChange={(e) =>
                    setSaveDraftForm((prev) => ({
                      ...prev,
                      fileName: e.target.value,
                    }))
                  }
                  placeholder="Enter file name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Workspace Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workspace *
                </label>
                <select
                  value={saveDraftForm.workspaceId}
                  onChange={(e) =>
                    setSaveDraftForm((prev) => ({
                      ...prev,
                      workspaceId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a workspace</option>
                  {workspaces.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Format
                </label>
                <select
                  value={saveDraftForm.fileFormat}
                  onChange={(e) =>
                    setSaveDraftForm((prev) => ({
                      ...prev,
                      fileFormat: e.target.value as "docx" | "pdf" | "txt",
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="docx">DOCX (Word Document)</option>
                  <option value="pdf">PDF (Portable Document)</option>
                  <option value="txt">TXT (Plain Text)</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSaveDraftModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDraftToDocument}
                disabled={
                  isSaving ||
                  !saveDraftForm.fileName.trim() ||
                  !saveDraftForm.workspaceId
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Save Draft</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
