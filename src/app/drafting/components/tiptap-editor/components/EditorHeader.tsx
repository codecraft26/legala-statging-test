"use client";

import React, { useState, useRef, useEffect } from "react";
import { Download, FileDown, FileText, Upload, FileType, Edit2, Save } from "lucide-react";

type Props = {
  documentTitle: string;
  onDocumentTitleChange?: (title: string) => void;
  onExportPDF?: () => void;
  onExportDOCX?: () => void;
  onImportWord?: (file: File) => void;
  onImportPDF?: (file: File) => void;
  isEditingEnabled?: boolean;
  onSave?: () => void;
  isSaving?: boolean;
};

export default function EditorHeader({
  documentTitle,
  onDocumentTitleChange,
  onExportPDF,
  onExportDOCX,
  onImportWord,
  onImportPDF,
  isEditingEnabled = true,
  onSave,
  isSaving,
}: Props) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(documentTitle);
  const [showImportDropdown, setShowImportDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const wordRef = React.useRef<HTMLInputElement | null>(null);
  const pdfRef = React.useRef<HTMLInputElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (importRef.current && !importRef.current.contains(event.target as Node)) {
        setShowImportDropdown(false);
      }
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleImportClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowImportDropdown(!showImportDropdown);
    setShowExportDropdown(false); // Close export dropdown if open
  };

  const handleExportClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowExportDropdown(!showExportDropdown);
    setShowImportDropdown(false); // Close import dropdown if open
  };

  const handleImportWord = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    wordRef.current?.click();
    setShowImportDropdown(false);
  };

  const handleImportPDF = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    pdfRef.current?.click();
    setShowImportDropdown(false);
  };

  const handleExportPDF = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onExportPDF?.();
    setShowExportDropdown(false);
  };

  const handleExportDOCX = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onExportDOCX?.();
    setShowExportDropdown(false);
  };
  return (
    <div className="bg-white px-6 py-4 border-b border-gray-200">
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
                className="text-sm bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent min-w-0 flex-1 max-w-xs"
                placeholder="Enter document name"
              />
            ) : (
              <button
                onClick={handleTitleEdit}
                disabled={!isEditingEnabled}
                className={`text-sm font-medium flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                  isEditingEnabled
                    ? "text-black hover:bg-gray-100 cursor-pointer"
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
          {onSave && (
            <button
              title={isSaving ? "Saving..." : "Save"}
              onClick={onSave}
              disabled={Boolean(isSaving)}
              className="px-3 py-2 rounded-md bg-black text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              type="button"
            >
              <span className="inline-flex items-center gap-1">
                <Save size={14} />
                <span className="hidden sm:inline">{isSaving ? "Saving..." : "Save"}</span>
                <span className="sm:hidden">{isSaving ? "..." : ""}</span>
              </span>
            </button>
          )}
          <div ref={importRef} className="relative">
            <button
              title="Import"
              onClick={handleImportClick}
              className={`p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-700 ${
                showImportDropdown ? 'bg-gray-100' : ''
              }`}
            >
              <Upload size={16} />
            </button>
            {showImportDropdown && (
              <div 
                className="absolute top-full right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 opacity-100 visible transform scale-100 transition-all duration-200 ease-out pointer-events-auto"
                style={{ zIndex: 9999 }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={handleImportWord}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 rounded-t-lg transition-colors cursor-pointer"
                  type="button"
                >
                  <FileText size={14} /> Import Word (.docx)
                </button>
                <button
                  onClick={handleImportPDF}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 rounded-b-lg transition-colors cursor-pointer"
                  type="button"
                >
                  <FileType size={14} /> Import PDF (.pdf)
                </button>
              </div>
            )}
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

          <div ref={exportRef} className="relative">
            <button
              title="Export Options"
              onClick={handleExportClick}
              className={`p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-700 ${
                showExportDropdown ? 'bg-gray-100' : ''
              }`}
            >
              <Download size={16} />
            </button>
            {showExportDropdown && (
              <div 
                className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 opacity-100 visible transform scale-100 transition-all duration-200 ease-out pointer-events-auto"
                style={{ zIndex: 9999 }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={handleExportPDF}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 rounded-t-lg transition-colors cursor-pointer"
                  type="button"
                >
                  <FileDown size={14} /> Export as PDF
                </button>
                <button
                  onClick={handleExportDOCX}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 rounded-b-lg transition-colors cursor-pointer"
                  type="button"
                >
                  <FileText size={14} /> Export as DOCX
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
