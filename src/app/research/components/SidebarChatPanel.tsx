"use client";

import React from "react";
import { X, Loader2, StopCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type AssistantChat } from "@/hooks/use-assistant";
import { useChatLogic } from "@/app/ai-assistant/hooks/useChatLogic";
import { MessageBubble } from "@/app/ai-assistant/components/MessageBubble";
import { StreamingMessage } from "@/app/ai-assistant/components/StreamingMessage";

interface SidebarChatPanelProps {
  workspaceId: string;
  chat?: AssistantChat | null;
  isOpen: boolean;
  onClose?: () => void;
  caseMeta?: {
    title?: string;
    parties?: string;
    date?: string;
  } | null;
}

export function SidebarChatPanel({
  workspaceId,
  chat,
  isOpen,
  onClose,
  caseMeta,
}: SidebarChatPanelProps) {
  const {
    inputMessage,
    setInputMessage,
    conversations,
    isLoading,
    isStreaming,
    streamingMessage,
    conversationsLoading,
    messagesEndRef,
    handleSendMessage,
    handleStopProcessing,
    handleKeyPress,
  } = useChatLogic({
    workspaceId,
    currentChat: chat,
    forceModel: "general",
  });

  const showEmptyState =
    !conversationsLoading && conversations.length === 0 && !isStreaming;

  return (
    <div
      className={`flex flex-col h-full bg-card border-l shadow-xl transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">
            {chat?.name || caseMeta?.title || "AI Assistant"}
          </p>
          {caseMeta?.parties && (
            <p className="text-xs text-muted-foreground truncate">
              {caseMeta.parties}
            </p>
          )}
          {!caseMeta?.parties && caseMeta?.date && (
            <p className="text-xs text-muted-foreground">{caseMeta.date}</p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {conversationsLoading && (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading conversation…
          </div>
        )}

        {showEmptyState && (
          <div className="text-sm text-muted-foreground text-center mt-8">
            Start the conversation for this order.
          </div>
        )}

        {conversations.map((conversation) => (
          <MessageBubble
            key={conversation.id}
            conversation={conversation}
            currentChat={chat || null}
          />
        ))}

        {isStreaming && (
          <StreamingMessage
            streamingMessage={streamingMessage}
            currentChatType="general"
            isStreaming={isStreaming}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t px-4 py-3">
        <div className="flex items-center gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask about this order…"
            disabled={isLoading || isStreaming}
          />
          {isStreaming ? (
            <Button
              variant="destructive"
              size="icon"
              onClick={handleStopProcessing}
              title="Stop response"
            >
              <StopCircle className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

