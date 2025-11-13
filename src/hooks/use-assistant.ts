"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Api } from "@/lib/api-client";

// Types for Assistant API responses
export interface AssistantFile {
  id: string;
  name: string;
  fileId: string;
  summary: string;
  content: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssistantChat {
  id: string;
  name: string;
  type: "general" | "summary" | "extract";
  userId: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    email: string;
    name: string;
    role: string;
  };
}

export interface Conversation {
  id: string;
  content: string;
  role: "user" | "assistant";
  chatId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  type?: "general" | "summary" | "extract"; // optional message/chat type from API
}

export interface CreateChatRequest {
  name: string;
  type: "general" | "summary" | "extract";
  workspaceId: string;
  fileIds: string[];
}

export interface SendMessageRequest {
  chatId: string;
  message: string;
}

export interface AttachFilesRequest {
  chatId: string;
  fileIds: string[];
}

export interface ChatFileAttachment {
  id: string;
  chatId: string;
  fileId: string;
  required: boolean;
  createdAt: string;
  updatedAt: string;
  file: {
    id: string;
    name: string;
    fileId: string;
    summary?: string;
  };
}

// Query keys for consistent cache management
export const assistantKeys = {
  all: ["assistant"] as const,
  files: (workspaceId: string) => [...assistantKeys.all, "files", workspaceId] as const,
  chats: (workspaceId: string) => [...assistantKeys.all, "chats", workspaceId] as const,
  chat: (chatId: string) => [...assistantKeys.all, "chat", chatId] as const,
  conversations: (chatId: string) => [...assistantKeys.all, "conversations", chatId] as const,
};

// Hook for uploading files to assistant
export function useUploadAssistantFiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: {
      files: File[];
      workspaceId: string;
    }) => {
      const { files, workspaceId } = args;
      const formData = new FormData();
      
      // Append each file to the form data
      files.forEach((file) => {
        formData.append("files", file);
      });
      
      // Append workspace ID
      formData.append("workspaceId", workspaceId);

      return await Api.post<AssistantFile[]>("/assistant/file", formData, true);
    },
    onSuccess: (data, variables) => {
      // Invalidate files query for this workspace
      queryClient.invalidateQueries({
        queryKey: assistantKeys.files(variables.workspaceId),
      });
    },
    onError: (error) => {
      console.error("Failed to upload files to assistant:", error);
    },
  });
}

