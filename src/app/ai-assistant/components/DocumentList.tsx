"use client";

import React from "react";
import { Paperclip } from "lucide-react";

interface DocumentListProps {
  currentChat?: {
    id: string;
    name: string;
    type: string;
    userId: string;
    workspaceId: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  chatDetail?: {
    data: {
      files: Array<{
        id: string;
        fileId: string;
        file: {
          id: string;
          name: string;
          fileId: string;
        };
      }>;
    };
  } | null;
}

export function DocumentList({ currentChat, chatDetail }: DocumentListProps) {
  if (!currentChat || !chatDetail?.data?.files || chatDetail.data.files.length === 0) {
    return null;
  }

  return (
    <div className="flex-shrink-0 px-4 pb-1">
      <div className="bg-muted/30 rounded-md p-2">
        <div className="flex items-center gap-1 mb-1">
          <Paperclip className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Documents</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {chatDetail.data.files.map((fileAttachment) => (
            <div key={fileAttachment.id} className="flex items-center gap-1 px-1.5 py-0.5 bg-background rounded border text-xs text-muted-foreground">
              <span className="truncate max-w-[120px]" title={fileAttachment.file.name}>
                {fileAttachment.file.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
