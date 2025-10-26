"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { type AssistantChat } from "@/hooks/use-assistant";
import { useChatLogic } from "../hooks/useChatLogic";
import { MessageBubble } from "./MessageBubble";
import { FileUploadModal } from "./FileUploadModal";
import { ChatInput } from "./ChatInput";
import { DocumentList } from "./DocumentList";
import { StreamingMessage } from "./StreamingMessage";

interface ChatInterfaceProps {
  workspaceId: string;
  currentChat?: AssistantChat | null;
  onChatCreated?: (chat: AssistantChat) => void;
  onCloseSession?: () => void;
}

export function ChatInterface({ workspaceId, currentChat, onChatCreated, onCloseSession }: ChatInterfaceProps) {
  const {
    // State
    inputMessage,
    setInputMessage,
    selectedModel,
    uploadedFiles,
    conversations,
    isLoading,
    isStreaming,
    streamingMessage,
    showFileUpload,
    isCreatingChat,
    conversationsLoading,
    chatDetail,
    availableFiles,
    messagesEndRef,
    
    // Actions
    handleChangeModel,
    handleFileUpload,
    handleSendMessage,
    handleKeyPress,
    removeFile,
    addExistingFile,
    selectFilesForChat,
    setShowFileUpload,
  } = useChatLogic({ workspaceId, currentChat, onChatCreated });


  return (
    <div className="flex flex-col h-full">
      {/* Associated Documents */}
      <DocumentList currentChat={currentChat} chatDetail={chatDetail} />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 streaming-container min-h-0">
        {conversations.length === 0 && !isStreaming && !conversationsLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 flex items-center justify-center mx-auto">
                <img 
                  src="/logo.png" 
                  alt="Infrahive" 
                  className="w-16 h-16 object-contain"
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold">How can I help you today?</h3>
                <p className="text-muted-foreground">
                  Upload documents and ask questions to get started
                </p>
              </div>
            </div>
          </div>
        )}

        {conversationsLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading conversation...</span>
            </div>
          </div>
        )}

        {conversations.map((conversation) => (
          <MessageBubble 
            key={conversation.id} 
            conversation={conversation} 
            currentChat={currentChat} 
          />
        ))}

        {/* Streaming Message */}
        {isStreaming && <StreamingMessage streamingMessage={streamingMessage} />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative flex-shrink-0">
        <ChatInput
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          selectedModel={selectedModel}
          onModelChange={handleChangeModel}
          uploadedFiles={uploadedFiles}
          isLoading={isLoading}
          isStreaming={isStreaming}
          isCreatingChat={isCreatingChat}
          showFileUpload={showFileUpload}
          onSendMessage={handleSendMessage}
          onKeyPress={handleKeyPress}
          onToggleFileUpload={() => setShowFileUpload(!showFileUpload)}
        />

        {/* File Upload Modal */}
        <FileUploadModal
          isOpen={showFileUpload}
          onClose={() => setShowFileUpload(false)}
          currentChat={currentChat}
          chatDetail={chatDetail}
          uploadedFiles={uploadedFiles}
          isLoading={isLoading}
          onFileUpload={handleFileUpload}
          onRemoveFile={removeFile}
        />
      </div>
    </div>
  );
}
