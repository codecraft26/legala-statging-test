"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { X, FileText } from "lucide-react";
import { formatFileSize } from "./file-utils";
import { TruncatedFilename } from "@/components/ui/truncated-filename";

interface SelectedFilesListProps {
  files: { file: File }[];
  onRemove: (index: number) => void;
}

export default function SelectedFilesList({
  files,
  onRemove,
}: SelectedFilesListProps) {
  if (!files?.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-gray-900">
        Selected Files ({files.length})
      </h3>
      <div className="space-y-2">
        {files.map((file, index) => (
          <div
            key={index}
            className="group flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  <TruncatedFilename
                    filename={file.file.name}
                    maxLength={20}
                    showExtension={true}
                  />
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.file.size)}
                </p>
              </div>
            </div>
            <Button
              onClick={() => onRemove(index)}
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
