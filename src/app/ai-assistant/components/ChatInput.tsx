"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Paperclip,
  Loader2,
  MessageSquare, 
  FileText, 
  Search,
  StopCircle
} from "lucide-react";
import { type AssistantFile } from "@/hooks/use-assistant";

const modelConfig = {
  general: {
    label: "General",
    icon: MessageSquare,
    description: "Interactive Q&A with documents"
  },
  summary: {
    label: "Summary",
    icon: FileText,
    description: "Generate document summaries"
  },
  extract: {
    label: "Extract",
    icon: Search,
    description: "Extract key information"
  }
} as const;

type ModelType = keyof typeof modelConfig;

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (message: string) => void;
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  uploadedFiles: AssistantFile[];
  isLoading: boolean;
  isStreaming: boolean;
  isCreatingChat: boolean;
  showFileUpload: boolean;
  onSendMessage: () => void;
  onStopProcessing: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onToggleFileUpload: () => void;
  allowModelSwitching?: boolean;
  allowFileUpload?: boolean;
  forceModel?: ModelType;
}

export function ChatInput({
  inputMessage,
  setInputMessage,
  selectedModel,
  onModelChange,
  uploadedFiles,
  isLoading,
  isStreaming,
  isCreatingChat,
  showFileUpload,
  onSendMessage,
  onStopProcessing,
  onKeyPress,
  onToggleFileUpload,
  allowModelSwitching = true,
  allowFileUpload = true,
  forceModel,
}: ChatInputProps) {
  const canSwitchModel = allowModelSwitching && !forceModel;
  const showUploadButton = allowFileUpload !== false;

  return (
    <div className="flex-shrink-0 p-4 border-t relative">
      <div className="flex items-center gap-2">
        {showUploadButton && (
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleFileUpload}
            title="Upload documents"
            data-upload-button
          >
            <Paperclip className="w-4 h-4" />
          </Button>
        )}
        
        {/* Editable model selector to allow changing chat type */}
        {canSwitchModel ? (
          <Select value={selectedModel} onValueChange={onModelChange}>
            <SelectTrigger className="w-32">
              {React.createElement(modelConfig[selectedModel].icon, { className: "w-4 h-4" })}
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(modelConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <span>{config.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="w-32 flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground bg-muted/50">
            {React.createElement(modelConfig[selectedModel].icon, { className: "w-3.5 h-3.5" })}
            <span>{modelConfig[selectedModel].label}</span>
          </div>
        )}
        
        <Input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder={isCreatingChat ? "Creating chat..." : "Type your message..."}
          disabled={isLoading || isStreaming || isCreatingChat}
          className="flex-1"
        />
        
        {isStreaming ? (
          <Button
            onClick={onStopProcessing}
            variant="destructive"
            size="icon"
            title="Stop processing"
          >
            <StopCircle className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={onSendMessage}
            disabled={!inputMessage.trim() || isLoading || isCreatingChat}
            size="icon"
          >
            {isLoading || isCreatingChat ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>
      
      {uploadedFiles.length > 0 && (
        <div className="mt-2 flex items-center gap-1 flex-wrap">
          <span className="text-xs text-muted-foreground">Files:</span>
          {uploadedFiles.map((file) => (
            <Badge key={file.fileId} variant="secondary" className="text-xs px-2 py-1" title={file.name}>
              {file.name.length > 20 ? file.name.substring(0, 20) + "..." : file.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
