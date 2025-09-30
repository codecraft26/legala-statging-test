"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Upload, Plus } from "lucide-react";

interface DragDropAreaProps {
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accept?: string;
}

export default function DragDropArea({
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileChange,
  accept = ".pdf,.doc,.docx,.txt,.xlsx,.xls",
}: DragDropAreaProps) {
  return (
    <div
      className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-200 flex-1 ${
        isDragging
          ? "border-blue-400 bg-blue-50"
          : "border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100"
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        type="file"
        multiple
        onChange={onFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        accept={accept}
      />
      <div className="flex flex-col items-center justify-center text-center">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
            isDragging ? "bg-blue-100" : "bg-white"
          }`}
        >
          <Upload className={`w-8 h-8 ${isDragging ? "text-blue-500" : "text-gray-400"}`} />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">
            {isDragging ? "Drop your files here" : "Choose files or drag & drop"}
          </h3>
          <p className="text-sm text-gray-500">Supports PDF, DOC, DOCX, TXT, XLS, XLSX up to 10MB each</p>
        </div>
        <Button type="button" variant="outline" className="mt-6">
          <Plus className="w-4 h-4 mr-2" />
          Browse Files
        </Button>
      </div>
    </div>
  );
}


