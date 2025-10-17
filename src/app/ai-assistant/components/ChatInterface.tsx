"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Send, 
  Bot, 
  User, 
  FileText, 
  Download, 
  Copy, 
  Check,
  CheckCircle,
  MessageSquare,
  BarChart3,
  Search,
  FileText as SummarizeIcon
} from "lucide-react";
import { Conversation, AnalysisMode, Citation, Document } from "../page";
import { CitationViewer } from "./CitationViewer";

interface ChatInterfaceProps {
  conversations: Conversation[];
  onSendMessage: (message: string) => void;
  selectedMode: AnalysisMode;
  selectedDocuments: string[];
  documents: Document[];
  onModeChange: (mode: AnalysisMode) => void;
}

const modeIcons = {
  general: MessageSquare,
  summarize: SummarizeIcon,
  analyze: BarChart3,
  extract: Search,
} as const;

export function ChatInterface({ 
  conversations, 
  onSendMessage, 
  selectedMode, 
  selectedDocuments,
  documents,
  onModeChange
}: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations]);

  const handleSendMessage = () => {
    if (message.trim() && selectedDocuments.length > 0) {
      onSendMessage(message.trim());
      setMessage("");
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (showSlashMenu && filteredSlash.length > 0) {
        e.preventDefault();
        selectSlashCommand(filteredSlash[Math.max(0, Math.min(slashIndex, filteredSlash.length - 1))]);
        return;
      }
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Check for slash commands
    if (value.startsWith('/')) {
      setShowSlashMenu(true);
      const command = value.toLowerCase().trim();
      setSlashQuery(command.slice(1));
      let modeName = '';
      switch (command) {
        case '/general':
          onModeChange('general');
          modeName = 'General';
          setMessage('');
          setShowSlashMenu(false);
          break;
        case '/summarize':
        case '/summarise':
          onModeChange('summarize');
          modeName = 'Summarize';
          setMessage('');
          setShowSlashMenu(false);
          break;
        case '/analyze':
        case '/analyse':
        case '/review':
          onModeChange('analyze');
          modeName = 'Analyze';
          setMessage('');
          setShowSlashMenu(false);
          break;
        case '/extract':
          onModeChange('extract');
          modeName = 'Extract';
          setMessage('');
          setShowSlashMenu(false);
          break;
      }
      
      if (modeName) {
        setCommandFeedback(`Switched to ${modeName} mode`);
        setTimeout(() => setCommandFeedback(null), 2000);
      }
    } else {
      setShowSlashMenu(false);
      setSlashQuery("");
      setSlashIndex(0);
    }
  };

  const slashCommands: Array<{ key: AnalysisMode; label: string; aliases: string[] }> = [
    { key: 'general', label: 'General', aliases: ['general'] },
    { key: 'summarize', label: 'Summarize', aliases: ['summarize', 'summarise'] },
    { key: 'analyze', label: 'Analyze / Review', aliases: ['analyze', 'analyse', 'review'] },
    { key: 'extract', label: 'Extract', aliases: ['extract'] },
  ];

  const filteredSlash = !slashQuery
    ? slashCommands
    : slashCommands.filter((c) =>
        [c.label.toLowerCase(), ...c.aliases].some((t) => t.includes(slashQuery))
      );

  const selectSlashCommand = (cmd: { key: AnalysisMode; label: string }) => {
    onModeChange(cmd.key);
    setMessage("");
    setShowSlashMenu(false);
    setSlashQuery("");
    setSlashIndex(0);
    setCommandFeedback(`Switched to ${cmd.label.replace(' / Review','')} mode`);
    setTimeout(() => setCommandFeedback(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSlashMenu) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSlashIndex((i) => Math.min(i + 1, Math.max(0, filteredSlash.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSlashIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Escape') {
      setShowSlashMenu(false);
    }
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderCitation = (citation: Citation) => (
    <div key={`${citation.documentId}-${citation.pageNumber}`} className="flex items-start gap-2 p-2 bg-muted/50 rounded text-xs">
      <FileText className="w-3 h-3 mt-0.5 text-muted-foreground" />
      <div className="flex-1">
        <p className="font-medium">Document {citation.documentId}</p>
        <p className="text-muted-foreground">Page {citation.pageNumber} • {citation.section}</p>
        <p className="mt-1 italic">&ldquo;{citation.text}&rdquo;</p>
      </div>
    </div>
  );

  const renderMessage = (conversation: Conversation) => {
    const ModeIcon = modeIcons[conversation.mode];
    
    return (
      <div key={conversation.id} className="space-y-2">
        {/* User Message */}
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="w-3 h-3 text-primary" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-[10px]">
                <ModeIcon className="w-2.5 h-2.5 mr-1" />
                {conversation.mode}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {formatTimestamp(conversation.timestamp)}
              </span>
            </div>
            <Card>
              <CardContent className="p-2">
                <p className="text-xs">{conversation.userPrompt}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Response */}
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
            <Bot className="w-3 h-3 text-green-600" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">AI Assistant</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1"
                onClick={() => copyToClipboard(conversation.response, conversation.id)}
              >
                {copiedMessageId === conversation.id ? (
                  <Check className="w-2.5 h-2.5" />
                ) : (
                  <Copy className="w-2.5 h-2.5" />
                )}
              </Button>
            </div>
            <Card>
              <CardContent className="p-2">
                <div className="space-y-2">
                  <p className="text-xs whitespace-pre-wrap">{conversation.response}</p>
                  
                  {/* Citations */}
                  {conversation.citations && conversation.citations.length > 0 && (
                    <div className="space-y-1">
                      <Separator />
                      <CitationViewer 
                        citations={conversation.citations}
                        documents={documents}
                        onHighlightSection={(documentId, pageNumber, section) => {
                          // TODO: Implement highlighting functionality
                          // console.log(`Highlighting ${section} on page ${pageNumber} of document ${documentId}`);
                        }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-2 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">AI Assistant Chat</h3>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-xs">
            {selectedDocuments.length} docs
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {selectedMode}
          </Badge>
        </div>
      </div>

      {/* Messages Area - No internal scrolling */}
      <div className="flex-1 p-2 min-h-0">
        <div className="space-y-3">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bot className="w-8 h-8 text-muted-foreground/50 mb-2" />
              <h3 className="text-sm font-medium mb-1">Start a conversation</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Ask questions about your documents, request summaries, or extract specific information.
              </p>
            </div>
          ) : (
            conversations.map(renderMessage)
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Command Feedback */}
      {commandFeedback && (
        <div className="px-2 py-1 bg-primary/10 border-t border-primary/20 flex-shrink-0">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-primary" />
            <span className="text-xs text-primary font-medium">{commandFeedback}</span>
          </div>
        </div>
      )}

    </div>
  );
}
