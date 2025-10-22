"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PanelRightClose, PanelRightOpen, Loader2, Edit3, Check, X as XIcon } from "lucide-react";
import { ConversationSidebar } from "../components/ConversationSidebar";
import { ChatInterface } from "../components/ChatInterface";
import { getCookie } from "@/lib/utils";
import { useAssistantChatDetail, useUpdateAssistantChat, type AssistantChat } from "@/hooks/use-assistant";

export default function AssistantChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = (params?.chatId as string) || "";
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [showSidebar, setShowSidebar] = React.useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState("");

  const { data: chatDetail, isLoading: chatLoading } = useAssistantChatDetail(chatId);
  const updateChatMutation = useUpdateAssistantChat();

  const currentChat: AssistantChat | null = chatDetail?.data
    ? {
        id: chatDetail.data.id,
        name: chatDetail.data.name,
        type: chatDetail.data.type as AssistantChat["type"],
        userId: "",
        workspaceId: workspaceId || "",
        createdAt: "",
        updatedAt: "",
      }
    : null;

  const handleChatSelect = (chat: AssistantChat) => {
    router.push(`/ai-assistant/${chat.id}`);
  };

  const handleNewChat = () => {
    router.push(`/ai-assistant`);
  };

  const handleChatCreated = (chat: AssistantChat) => {
    // Validate that the chat has a valid ID before navigating
    if (!chat || !chat.id) {
      return;
    }
    
    router.push(`/ai-assistant/${chat.id}`);
  };

  const handleCloseSession = () => {
    router.push(`/ai-assistant`);
  };

  // Handle chat name editing
  const handleStartEditName = () => {
    setEditingName(currentChat?.name || "");
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!currentChat?.id || !workspaceId || !editingName.trim()) return;
    
    try {
      await updateChatMutation.mutateAsync({
        chatId: currentChat.id,
        workspaceId,
        updates: { name: editingName.trim(), type: currentChat.type },
      });
      setIsEditingName(false);
    } catch {}
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditingName("");
  };

  useEffect(() => {
    const id = getCookie("workspaceId");
    setWorkspaceId(id);
    setWorkspaceLoading(false);
  }, []);

  if (workspaceLoading || chatLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!workspaceId) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">No Workspace Selected</h2>
          <p className="text-muted-foreground">Please select a workspace to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      <div className="flex-1 flex flex-col">
        <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold">AI Assistant</h1>
              {currentChat && (
                <div className="flex items-center gap-2">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") handleSaveName();
                          if (e.key === "Escape") handleCancelEditName();
                        }}
                        className="text-sm text-muted-foreground"
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSaveName}
                        disabled={!editingName.trim()}
                        className="h-5 w-5 p-0"
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEditName}
                        className="h-5 w-5 p-0"
                      >
                        <XIcon className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">{currentChat.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleStartEditName}
                        className="h-4 w-4 p-0"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowSidebar(!showSidebar)}>
                {showSidebar ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <ChatInterface
            workspaceId={workspaceId}
            currentChat={currentChat}
            onChatCreated={handleChatCreated}
            onCloseSession={handleCloseSession}
          />
        </div>
      </div>

      {showSidebar && (
        <ConversationSidebar
          workspaceId={workspaceId}
          currentChatId={chatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
        />
      )}
    </div>
  );
}


