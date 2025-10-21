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
  type: "general" | "analyse" | "summary" | "extract";
  workspaceId: string;
  fileIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateChatRequest {
  name: string;
  type: "general" | "analyse" | "summary" | "extract";
  workspaceId: string;
  fileIds: string[];
}

// Query keys for consistent cache management
export const assistantKeys = {
  all: ["assistant"] as const,
  files: (workspaceId: string) => [...assistantKeys.all, "files", workspaceId] as const,
  chats: (workspaceId: string) => [...assistantKeys.all, "chats", workspaceId] as const,
  chat: (chatId: string) => [...assistantKeys.all, "chat", chatId] as const,
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
      
      // Note: The API doesn't provide a GET endpoint for files in the curl examples
      // This would need to be implemented on the backend
      // For now, we'll return an empty array
      return [];
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
      return await Api.post<AssistantChat>("/assistant/chat", args);
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
      return await Api.delete(`/assistant/chat/${args.chatId}`);
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
      return await Api.patch<AssistantChat>(`/assistant/chat/${chatId}`, updates);
    },
    onSuccess: (data, variables) => {
      // Invalidate chats query for this workspace
      queryClient.invalidateQueries({
        queryKey: assistantKeys.chats(variables.workspaceId),
      });
      // Update the specific chat in cache
      queryClient.setQueryData(assistantKeys.chat(variables.chatId), data);
    },
    onError: (error) => {
      console.error("Failed to update assistant chat:", error);
    },
  });
}
