"use client";

import React, { useState, useRef, useEffect } from "react";
import { Download, FileDown, FileText, Upload, FileType, Edit2 } from "lucide-react";

type Props = {
  documentTitle: string;
  onDocumentTitleChange?: (title: string) => void;
  onExportPDF?: () => void;
  onExportDOCX?: () => void;
  onImportWord?: (file: File) => void;
  onImportPDF?: (file: File) => void;
  isEditingEnabled?: boolean;
};

export default function EditorHeader({
  documentTitle,
  onDocumentTitleChange,
  onExportPDF,
  onExportDOCX,
  onImportWord,
  onImportPDF,
  isEditingEnabled = true,
}: Props) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(documentTitle);
  const wordRef = React.useRef<HTMLInputElement | null>(null);
  const pdfRef = React.useRef<HTMLInputElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempTitle(documentTitle);
  }, [documentTitle]);

  const handleTitleEdit = () => {
    if (!isEditingEnabled) return;
    setIsEditingTitle(true);
    setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }, 0);
  };

  const handleTitleSave = () => {
    if (tempTitle.trim() && tempTitle !== documentTitle) {
      onDocumentTitleChange?.(tempTitle.trim());
    } else {
      setTempTitle(documentTitle);
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setTempTitle(documentTitle);
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Legal AI Advance Editor
            </h2>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-600">Document:</span>
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleKeyDown}
                className="text-sm bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0 flex-1 max-w-xs"
                placeholder="Enter document name"
              />
            ) : (
              <button
                onClick={handleTitleEdit}
                disabled={!isEditingEnabled}
                className={`text-sm font-medium flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                  isEditingEnabled
                    ? "text-blue-600 hover:bg-blue-50 cursor-pointer"
                    : "text-gray-600 cursor-default"
                }`}
                title={isEditingEnabled ? "Click to edit document name" : ""}
              >
                {documentTitle}
                {isEditingEnabled && <Edit2 size={12} />}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative group">
            <button
              title="Import"
              className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-700"
            >
              <Upload size={16} />
            </button>
            <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <button
                onClick={() => wordRef.current?.click()}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100"
              >
                <FileText size={14} /> Import Word (.docx)
              </button>
              <button
                onClick={() => pdfRef.current?.click()}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <FileType size={14} /> Import PDF (.pdf)
              </button>
            </div>
            <input
              ref={wordRef}
              type="file"
              accept=".docx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImportWord?.(f);
                if (e.target) e.target.value = "";
              }}
            />
            <input
              ref={pdfRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImportPDF?.(f);
                if (e.target) e.target.value = "";
              }}
            />
          </div>

          <div className="relative group">
            <button
              title="Export Options"
              className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-700"
            >
              <Download size={16} />
            </button>
            <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <button
                onClick={onExportPDF}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100"
              >
                <FileDown size={14} /> Export as PDF
              </button>
              <button
                onClick={onExportDOCX}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <FileText size={14} /> Export as DOCX
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
