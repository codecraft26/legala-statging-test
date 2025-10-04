"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useRefineText } from "@/hooks/use-refine";
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
  const [generatedContent, setGeneratedContent] = useState("");
  const {
    mutateAsync: refineText,
    isPending: isRefining,
    error: refineError,
  } = useRefineText();

  useEffect(() => {
    if (!isOpen) {
      setPrompt("");
      setGeneratedContent("");
    }
  }, [isOpen]);


  const handleGenerate = async () => {
    if (!prompt.trim() || !editor) return;

    setIsGenerating(true);
    setGeneratedContent("");
    try {
      // Use the refine API to generate content based on the prompt
      // Send user input as instruction and empty text field
      const request = {
        text: "", // Empty text field
        instruction: prompt, // Use the user's prompt as the instruction
      };

      // Sending request to refine API
      const result = await refineText(request);
      setGeneratedContent(result.refined_text || "");
    } catch (error) {
      console.error("Error generating content:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsertContent = () => {
    if (!generatedContent || !editor) {
      return;
    }

    // Insert the generated content at the current cursor position
    editor.chain().focus().insertContent(generatedContent).run();
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
              disabled={isGenerating || isRefining}
            />
          </div>

          {/* Generated Content */}
          {(generatedContent || isGenerating || isRefining) && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Generated Content {(isGenerating || isRefining) && "(Generating...)"}
              </label>
              <div className="p-4 bg-muted border rounded-md max-h-60 overflow-y-auto">
                <div className="prose prose-sm max-w-none">
                  {generatedContent ? (
                    <div dangerouslySetInnerHTML={{ __html: generatedContent }} />
                  ) : (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating content...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {refineError && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{refineError.message}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {(isGenerating || isRefining)
              ? "Generating content..."
              : generatedContent
              ? "Content ready to insert"
              : ""}
          </div>
          <div className="flex items-center space-x-2">
            {generatedContent && !isGenerating && !isRefining && (
              <Button onClick={handleInsertContent} className="bg-green-600 hover:bg-green-700">
                <Sparkles className="w-4 h-4" />
                Insert Content
              </Button>
            )}
            {!generatedContent && !isGenerating && !isRefining && (
              <Button onClick={handleGenerate} disabled={!prompt.trim()}>
                {isGenerating || isRefining ? (
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
