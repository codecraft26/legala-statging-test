"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  MessageSquare, 
  FileText, 
  Search,
  Trash2,
  Bot,
  Calendar
} from "lucide-react";
import { useAssistantChats, useDeleteAssistantChat, type AssistantChat } from "@/hooks/use-assistant";

interface ConversationSidebarProps {
  workspaceId: string;
  currentChatId?: string;
  onChatSelect: (chat: AssistantChat) => void;
  onNewChat: () => void;
}

const modelIcons = {
  general: MessageSquare,
  summary: FileText,
  extract: Search,
} as const;

export function ConversationSidebar({ workspaceId, currentChatId, onChatSelect, onNewChat }: ConversationSidebarProps) {
  const { data: chatsResponse, isLoading } = useAssistantChats(workspaceId);
  const deleteChatMutation = useDeleteAssistantChat();

  const chats = chatsResponse?.data || [];

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteChatMutation.mutateAsync({ chatId, workspaceId });
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="w-52 h-full border-r bg-muted/30 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-xs">Chat History</h2>
          <Button onClick={onNewChat} size="sm" variant="outline" className="h-6 px-2 text-[10px]">
            <Plus className="w-3 h-3 mr-1" />
            New
          </Button>
        </div>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto p-1 space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Bot className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-xs text-muted-foreground">No chats yet</p>
            <p className="text-xs text-muted-foreground">Start a conversation to begin</p>
          </div>
        ) : (
          chats.map((chat) => {
            let IconComponent, chatTitle;
            if (!chat.type || !(chat.type in modelIcons)) {
              // Use company logo for icon and friendly greeting title if missing/undefined type
              IconComponent = (props) => (
                <img src="/logo.png" alt="Infrahive" className="w-3.5 h-3.5 object-contain" {...props} />
              );
              chatTitle = "How may I help you today?";
            } else {
              IconComponent = modelIcons[chat.type];
              chatTitle = chat.name;
            }
            const isActive = currentChatId === chat.id;
            
            return (
              <Card
                key={chat.id}
                className={`cursor-pointer transition-colors ${
                  isActive
                    ? "ring-1 ring-primary bg-primary/5 border-primary/20"
                    : "hover:bg-accent/50 border-border/50"
                }`}
                onClick={() => onChatSelect(chat)}
              >
                <CardContent className="p-2">
                  <div className="flex items-start gap-2">
                    <IconComponent className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <h3 className="text-[11px] font-medium truncate flex-1" title={chatTitle}>
                          {chatTitle}
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                          onClick={(e) => handleDeleteChat(chat.id, e)}
                          title="Delete chat"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <Badge variant="secondary" className="text-[9px] px-1 py-0.5 capitalize">
                          {chat.type}
                        </Badge>
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground flex-shrink-0">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>{formatDate(chat.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t">
        <div className="text-[10px] text-muted-foreground text-center">
          {chats.length} chat{chats.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
