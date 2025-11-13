"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import {
  type AssistantFile,
  type AssistantChat,
  type ChatFileAttachment,
} from "@/hooks/use-assistant";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentChat?: AssistantChat | null;
  chatDetail?: {
    data: {
      files: ChatFileAttachment[];
    };
  } | null;
  uploadedFiles: AssistantFile[];
  isLoading: boolean;
  onFileUpload: (files: FileList | null) => void;
  onRemoveFile: (fileId: string) => void;
  onToggleChatFile?: (chatFileId: string, required: boolean) => void;
  togglingChatFileId?: string | null;
}

export function FileUploadModal({
  isOpen,
  onClose,
  currentChat,
  chatDetail,
  uploadedFiles,
  isLoading,
  onFileUpload,
  onRemoveFile,
  onToggleChatFile,
  togglingChatFileId,
}: FileUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 bg-background border rounded-lg shadow-lg p-2 max-h-56 overflow-y-auto z-10 w-72" data-file-upload-modal>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium">
          {currentChat ? "Chat Documents" : "Upload Documents"}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-5 w-5 p-0"
        >
          <X className="w-2.5 h-2.5" />
        </Button>
      </div>
      
      <div className="space-y-2">
        {/* Upload New File Option */}
        <div className="space-y-1">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => onFileUpload(e.target.files)}
            className="hidden"
          />
          
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full h-7 text-xs"
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Upload className="w-3 h-3 mr-1" />
            )}
            {currentChat ? "Add Files" : "Choose Files"}
          </Button>
        </div>

        {/* Select from Existing Files - Only show for existing chats */}
        {currentChat && chatDetail?.data?.files && chatDetail.data.files.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground">Documents in this Chat</h4>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {chatDetail.data.files.map((fileAttachment) => (
                <label
                  key={fileAttachment.id}
                  className="flex items-center gap-2 p-1.5 bg-muted/50 rounded text-xs cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5"
                    checked={!!fileAttachment.required}
                    onChange={(e) =>
                      onToggleChatFile?.(fileAttachment.id, e.target.checked)
                    }
                    disabled={
                      !onToggleChatFile ||
                      togglingChatFileId === fileAttachment.id
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <span
                      className="truncate flex-1"
                      title={fileAttachment.file.name}
                    >
                      {fileAttachment.file.name.length > 25
                        ? fileAttachment.file.name.substring(0, 25) + "..."
                        : fileAttachment.file.name}
                    </span>
                    <div className="text-[10px] text-muted-foreground">
                      {fileAttachment.required
                        ? "Included in next prompt"
                        : "Excluded"}
                    </div>
                  </div>
                  {togglingChatFileId === fileAttachment.id ? (
                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  ) : null}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Selected Files - Only show for new chats */}
        {!currentChat && uploadedFiles.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground">Selected Files</h4>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {uploadedFiles.map((file) => (
                <div key={file.fileId} className="flex items-center justify-between p-1.5 bg-primary/10 rounded text-xs">
                  <span className="truncate flex-1" title={file.name}>
                    {file.name.length > 25 ? file.name.substring(0, 25) + "..." : file.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveFile(file.fileId)}
                    className="ml-1 h-4 w-4 p-0"
                  >
                    <X className="w-2.5 h-2.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