// Hook for getting all uploaded files for a workspace
export function useAssistantFiles(workspaceId: string) {
  return useQuery<AssistantFile[]>({
    queryKey: assistantKeys.files(workspaceId),
    queryFn: async () => {
      if (!workspaceId) return [];
      
      return await Api.get<AssistantFile[]>(`/assistant/file?workspace=${encodeURIComponent(workspaceId)}`);
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Hook for getting files by their IDs (for a specific chat)
export function useAssistantFilesByIds(fileIds: string[]) {
  return useQuery<AssistantFile[]>({
    queryKey: [...assistantKeys.all, "files-by-ids", fileIds],
    queryFn: async () => {
      if (!fileIds.length) return [];
      
      // Note: The API doesn't provide a GET endpoint for files by IDs in the curl examples
      // This would need to be implemented on the backend
      // For now, we'll return an empty array
      return [];
    },
    enabled: fileIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Hook for creating a new chat
export function useCreateAssistantChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: CreateChatRequest) => {
      return await Api.post<{ success: boolean; data: AssistantChat }>("/assistant/chat", args);
    },
    onSuccess: (data, variables) => {
      // Invalidate chats query for this workspace
      queryClient.invalidateQueries({
        queryKey: assistantKeys.chats(variables.workspaceId),
      });
    },
    onError: (error) => {
      console.error("Failed to create assistant chat:", error);
    },
  });
}

// Hook for getting all chats for a workspace
export function useAssistantChats(workspaceId: string) {
  return useQuery<{ success: boolean; data: AssistantChat[] }>({
    queryKey: assistantKeys.chats(workspaceId),
    queryFn: async () => {
      if (!workspaceId) return { success: false, data: [] };
      
      return await Api.get<{ success: boolean; data: AssistantChat[] }>(
        `/assistant/chat?workspaceId=${encodeURIComponent(workspaceId)}`
      );
    },
    enabled: !!workspaceId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for getting a specific chat
export function useAssistantChat(chatId: string) {
  return useQuery<AssistantChat>({
    queryKey: assistantKeys.chat(chatId),
    queryFn: async () => {
      if (!chatId) throw new Error("Chat ID is required");
      
      return await Api.get<AssistantChat>(`/assistant/chat/${chatId}`);
    },
    enabled: !!chatId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for deleting a chat
export function useDeleteAssistantChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { chatId: string; workspaceId: string }) => {
      return await Api.delete(`/assistant/chat?id=${encodeURIComponent(args.chatId)}`);
    },
    onSuccess: (_, variables) => {
      // Invalidate chats query for this workspace
      queryClient.invalidateQueries({
        queryKey: assistantKeys.chats(variables.workspaceId),
      });
      // Remove the specific chat from cache
      queryClient.removeQueries({
        queryKey: assistantKeys.chat(variables.chatId),
      });
    },
    onError: (error) => {
      console.error("Failed to delete assistant chat:", error);
    },
  });
}

// Hook for updating a chat
export function useUpdateAssistantChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: {
      chatId: string;
      workspaceId: string;
      updates: Partial<CreateChatRequest>;
    }) => {
      const { chatId, updates } = args;
      return await Api.patch<{ success: boolean; data: AssistantChat }>(`/assistant/chat?id=${encodeURIComponent(chatId)}`, updates);
    },
    onSuccess: (response, variables) => {
      const updated = response?.data ?? (response as unknown as AssistantChat);
      // Invalidate chats query for this workspace
      queryClient.invalidateQueries({
        queryKey: assistantKeys.chats(variables.workspaceId),
      });
      // Update the specific chat in cache
      queryClient.setQueryData(assistantKeys.chat(variables.chatId), updated);
      // Also refresh chat detail if used
      queryClient.invalidateQueries({ queryKey: ["assistant", "chat", "detail", variables.chatId] });
    },
    onError: (error) => {
      console.error("Failed to update assistant chat:", error);
    },
  });
}

// Hook for attaching files to a chat
export function useAttachFilesToChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: AttachFilesRequest) => {
      return await Api.patch<{ success: boolean; data: any[] }>("/assistant/chat/attach-file", args);
    },
    onSuccess: (data, variables) => {
      // Invalidate chats query to refresh chat data
      queryClient.invalidateQueries({
        queryKey: assistantKeys.all,
      });
    },
    onError: (error) => {
      console.error("Failed to attach files to chat:", error);
    },
  });
}

// Hook for getting conversations for a chat
export function useAssistantConversations(chatId: string) {
  return useQuery<Conversation[]>({
    queryKey: assistantKeys.conversations(chatId),
    queryFn: async () => {
      if (!chatId) return [];
      const result = await Api.get<Conversation[]>(`/assistant/conversation?chatId=${encodeURIComponent(chatId)}`);
      return result;
    },
    enabled: !!chatId,
    staleTime: 0, // Always refetch to ensure fresh data
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch when component mounts
  });
}

// Hook for getting chat details with associated files
export function useAssistantChatDetail(chatId: string) {
  return useQuery<{
    success: boolean;
    data: {
      id: string;
      name: string;
      type: string;
      files: ChatFileAttachment[];
    };
  }>({
    queryKey: ["assistant", "chat", "detail", chatId],
    queryFn: async () => {
      if (!chatId) throw new Error("Chat ID is required");
      return await Api.get(`/assistant/chat/detail?id=${encodeURIComponent(chatId)}`);
    },
    enabled: !!chatId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for toggling a chat file's required state
export function useToggleChatFileRequired() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { chatFileId: string; required: boolean }) => {
      const { chatFileId, required } = args;
      return await Api.patch<{ success: boolean; data: ChatFileAttachment }>(
        `/assistant/chat/chat-file?id=${encodeURIComponent(chatFileId)}`,
        { required }
      );
    },
    onSuccess: (data) => {
      const chatId = data?.data?.chatId;
      if (chatId) {
        queryClient.invalidateQueries({
          queryKey: ["assistant", "chat", "detail", chatId],
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: ["assistant", "chat", "detail"],
        });
      }
    },
    onError: (error) => {
      console.error("Failed to toggle chat file requirement:", error);
    },
  });
}

