"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { BrainIcon, ChevronDownIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { createContext, memo, useContext, useEffect, useMemo, useState } from "react";
import { Response } from "./response";

type ReasoningContextValue = {
  isStreaming: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  duration: number;
  elapsedSeconds: number;
};

const ReasoningContext = createContext<ReasoningContextValue | null>(null);
const useReasoning = () => {
  const context = useContext(ReasoningContext);
  if (!context) throw new Error("Reasoning components must be used within Reasoning");
  return context;
};

export type ReasoningProps = ComponentProps<typeof Collapsible> & {
  isStreaming?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
};

const AUTO_CLOSE_DELAY = 1000;

export const Reasoning = memo(({ className, isStreaming = false, open, defaultOpen = false, onOpenChange, duration: durationProp, children, ...props }: ReasoningProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(open ?? defaultOpen);
  const [duration, setDuration] = useState<number>(durationProp ?? 0);
  const [hasAutoClosedRef, setHasAutoClosedRef] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    if (typeof open === "boolean") setIsOpen(open);
  }, [open]);

  useEffect(() => {
    if (typeof durationProp === "number") setDuration(durationProp);
  }, [durationProp]);

  useEffect(() => {
    if (isStreaming) {
      if (startTime === null) setStartTime(Date.now());
    } else if (startTime !== null) {
      setDuration(Math.round((Date.now() - startTime) / 1000));
      setStartTime(null);
    }
  }, [isStreaming, startTime]);

  // Live elapsed timer while streaming
  useEffect(() => {
    if (!isStreaming || startTime === null) return;
    setElapsedSeconds(Math.round((Date.now() - startTime) / 1000));
    const id = setInterval(() => {
      setElapsedSeconds(Math.round((Date.now() - (startTime ?? Date.now())) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [isStreaming, startTime]);

  useEffect(() => {
    if (!isStreaming && duration > 0) {
      setElapsedSeconds(duration);
    }
  }, [isStreaming, duration]);

  useEffect(() => {
    if (isStreaming && !isOpen) {
      setIsOpen(true);
      onOpenChange?.(true);
    } else if (!isStreaming && isOpen && !defaultOpen && !hasAutoClosedRef) {
      const timer = setTimeout(() => {
        setIsOpen(false);
        setHasAutoClosedRef(true);
        onOpenChange?.(false);
      }, AUTO_CLOSE_DELAY);
      return () => clearTimeout(timer);
    }
  }, [isStreaming, isOpen, defaultOpen, onOpenChange, hasAutoClosedRef]);

  const ctx = useMemo<ReasoningContextValue>(() => ({ isStreaming, isOpen, setIsOpen, duration, elapsedSeconds }), [isStreaming, isOpen, duration, elapsedSeconds]);

  return (
    <ReasoningContext.Provider value={ctx}>
      <Collapsible className={cn("not-prose mb-2", className)} open={isOpen} onOpenChange={(v: boolean) => { setIsOpen(v); onOpenChange?.(v); }} {...props}>
        {children}
      </Collapsible>
    </ReasoningContext.Provider>
  );
});

export type ReasoningTriggerProps = ComponentProps<typeof CollapsibleTrigger> & { title?: string };
export const ReasoningTrigger = memo(({ className, title = "Reasoning", children, ...props }: ReasoningTriggerProps) => {
  const { isStreaming, isOpen, duration, elapsedSeconds } = useReasoning();
  return (
    <CollapsibleTrigger className={cn("flex items-center gap-2 text-muted-foreground text-xs", className)} {...props}>
      {children ?? (
        <>
          <BrainIcon className="w-4 h-4" />
          {isStreaming || duration === 0 ? (
            <p>{(title || "Thinking...") + (elapsedSeconds > 0 ? ` ${elapsedSeconds}s` : "")}</p>
          ) : (
            <p>Thought for {duration} seconds</p>
          )}
          <ChevronDownIcon className={cn("w-4 h-4 transition-transform", isOpen ? "rotate-180" : "rotate-0")} />
        </>
      )}
    </CollapsibleTrigger>
  );
});

export type ReasoningContentProps = ComponentProps<typeof CollapsibleContent> & { children: string };
export const ReasoningContent = memo(({ className, children, ...props }: ReasoningContentProps) => (
  <CollapsibleContent
    className={cn(
      "mt-2 text-xs",
      "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
      className
    )}
    {...props}
  >
    <Response className="grid gap-1">{children}</Response>
  </CollapsibleContent>
));


