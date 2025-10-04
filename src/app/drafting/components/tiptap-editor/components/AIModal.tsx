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
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-gray-800 to-black rounded-xl shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                AI Assistant
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
                Generate professional legal content with AI
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Prompt Input */}
          <div className="space-y-3">
            <label htmlFor="prompt" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Describe what you need
            </label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Create a confidentiality agreement for software development, Draft a termination clause for employment contract, Write a privacy policy for mobile app..."
              className="resize-none border-gray-200 dark:border-gray-700 focus:border-gray-800 focus:ring-gray-800/20 min-h-[100px] text-sm"
              rows={4}
              disabled={isGenerating || isRefining}
            />
          </div>

          {/* Generated Content */}
          {(generatedContent || isGenerating || isRefining) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Generated Content
                </label>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 max-h-80 overflow-y-auto">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {generatedContent ? (
                      <div dangerouslySetInnerHTML={{ __html: generatedContent }} />
                    ) : (
                      <div className="flex items-center justify-center py-8">
                        <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="text-sm">Generating your content...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {refineError && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-sm text-red-700 dark:text-red-400">{refineError.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {(isGenerating || isRefining)
                ? "AI is working on your request..."
                : generatedContent
                ? "Ready to insert into your document"
                : ""}
            </div>
            <div className="flex items-center space-x-3">
              {generatedContent && !isGenerating && !isRefining && (
                <Button 
                  onClick={handleInsertContent} 
                  className="bg-gradient-to-r from-gray-800 to-black hover:from-gray-900 hover:to-gray-900 text-white shadow-sm"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Insert Content
                </Button>
              )}
              {!generatedContent && !isGenerating && !isRefining && (
                <Button 
                  onClick={handleGenerate} 
                  disabled={!prompt.trim()}
                  className="bg-gradient-to-r from-gray-800 to-black hover:from-gray-900 hover:to-gray-900 text-white shadow-sm disabled:opacity-50"
                >
                  {isGenerating || isRefining ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Generate
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
