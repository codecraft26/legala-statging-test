"use client";

import { useMutation } from "@tanstack/react-query";
import { useState, useCallback, useRef } from "react";
import { RefineApi, RefineRequest, RefineResponse } from "@/lib/refine-api";

// Hook for regular text refinement
export function useRefineText() {
  return useMutation({
    mutationFn: (request: RefineRequest) => RefineApi.refineText(request),
    onError: (error) => {
      console.error("Error refining text:", error);
    },
  });
}

// Hook for streaming text refinement
export function useRefineTextStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [usage, setUsage] = useState<{
    input_tokens: number;
    output_tokens: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const refineTextStream = useCallback(async (request: RefineRequest) => {
    try {
      setIsStreaming(true);
      setError(null);
      setStreamedContent("");
      setUsage(null);

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      const result = await RefineApi.refineTextStream(
        request,
        (content) => {
          setStreamedContent(content);
        },
        (usageData) => {
          setUsage(usageData);
        }
      );

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to refine text";
      setError(errorMessage);
      throw err;
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, []);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setError("Stream cancelled");
    }
  }, []);

  const reset = useCallback(() => {
    setStreamedContent("");
    setUsage(null);
    setError(null);
    setIsStreaming(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    refineTextStream,
    isStreaming,
    streamedContent,
    usage,
    error,
    cancelStream,
    reset,
  };
}

// Combined hook that provides both regular and streaming refinement
export function useRefine() {
  const regularRefine = useRefineText();
  const streamRefine = useRefineTextStream();

  return {
    // Regular refinement
    refineText: regularRefine.mutate,
    refineTextAsync: regularRefine.mutateAsync,
    isRefining: regularRefine.isPending,
    refineError: regularRefine.error,
    refineData: regularRefine.data,

    // Streaming refinement
    refineTextStream: streamRefine.refineTextStream,
    isStreaming: streamRefine.isStreaming,
    streamedContent: streamRefine.streamedContent,
    streamUsage: streamRefine.usage,
    streamError: streamRefine.error,
    cancelStream: streamRefine.cancelStream,
    resetStream: streamRefine.reset,
  };
}

// Hook for text refinement with automatic state management
export function useRefineWithState() {
  const [originalText, setOriginalText] = useState("");
  const [instruction, setInstruction] = useState("");
  const [refinedText, setRefinedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<{
    input_tokens: number;
    output_tokens: number;
  } | null>(null);

  const refine = useRefineText();

  const handleRefine = useCallback(
    async (text?: string, customInstruction?: string) => {
      const textToRefine = text || originalText;
      const instructionToUse = customInstruction || instruction;

      if (!textToRefine.trim() || !instructionToUse.trim()) {
        setError("Both text and instruction are required");
        return;
      }

      try {
        setIsProcessing(true);
        setError(null);
        setRefinedText("");

        const result = await refine.mutateAsync({
          text: textToRefine,
          instruction: instructionToUse,
        });

        setRefinedText(result.refined_text || "");
        setUsage(result.usage || null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to refine text";
        setError(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    },
    [originalText, instruction, refine]
  );

  const reset = useCallback(() => {
    setOriginalText("");
    setInstruction("");
    setRefinedText("");
    setError(null);
    setUsage(null);
    setIsProcessing(false);
  }, []);

  return {
    // State
    originalText,
    setOriginalText,
    instruction,
    setInstruction,
    refinedText,
    isProcessing,
    error,
    usage,

    // Actions
    handleRefine,
    reset,

    // Computed
    hasRefinedText: !!refinedText.trim(),
    canRefine: !!originalText.trim() && !!instruction.trim(),
  };
}
