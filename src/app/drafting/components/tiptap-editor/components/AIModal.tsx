"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useRefineTextStream } from "@/hooks/use-refine";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  editor: any;
}

export default function AIModal({ isOpen, onClose, editor }: AIModalProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const {
    refineTextStream,
    isStreaming,
    streamedContent,
    error,
    cancelStream,
  } = useRefineTextStream();

  useEffect(() => {
    if (!isOpen) {
      setPrompt("");
      cancelStream();
    }
  }, [isOpen, cancelStream]);

  const handleGenerate = async () => {
    if (!prompt.trim() || !editor) return;

    setIsGenerating(true);
    try {
      // Use the refine API to generate content based on the prompt
      // For content generation, we provide a minimal starting text and enhanced instruction
      const request = {
        text: "Generate content:", // Provide some initial text
        instruction: `Generate new content based on this request: ${prompt}. Please create professional, well-structured content that addresses the user's request.`,
      };

      // Sending request to refine API
      await refineTextStream(request);
    } catch (error) {
      console.error("Error generating content:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsertContent = () => {
    if (!streamedContent || !editor) return;

    // Insert the generated content at the current cursor position
    editor.chain().focus().insertContent(streamedContent).run();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle>AskAI</DialogTitle>
              <DialogDescription>
                Generate content with AI assistance
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto">
          {/* Prompt Input */}
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium mb-2">
              What would you like me to write?
            </label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Write a professional email to a client about project updates, Create a contract clause for data protection, Draft a legal notice for breach of contract, Generate a privacy policy for a mobile app, Write a terms of service agreement..."
              className="resize-none"
              rows={4}
              disabled={isStreaming}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Press Cmd+Enter (Mac) or Ctrl+Enter (Windows) to generate
            </p>
          </div>

          {/* Generated Content */}
          {streamedContent && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Generated Content
              </label>
              <div className="p-4 bg-muted border rounded-md max-h-60 overflow-y-auto">
                <div className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: streamedContent }} />
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {isStreaming
              ? "Generating content..."
              : "AI will help you create professional content"}
          </div>
          <div className="flex items-center space-x-2">
            {isStreaming && (
              <Button variant="outline" onClick={cancelStream}>
                Cancel
              </Button>
            )}
            {streamedContent && (
              <Button onClick={handleInsertContent}>
                <Sparkles className="w-4 h-4" />
                Insert Content
              </Button>
            )}
            {!streamedContent && !isStreaming && (
              <Button onClick={handleGenerate} disabled={!prompt.trim()}>
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Generate
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
