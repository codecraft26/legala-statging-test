"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Upload, 
  MessageSquare, 
  FileText, 
  BarChart3, 
  Search,
  Bot,
  User,
  Loader2,
  Paperclip,
  X,
  XCircle
} from "lucide-react";
import { useUploadAssistantFiles, useCreateAssistantChat, useAssistantConversations, useStreamAssistantResponse, useAssistantFiles, useAttachFilesToChat, useAssistantChatDetail, useUpdateAssistantChat, type AssistantFile, type AssistantChat, type Conversation } from "@/hooks/use-assistant";
import { useQueryClient } from "@tanstack/react-query";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface ChatInterfaceProps {
  workspaceId: string;
  currentChat?: AssistantChat | null;
  onChatCreated?: (chat: AssistantChat) => void;
  onCloseSession?: () => void;
}

const modelConfig = {
  general: {
    label: "General",
    icon: MessageSquare,
    description: "Interactive Q&A with documents"
  },
  analyse: {
    label: "Analyze",
    icon: BarChart3,
    description: "Compare and analyze documents"
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

export function ChatInterface({ workspaceId, currentChat, onChatCreated, onCloseSession }: ChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModelType>("general");
  const [uploadedFiles, setUploadedFiles] = useState<AssistantFile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [showFileUpload, setShowFileUpload] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const uploadFilesMutation = useUploadAssistantFiles();
  const createChatMutation = useCreateAssistantChat();
  const attachFilesMutation = useAttachFilesToChat();
  const updateChatMutation = useUpdateAssistantChat();
  const { streamResponse } = useStreamAssistantResponse();
  const { data: existingConversations, isLoading: conversationsLoading, refetch: refetchConversations } = useAssistantConversations(currentChat?.id || "");
  const { data: availableFiles } = useAssistantFiles(workspaceId);
  const { data: chatDetail } = useAssistantChatDetail(currentChat?.id || "");

  // Load existing conversations when chat changes
  useEffect(() => {
    if (existingConversations) {
      setConversations(existingConversations);
    } else {
      setConversations([]);
    }
  }, [existingConversations]);

  // Refetch conversations when currentChat changes and update selected model
  useEffect(() => {
    if (currentChat?.id) {
      console.log("Chat changed, refetching conversations for:", currentChat.id);
      refetchConversations();
      
      // Update selected model to match the chat's type
      if (currentChat.type && currentChat.type in modelConfig) {
        setSelectedModel(currentChat.type as ModelType);
      }
    }
  }, [currentChat?.id, currentChat?.type, refetchConversations]);

  // Change model type (PATCH /assistant/chat?id=...)
  const handleChangeModel = async (value: ModelType) => {
    setSelectedModel(value);
    if (currentChat?.id && workspaceId) {
      try {
        await updateChatMutation.mutateAsync({
          chatId: currentChat.id,
          workspaceId,
          updates: { name: currentChat.name, type: value },
        });
      } catch {}
    }
  };


  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, streamingMessage]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      setIsLoading(true);
      const fileArray = Array.from(files);
      const result = await uploadFilesMutation.mutateAsync({
        files: fileArray,
        workspaceId
      });
      setUploadedFiles(prev => [...prev, ...result]);
    } catch (error) {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const message = inputMessage.trim();
    setInputMessage("");

    try {
      setIsLoading(true);

      let chatToUse = currentChat;

      // If no chat exists, create one first
      if (!chatToUse) {
        try {
          const chatName = message.length > 50 ? message.substring(0, 50) + "..." : message;
          console.log("Creating chat with name:", chatName);
          console.log("Files to attach:", uploadedFiles.map(f => f.fileId));
          
          const newChat = await createChatMutation.mutateAsync({
            name: chatName,
            type: selectedModel,
            workspaceId,
            fileIds: uploadedFiles.map(f => f.fileId)
          });
          
          console.log("Created new chat:", newChat);
          
          onChatCreated?.(newChat);
          chatToUse = newChat;
          
          // Wait a moment for the chat to be properly created and set
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Force refetch conversations for the new chat
          queryClient.invalidateQueries({
            queryKey: ["assistant", "conversations", newChat.id]
          });
          
          // Also manually refetch to ensure conversations are loaded
          setTimeout(() => {
            refetchConversations();
          }, 300);
        } catch (error) {
          console.error("Failed to create chat:", error);
          throw error;
        }
      }

      // Add user message to conversations
      const userMessage: Conversation = {
        id: Date.now().toString(),
        content: message,
        role: "user",
        chatId: chatToUse.id,
        userId: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setConversations(prev => [...prev, userMessage]);

      // Send message and get streaming response
      const chatId = chatToUse.id;
      console.log("Using chatId for streaming:", chatId);
      if (chatId) {
        setIsStreaming(true);
        setStreamingMessage("");

        let finalStreamingMessage = "";
        
        try {
          await streamResponse(
            chatId,
            message,
            (chunk: string) => {
              setStreamingMessage(prev => {
                const newMessage = prev + chunk;
                finalStreamingMessage = newMessage;
                return newMessage;
              });
            }
          );

          // Add assistant message to conversations
          const assistantMessage: Conversation = {
            id: (Date.now() + 1).toString(),
            content: finalStreamingMessage,
            role: "assistant",
            chatId: chatToUse.id,
            userId: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          setConversations(prev => [...prev, assistantMessage]);
          
          // Invalidate and refetch conversations to ensure we have the latest data
          if (chatToUse?.id) {
            queryClient.invalidateQueries({
              queryKey: ["assistant", "conversations", chatToUse.id]
            });
          }
        } catch (error) {
          // Add error message
          const errorMessage: Conversation = {
            id: (Date.now() + 1).toString(),
            content: "Sorry, I encountered an error while processing your request. Please try again.",
            role: "assistant",
            chatId: chatToUse.id,
            userId: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setConversations(prev => [...prev, errorMessage]);
        } finally {
          setStreamingMessage("");
          setIsStreaming(false);
        }
      } else {
        // Add error message
        const errorMessage: Conversation = {
          id: (Date.now() + 1).toString(),
          content: "Error: No chat session available. Please try again.",
          role: "assistant",
          chatId: "",
          userId: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setConversations(prev => [...prev, errorMessage]);
      }
        } catch (error) {
          // Handle error silently
        } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.fileId !== fileId));
  };

  const addExistingFile = (file: AssistantFile) => {
    if (!uploadedFiles.find(f => f.fileId === file.fileId)) {
      setUploadedFiles(prev => [...prev, file]);
    }
  };

  const selectFilesForChat = (files: AssistantFile[]) => {
    if (files.length === 0) return;
    setUploadedFiles(files);
  };

  const attachFilesToCurrentChat = async (files: AssistantFile[]) => {
    if (!currentChat || files.length === 0) return;

    try {
      setIsLoading(true);
      await attachFilesMutation.mutateAsync({
        chatId: currentChat.id,
        fileIds: files.map(f => f.fileId)
      });
      
      setUploadedFiles(prev => [...prev, ...files]);
    } catch (error) {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">

      {/* Associated Documents */}
      {currentChat && chatDetail?.data?.files && chatDetail.data.files.length > 0 && (
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
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
          <div key={conversation.id} className={`flex gap-3 ${conversation.role === "user" ? "justify-end" : "justify-start"}`}>
            {conversation.role === "assistant" && (
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                <img 
                  src="/logo.png" 
                  alt="Infrahive" 
                  className="w-8 h-8 object-contain"
                />
              </div>
            )}
            <div className={`max-w-[80%] ${conversation.role === "user" ? "order-first" : ""}`}>
              <div className={`rounded-lg p-3 ${
                conversation.role === "user" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted"
              }`}>
                {conversation.role === "assistant" ? (
                  <MarkdownRenderer 
                    content={(() => {
                      try {
                        const lines = conversation.content.split('\n');
                        const parts: string[] = [];
                        for (const line of lines) {
                          const trimmed = line.trim();
                          if (!trimmed) continue;
                          try {
                            const data = JSON.parse(trimmed);
                            if (data.type === "response" && data.content) {
                              // Remove citation codes like [[C:...]] from the content
                              const cleanContent = String(data.content).replace(/\[\[C:[^\]]+\]\]/g, '');
                              parts.push(cleanContent);
                            }
                          } catch {
                            // ignore non-JSON lines
                          }
                        }
                        if (parts.length > 0) return parts.join("");
                        // Also clean the fallback content
                        return conversation.content.replace(/\[\[C:[^\]]+\]\]/g, '');
                      } catch {
                        return conversation.content.replace(/\[\[C:[^\]]+\]\]/g, '');
                      }
                    })()}
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">
                    {conversation.content}
                  </p>
                )}
              </div>
            </div>
            {conversation.role === "user" && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-primary text-primary-foreground">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {/* Streaming Message */}
        {isStreaming && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
              <img 
                src="/logo.png" 
                alt="Infrahive" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <div className="max-w-[80%]">
              <div className="bg-muted rounded-lg p-3">
                <MarkdownRenderer 
                  content={streamingMessage}
                />
                <span className="animate-pulse text-sm">|</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t relative">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFileUpload(!showFileUpload)}
            title="Upload documents"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          
          {/* Editable model selector to allow changing chat type */}
          <Select value={selectedModel} onValueChange={(value: ModelType) => handleChangeModel(value)}>
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
          
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading || isStreaming}
            className="flex-1"
          />
          
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading || isStreaming}
            size="icon"
          >
            {isLoading || isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {uploadedFiles.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Files:</span>
            {uploadedFiles.map((file) => (
              <Badge key={file.fileId} variant="secondary" className="text-xs">
                {file.name}
              </Badge>
            ))}
          </div>
        )}

        {/* File Upload Modal */}
        {showFileUpload && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-background border rounded-lg shadow-lg p-4 max-h-80 overflow-y-auto z-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Select Documents</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFileUpload(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              {/* Upload New File Option */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground">Upload New File</h4>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
                
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-full"
                  size="sm"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Choose Files
                </Button>
              </div>

              {/* Select from Existing Files */}
              {availableFiles && availableFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">Select from Existing</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {availableFiles.map((file) => {
                      const isAlreadyAssociated = currentChat && chatDetail?.data?.files?.some(f => f.file.fileId === file.fileId);
                      const isSelected = uploadedFiles.some(f => f.fileId === file.fileId);
                      
                      return (
                        <div key={file.fileId} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                          <span className="truncate flex-1" title={file.name}>{file.name}</span>
                          {isAlreadyAssociated ? (
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                              Already Added
                            </span>
                          ) : !currentChat ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => selectFilesForChat([file])}
                              disabled={isSelected}
                              className="ml-2"
                            >
                              {isSelected ? "Selected" : "Select"}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addExistingFile(file)}
                              disabled={isSelected}
                              className="ml-2"
                            >
                              {isSelected ? "Added" : "Add"}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Select All Files */}
                  {!currentChat && availableFiles.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectFilesForChat(availableFiles)}
                      className="w-full"
                    >
                      Select All {availableFiles.length} Files
                    </Button>
                  )}
                </div>
              )}

              {/* Selected Files */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">Selected Files</h4>
                  <div className="space-y-1">
                    {uploadedFiles.map((file) => (
                      <div key={file.fileId} className="flex items-center justify-between p-2 bg-primary/10 rounded text-sm">
                        <span className="truncate flex-1" title={file.name}>{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.fileId)}
                          className="ml-2"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
