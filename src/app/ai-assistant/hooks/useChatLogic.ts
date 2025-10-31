"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  
  // Debouncing for streaming updates
  const streamingUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const pendingChunksRef = useRef<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Debounced streaming update function
  const debouncedStreamingUpdate = useCallback((chunk: string, finalMessageRef: { current: string }) => {
    pendingChunksRef.current.push(chunk);
    
    if (streamingUpdateRef.current) {
      clearTimeout(streamingUpdateRef.current);
    }
    
    streamingUpdateRef.current = setTimeout(() => {
      const allChunks = pendingChunksRef.current.join('');
      pendingChunksRef.current = [];
      
      setStreamingMessage(prev => {
        const newMessage = prev + allChunks;
        finalMessageRef.current = newMessage;
        return newMessage;
      });
    }, 16); // ~60fps
  }, []);

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

  // Check for streaming state when chat changes (for navigation persistence)
  useEffect(() => {
    if (currentChat?.id && conversationsLoading === false) {
      const streamingState = sessionStorage.getItem(`streaming_${currentChat.id}`);
      if (streamingState === "true") {
        // Only restore streaming state if we have a user message without an assistant response
        if (conversations.length > 0) {
          const lastMessage = conversations[conversations.length - 1];
          // Only restore if last message is user (no assistant response yet)
          if (lastMessage.role === "user") {
            setIsStreaming(true);
            setStreamingMessage("");
          } else {
            // Assistant message exists, streaming is complete - clear sessionStorage
            sessionStorage.removeItem(`streaming_${currentChat.id}`);
            setIsStreaming(false);
          }
        } else if (conversations.length === 0) {
          // New chat with streaming state - show thinking
          setIsStreaming(true);
          setStreamingMessage("");
        }
      } else {
        // No streaming state in sessionStorage, ensure isStreaming is false
        setIsStreaming(false);
      }
    }
  }, [currentChat?.id, conversations, conversationsLoading]);

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
        // Show streaming indicator immediately so first prompt shows "Thinking"
        setIsStreaming(true);
        setStreamingMessage("");

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
        // Save streaming state to sessionStorage for navigation persistence
        sessionStorage.setItem(`streaming_${chatId}`, "true");
        
        const finalStreamingMessageRef = { current: "" };
        
        try {
          await streamResponse(
            chatId,
            message,
            (chunk: string) => {
              // Use debounced updates for smoother streaming
              debouncedStreamingUpdate(chunk, finalStreamingMessageRef);
            }
          );

          // Add assistant message to conversations
          const assistantMessage: Conversation = {
            id: (Date.now() + 1).toString(),
            content: finalStreamingMessageRef.current,
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
          // Flush any pending debounced updates first
          if (streamingUpdateRef.current) {
            clearTimeout(streamingUpdateRef.current);
            streamingUpdateRef.current = null;
          }
          
          // Flush any remaining pending chunks immediately
          if (pendingChunksRef.current.length > 0) {
            const remainingChunks = pendingChunksRef.current.join('');
            pendingChunksRef.current = [];
            setStreamingMessage(prev => {
              const finalMessage = prev + remainingChunks;
              finalStreamingMessageRef.current = finalMessage;
              return finalMessage;
            });
          }
          
          // Small delay to ensure state updates complete
          setTimeout(() => {
            setStreamingMessage("");
            setIsStreaming(false);
            // Clear streaming state from sessionStorage
            if (chatId) {
              sessionStorage.removeItem(`streaming_${chatId}`);
            }
          }, 50);
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
        setIsStreaming(false);
      }
    } catch (error) {
      // Handle error silently
      setIsStreaming(false);
      // Clear streaming state from sessionStorage if we have a chat
      if (currentChat?.id) {
        sessionStorage.removeItem(`streaming_${currentChat.id}`);
      }
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
