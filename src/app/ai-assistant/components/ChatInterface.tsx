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
import { Reasoning, ReasoningTrigger, ReasoningContent } from "@/components/ui/shadcn-io/ai/reasoning";

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
    handleStopProcessing,
    handleKeyPress,
    removeFile,
    addExistingFile,
    selectFilesForChat,
    setShowFileUpload,
    handleToggleChatFileRequired,
    togglingChatFileId,
  } = useChatLogic({ workspaceId, currentChat, onChatCreated });


  return (
    <div className="flex flex-col h-full">
      {/* Associated Documents */}
      <DocumentList currentChat={currentChat} chatDetail={chatDetail} />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 streaming-container min-h-0">
        {conversations.length === 0 && !isStreaming && !conversationsLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <div className="w-24 h-24 flex items-center justify-center mx-auto">
                <img
                  src="/logo.png"
                  alt="Infrahive"
                  className="w-24 h-24 object-contain opacity-80"
                />
              </div>
              <h3 className="text-xl font-semibold">How may I help you today?</h3>
              <p className="text-sm text-muted-foreground">Upload documents and ask questions to get started.</p>
            </div>
          </div>
        )}
        {conversations.length === 0 && isStreaming && !conversationsLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 flex items-center justify-center mx-auto">
                <img src="/logo.png" alt="Infrahive" className="w-20 h-20 object-contain opacity-80" />
              </div>
              <div className="max-w-sm mx-auto">
                <Reasoning isStreaming={true} defaultOpen={false}>
                  <ReasoningTrigger title="Thinking" />
                  <ReasoningContent>{"Processing your files and preparing a response..."}</ReasoningContent>
                </Reasoning>
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
        {isStreaming && (
          <StreamingMessage
            streamingMessage={streamingMessage}
            currentChatType={currentChat?.type}
            isStreaming={isStreaming}
          />
        )}

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
          onStopProcessing={handleStopProcessing}
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
          onToggleChatFile={handleToggleChatFileRequired}
          togglingChatFileId={togglingChatFileId}
        />
      </div>
    </div>
  );
}
