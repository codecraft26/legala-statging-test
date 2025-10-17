"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Bot, FileText, Brain, PenTool, Download, MessageSquare, PanelRightClose, PanelRightOpen, Send } from "lucide-react";
import { CreateSessionModal } from "./components/CreateSessionModal";
import { ModeSelector } from "./components/ModeSelector";
import { DocumentSelector } from "./components/DocumentSelector";
import { ChatInterface } from "./components/ChatInterface";
import { ExportModal } from "./components/ExportModal";

export type AnalysisMode = "general" | "summarize" | "analyze" | "extract";

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  summary?: string;
}

export interface Session {
  id: string;
  name: string;
  documents: Document[];
  createdAt: string;
  lastActivity: string;
  conversations: Conversation[];
}

export interface Conversation {
  id: string;
  mode: AnalysisMode;
  userPrompt: string;
  response: string;
  selectedDocuments: string[];
  citations?: Citation[];
  timestamp: string;
}

export interface Citation {
  documentId: string;
  pageNumber: number;
  section: string;
  text: string;
}

export default function AIAssistantPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv");
  const [selectedMode, setSelectedMode] = useState<AnalysisMode>("general");
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [inputMessage, setInputMessage] = useState("");

  const handleCreateSession = (sessionData: { name: string; documents: Document[] }) => {
    const newSession: Session = {
      id: Date.now().toString(),
      name: sessionData.name,
      documents: sessionData.documents,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      conversations: [],
    };
    setSessions([newSession, ...sessions]);
    setCurrentSession(newSession);
    setSelectedDocuments(sessionData.documents.map(doc => doc.id));
    setShowCreateModal(false);
  };

  const handleSendMessage = (message: string) => {
    if (!currentSession) return;

    // Generate sample citations for demonstration
    const sampleCitations: Citation[] = selectedDocuments.slice(0, 2).map((docId, index) => ({
      documentId: docId,
      pageNumber: Math.floor(Math.random() * 10) + 1,
      section: index === 0 ? "Terms and Conditions" : "Payment Terms",
      text: `Sample citation text from document ${docId} demonstrating the AI's ability to reference specific sections.`
    }));

    const newConversation: Conversation = {
      id: Date.now().toString(),
      mode: selectedMode,
      userPrompt: message,
      response: `This is a sample AI response for your query: "${message}". The AI has analyzed your selected documents and provided insights with source citations.`,
      selectedDocuments,
      citations: sampleCitations,
      timestamp: new Date().toISOString(),
    };

    const updatedSession = {
      ...currentSession,
      conversations: [...currentSession.conversations, newConversation],
      lastActivity: new Date().toISOString(),
    };

    setCurrentSession(updatedSession);
    setSessions(sessions.map(s => s.id === currentSession.id ? updatedSession : s));
  };

  const handleExportResults = (format: "csv" | "pdf") => {
    if (!currentSession) return;
    setExportFormat(format);
    setShowExportModal(true);
  };

  const modeDescriptions = {
    general: "Interact with documents by asking questions and getting answers with source citations",
    summarize: "Get section-by-section summaries of your documents",
    analyze: "Compare and analyze multiple documents in a tabular format",
    extract: "Extract key terms and data points from documents for due diligence"
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex gap-4 p-6">
        {/* Main Content */}
        <div className={`flex-1 flex flex-col transition-all duration-200 ${showSidebar ? '' : 'max-w-none'}`}>
          {currentSession ? (
            <>
              {/* Session Header - Fixed */}
              <div className="mb-4 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h1 className="text-xl font-bold">{currentSession.name}</h1>
                    <p className="text-sm text-muted-foreground">
                      {currentSession.documents.length} documents • {currentSession.conversations.length} conversations
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleExportResults("csv")}>
                      <Download className="w-3 h-3 mr-1" />
                      CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExportResults("pdf")}>
                      <Download className="w-3 h-3 mr-1" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSidebar(!showSidebar)}
                    >
                      {showSidebar ? (
                        <PanelRightClose className="w-3 h-3" />
                      ) : (
                        <PanelRightOpen className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto space-y-4">
                  {/* Mode Selector */}
                  <div>
                    <ModeSelector 
                      selectedMode={selectedMode} 
                      onModeChange={setSelectedMode}
                      descriptions={modeDescriptions}
                    />
                  </div>

                  {/* Document Selector */}
                  <div>
                    <DocumentSelector
                      documents={currentSession.documents}
                      selectedDocuments={selectedDocuments}
                      onSelectionChange={setSelectedDocuments}
                    />
                  </div>

                  {/* Chat Interface - Only Messages Area */}
                  <div className="flex-1 min-h-0">
                    <ChatInterface
                      conversations={currentSession.conversations}
                      onSendMessage={handleSendMessage}
                      selectedMode={selectedMode}
                      selectedDocuments={selectedDocuments}
                      documents={currentSession.documents}
                      onModeChange={setSelectedMode}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Welcome to AI Assistant</CardTitle>
                  <CardDescription>
                    Create a new session to start analyzing your documents with AI
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Session
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Sessions Sidebar - Right Side */}
        {showSidebar && (
          <div className="w-56 flex-shrink-0 transition-all duration-200">
            <div className="sticky top-0 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-muted-foreground">Sessions</h2>
                {sessions.length > 0 && (
                  <Button onClick={() => setShowCreateModal(true)} size="sm" variant="outline" className="h-6 px-2">
                    <Plus className="w-2.5 h-2.5 mr-1" />
                    New
                  </Button>
                )}
              </div>
              
              {/* Sessions List */}
              <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
                {sessions.map((session) => (
                  <Card 
                    key={session.id} 
                    className={`cursor-pointer transition-all hover:shadow-sm ${
                      currentSession?.id === session.id 
                        ? "ring-1 ring-primary bg-primary/5 border-primary/20" 
                        : "hover:bg-accent/50 border-border/50"
                    }`}
                    onClick={() => setCurrentSession(session)}
                  >
                    <CardContent className="p-2">
                      <div className="space-y-1">
                        <div className="flex items-start justify-between">
                          <h3 className="text-xs font-medium leading-tight line-clamp-2">
                            {session.name}
                          </h3>
                          <Badge variant="secondary" className="text-[10px] ml-1 flex-shrink-0">
                            {session.documents.length}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-2.5 h-2.5" />
                            <span>{session.conversations.length}</span>
                          </div>
                          <span>{new Date(session.lastActivity).toLocaleDateString()}</span>
                        </div>
                        
                        {session.documents.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <FileText className="w-2.5 h-2.5" />
                            <span className="truncate">
                              {session.documents[0].name}
                              {session.documents.length > 1 && ` +${session.documents.length - 1}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {sessions.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="p-4 text-center">
                      <Bot className="w-6 h-6 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-xs text-muted-foreground">No sessions yet</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Fixed Input Area - Only show when session is active */}
      {currentSession && (
        <div className="border-t bg-background p-4 flex-shrink-0">
          <div className="flex gap-4 p-6">
            {/* Main Content Area - Same width as content above */}
            <div className={`flex-1 transition-all duration-200 ${showSidebar ? '' : 'max-w-none'}`}>
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => {
                  const value = e.target.value;
                  setInputMessage(value);
                  
                  // Handle slash commands
                  if (value.startsWith('/')) {
                    const command = value.toLowerCase();
                    if (command === '/general') {
                      setSelectedMode('general');
                    } else if (command === '/summarize' || command === '/summarise') {
                      setSelectedMode('summarize');
                    } else if (command === '/analyze' || command === '/analyse' || command === '/review') {
                      setSelectedMode('analyze');
                    } else if (command === '/extract') {
                      setSelectedMode('extract');
                    }
                  }
                }}
                placeholder={
                  selectedDocuments.length === 0 
                    ? "Select documents first..."
                    : `Ask a question or use /general, /summarize, /analyze, /extract...`
                }
                disabled={selectedDocuments.length === 0}
                className="flex-1 h-10"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (inputMessage.trim() && selectedDocuments.length > 0) {
                      handleSendMessage(inputMessage.trim());
                      setInputMessage("");
                    }
                  }
                }}
              />
              <Button 
                onClick={() => {
                  if (inputMessage.trim() && selectedDocuments.length > 0) {
                    handleSendMessage(inputMessage.trim());
                    setInputMessage("");
                  }
                }}
                disabled={!inputMessage.trim() || selectedDocuments.length === 0}
                size="icon"
                className="h-10 w-10"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            {selectedDocuments.length === 0 ? (
              <p className="text-xs text-muted-foreground mt-2">
                Please select at least one document to start the conversation
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground">Quick commands:</span>
                 <Badge 
                   variant="outline" 
                   className="text-xs px-2 py-1 cursor-pointer hover:bg-accent"
                   onClick={() => {
                     setInputMessage('/general');
                     setSelectedMode('general');
                   }}
                 >
                   /general
                 </Badge>
                 <Badge 
                   variant="outline" 
                   className="text-xs px-2 py-1 cursor-pointer hover:bg-accent"
                   onClick={() => {
                     setInputMessage('/summarize');
                     setSelectedMode('summarize');
                   }}
                 >
                   /summarize
                 </Badge>
                 <Badge 
                   variant="outline" 
                   className="text-xs px-2 py-1 cursor-pointer hover:bg-accent"
                   onClick={() => {
                     setInputMessage('/analyze');
                     setSelectedMode('analyze');
                   }}
                 >
                   /analyze
                 </Badge>
                 <Badge 
                   variant="outline" 
                   className="text-xs px-2 py-1 cursor-pointer hover:bg-accent"
                   onClick={() => {
                     setInputMessage('/extract');
                     setSelectedMode('extract');
                   }}
                 >
                   /extract
                 </Badge>
              </div>
            )}
            </div>

            {/* Sidebar Space - Same width as sidebar above */}
            {showSidebar && (
              <div className="w-56 flex-shrink-0">
                {/* Empty space to match sidebar width */}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Session Modal */}
      <CreateSessionModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreateSession={handleCreateSession}
      />

      {/* Export Modal */}
      <ExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        session={currentSession}
        format={exportFormat}
      />
    </div>
  );
}
