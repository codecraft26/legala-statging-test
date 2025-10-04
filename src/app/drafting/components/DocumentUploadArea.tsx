"use client";

import React, { useRef } from "react";
import { CloudUpload, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentUploadAreaProps {
  isDragOver: boolean;
  isLoading: boolean;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onFileSelect: (files: FileList | null) => void;
  className?: string;
}

export default function DocumentUploadArea({
  isDragOver,
  isLoading,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  className = "",
}: DocumentUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
    if (e.target) e.target.value = "";
  };

  return (
    <div
      className={`flex items-center justify-center min-h-[300px] ${className}`}
    >
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`w-full max-w-4xl border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          isDragOver
            ? "border-blue-500 bg-blue-50 scale-105"
            : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
        } ${isLoading ? "opacity-60 pointer-events-none" : "cursor-pointer"}`}
        onClick={() => !isLoading && fileInputRef.current?.click()}
      >
        <CloudUpload
          className={`h-12 w-12 mx-auto mb-3 transition-colors ${
            isDragOver ? "text-blue-500" : "text-gray-400"
          }`}
        />
        <h3 className="text-lg font-semibold mb-2 text-gray-800">
          {isLoading ? "Uploading..." : "Drop files here"}
        </h3>
        <p className="text-gray-600 mb-3 text-sm">or click to browse files</p>
        <p className="text-xs text-gray-500 mb-2">
          PDF, DOC, DOCX, TXT, JPG, PNG, GIF
        </p>
        <p className="text-xs text-amber-600 mb-4 bg-amber-50 p-2 rounded border">
          📄 Note: All files will be uploaded to DataHub for storage and
          organization
        </p>
        <Button
          disabled={isLoading}
          className="bg-black text-white hover:bg-zinc-800 px-4 py-2"
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Choose Files
            </>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
        />
      </div>
    </div>
  );
}
