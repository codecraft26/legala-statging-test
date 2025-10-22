"use client";

import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useUploadAssistantFiles, 
  useCreateAssistantChat, 
  useAssistantConversations, 
  useStreamAssistantResponse, 
  useAssistantFiles, 
  useAttachFilesToChat, 
  useAssistantChatDetail, 
  useUpdateAssistantChat,
  type AssistantFile, 
  type AssistantChat, 
  type Conversation 
} from "@/hooks/use-assistant";

const modelConfig = {
  general: {
    label: "General",
    description: "Interactive Q&A with documents"
  },
  analyse: {
    label: "Analyze",
    description: "Compare and analyze documents"
  },
  summary: {
    label: "Summary",
    description: "Generate document summaries"
  },
  extract: {
    label: "Extract",
    description: "Extract key information"
  }
} as const;

type ModelType = keyof typeof modelConfig;

interface UseChatLogicProps {
  workspaceId: string;
  currentChat?: AssistantChat | null;
  onChatCreated?: (chat: AssistantChat) => void;
}

export function useChatLogic({ workspaceId, currentChat, onChatCreated }: UseChatLogicProps) {
  const [inputMessage, setInputMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModelType>("general");
  const [uploadedFiles, setUploadedFiles] = useState<AssistantFile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  
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

  // Helper: enforce single-file for General mode
  const associatedCount = (chatDetail?.data?.files?.length || 0) + uploadedFiles.filter(u => !chatDetail?.data?.files?.some(f => f.file.fileId === u.fileId)).length;

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
      refetchConversations();
      
      // Update selected model to match the chat's type
      if (currentChat.type && currentChat.type in modelConfig) {
        setSelectedModel(currentChat.type as ModelType);
      }
    }
  }, [currentChat?.id, currentChat?.type, refetchConversations]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, streamingMessage]);

  // Close file upload modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFileUpload) {
        const target = event.target as Element;
        const modal = document.querySelector('[data-file-upload-modal]');
        const uploadButton = document.querySelector('[data-upload-button]');
        
        if (modal && !modal.contains(target) && !uploadButton?.contains(target)) {
          setShowFileUpload(false);
        }
      }
    };

    if (showFileUpload) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFileUpload]);

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

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      setIsLoading(true);
      let fileArray = Array.from(files);
      if (selectedModel === "general") {
        if (associatedCount >= 1) {
          setIsLoading(false);
          return;
        }
        fileArray = fileArray.slice(0, 1);
      }
      const result = await uploadFilesMutation.mutateAsync({
        files: fileArray,
        workspaceId
      });
      
      // If we're in an existing chat, attach the uploaded files to the chat
      if (currentChat && result.length > 0) {
        try {
          await attachFilesMutation.mutateAsync({
            chatId: currentChat.id,
            fileIds: result.map(f => f.fileId)
          });
          
          // Refresh chat detail to show the newly attached files
          queryClient.invalidateQueries({
            queryKey: ["assistant", "chat", "detail", currentChat.id]
          });
        } catch (error) {
          console.error("Failed to attach uploaded files to chat:", error);
        }
      } else {
        // If no current chat, add to local state for new chat creation
        setUploadedFiles(prev => {
          const merged = [...prev, ...result];
          if (selectedModel === "general") {
            return merged.slice(0, 1);
          }
          return merged;
        });
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isCreatingChat) return;

    const message = inputMessage.trim();
    setInputMessage("");

    try {
      setIsLoading(true);

      let chatToUse = currentChat;

      // If no chat exists, create one first
      if (!chatToUse) {
        try {
          setIsCreatingChat(true);
          const chatName = message.length > 50 ? message.substring(0, 50) + "..." : message;
          
          const response = await createChatMutation.mutateAsync({
            name: chatName,
            type: selectedModel,
            workspaceId,
            fileIds: uploadedFiles.map(f => f.fileId)
          });
          
          // Extract the chat data from the response - handle different response formats
          let newChat: AssistantChat | null = null;
          if (response?.data && typeof response.data === 'object' && 'id' in response.data && 'name' in response.data) {
            // Standard wrapped response: { success: boolean, data: AssistantChat }
            newChat = response.data as AssistantChat;
          } else if (response && typeof response === 'object' && 'id' in response && 'name' in response) {
            // Direct response: AssistantChat
            newChat = response as unknown as AssistantChat;
          }
          
          // Validate that the chat was created successfully and has an ID
          if (!newChat || !newChat.id) {
            throw new Error("Failed to create chat - no ID returned");
          }
          chatToUse = newChat;
          
          // Wait a moment for the chat to be properly created and set
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Only call onChatCreated after ensuring the chat is valid
          onChatCreated?.(newChat);
          
          // Force refetch conversations for the new chat
          queryClient.invalidateQueries({
            queryKey: ["assistant", "conversations", newChat.id]
          });
          
          // Also manually refetch to ensure conversations are loaded
          setTimeout(() => {
            refetchConversations();
          }, 300);
        } catch (error) {
          // Add error message to conversations
          const errorMessage: Conversation = {
            id: (Date.now() + 1).toString(),
            content: "Sorry, I couldn't create a new chat session. Please try again.",
            role: "assistant",
            chatId: "",
            userId: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setConversations(prev => [...prev, errorMessage]);
          setIsCreatingChat(false);
          return; // Exit early without sending the message
        } finally {
          setIsCreatingChat(false);
        }
      }

      // Add user message to conversations
      const userMessage: Conversation = {
        id: Date.now().toString(),
        content: message,
        role: "user",
        chatId: chatToUse?.id || "",
        userId: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setConversations(prev => [...prev, userMessage]);

      // Send message and get streaming response
      const chatId = chatToUse?.id;
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
            chatId: chatToUse?.id || "",
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
            chatId: chatToUse?.id || "",
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

  const addExistingFile = async (file: AssistantFile) => {
    if (selectedModel === "general" && associatedCount >= 1) return;
    if (!uploadedFiles.find(f => f.fileId === file.fileId)) {
      // If we're in an existing chat, attach the file to the chat
      if (currentChat) {
        try {
          setIsLoading(true);
          await attachFilesMutation.mutateAsync({
            chatId: currentChat.id,
            fileIds: [file.fileId]
          });
          
          // Refresh chat detail to show the newly attached file
          queryClient.invalidateQueries({
            queryKey: ["assistant", "chat", "detail", currentChat.id]
          });
        } catch (error) {
          console.error("Failed to attach file to chat:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        // If no current chat, just add to local state for new chat creation
        setUploadedFiles(prev => {
          const merged = [...prev, file];
          return selectedModel === "general" ? merged.slice(0, 1) : merged;
        });
      }
    }
  };

  const selectFilesForChat = (files: AssistantFile[]) => {
    if (files.length === 0) return;
    setUploadedFiles(selectedModel === "general" ? files.slice(0, 1) : files);
  };

  return {
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
  };
}