// Hook for sending a message with streaming response
export function useSendAssistantMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: SendMessageRequest) => {
      const { chatId, message } = args;
      
      // Get the streaming response
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://apilegalv205.infrahive.ai";
      const response = await fetch(`${baseUrl}/api/assistant/conversation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${document.cookie.match(/token=([^;]+)/)?.[1] || ""}`,
        },
        body: JSON.stringify({ chatId, content: message }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      let assistantMessage = "";
      const decoder = new TextDecoder();

      const sanitize = (text: string): string => {
        // Remove leading "data:" prefix if present and strip citation markers like [[1]] or [[C:...]]
        return text
          .replace(/^\s*data:\s*/i, "")
          .replace(/<sup>\s*\[\[[^\]]+\]\]\s*<\/sup>/gi, "")
          .replace(/\[\[[^\]]+\]\]/g, "");
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (data.type === "response" && data.content) {
                assistantMessage += sanitize(String(data.content));
              }
            } catch (e) {
              // Ignore malformed JSON
            }
          }
        }
      }

      return { assistantMessage };
    },
    onSuccess: (data, variables) => {
      // Invalidate conversations query for this chat
      queryClient.invalidateQueries({
        queryKey: assistantKeys.conversations(variables.chatId),
      });
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
    },
  });
}

// Hook for streaming assistant response (alternative approach)
export function useStreamAssistantResponse() {
  const streamResponseFn = async (chatId: string, message: string, onChunk: (chunk: string) => void, signal?: AbortSignal, retryCount = 0): Promise<void> => {
    const MAX_RETRIES = 2;
    
    try {
      if (!chatId || !message) {
        throw new Error("chatId and message are required");
      }
      
      const requestBody = { chatId, content: message };
      
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://apilegalv205.infrahive.ai";
      const response = await fetch(`${baseUrl}/api/assistant/conversation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${document.cookie.match(/token=([^;]+)/)?.[1] || ""}`,
        },
        body: JSON.stringify(requestBody),
        signal, // Add abort signal support
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // Retry on network errors or 5xx status codes
        if (retryCount < MAX_RETRIES && (response.status >= 500 || response.status === 0)) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
          return streamResponseFn(chatId, message, onChunk, signal, retryCount + 1);
        }
        
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let lastUpdateTime = 0;
        const DEBOUNCE_MS = 16; // ~60fps

        const sanitize = (text: string): string => {
          return text
            .replace(/^\s*data:\s*/i, "")
            .replace(/<sup>\s*\[\[[^\]]+\]\]\s*<\/sup>/gi, "")
            .replace(/\[\[[^\]]+\]\]/g, "");
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          
          // Keep the last line in buffer as it might be incomplete
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.trim()) {
              try {
              const data = JSON.parse(line);
              if (data.type === "response" && data.content) {
                  // Debounce updates for smoother rendering
                  const now = Date.now();
                  if (now - lastUpdateTime >= DEBOUNCE_MS) {
                  onChunk(sanitize(String(data.content)));
                    lastUpdateTime = now;
                  } else {
                    // Queue the update for the next frame
                  setTimeout(() => onChunk(sanitize(String(data.content))), DEBOUNCE_MS - (now - lastUpdateTime));
                  }
                }
              } catch (e) {
                // Ignore malformed JSON
              }
            }
          }
        }

        // Process any remaining data in buffer
        if (buffer.trim()) {
          try {
            const data = JSON.parse(buffer);
            if (data.type === "response" && data.content) {
              onChunk(sanitize(String(data.content)));
            }
          } catch (e) {
            // Ignore malformed JSON
          }
        }
        } catch (error) {
          throw error;
        }
  };
  
  return {
    streamResponse: streamResponseFn
  };
}
