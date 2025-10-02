"use client";

import React, { useRef } from "react";
import { Upload, X } from "lucide-react";

interface UploadAreaProps {
  isOpen: boolean;
  isUploading: boolean;
  isDragOver: boolean;
  onClose: () => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onSelectFiles: (files: FileList | null) => void;
  accept?: string;
}

export default function UploadArea({
  isOpen,
  isUploading,
  isDragOver,
  onClose,
  onDragOver,
  onDragLeave,
  onDrop,
  onSelectFiles,
  accept = ".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif",
}: UploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  if (!isOpen) return null;

  return (
    <div className="mt-4 relative">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        title="Close"
      >
        <X className="h-4 w-4" />
      </button>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center ${isDragOver ? "border-blue-500 bg-blue-50" : "border-muted bg-accent"} ${isUploading ? "opacity-60 pointer-events-none" : ""}`}
      >
        <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
        <h3 className="text-sm mt-2">
          {isUploading ? "Uploading…" : "Upload Files"}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Drag and drop or click to browse
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="rounded-md border px-3 py-2 text-sm hover:bg-accent"
        >
          {isUploading ? "Uploading…" : "Choose Files"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => onSelectFiles(e.target.files)}
          className="hidden"
          accept={accept}
        />
      </div>
    </div>
  );
}
