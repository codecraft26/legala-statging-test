"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Editor } from "@tiptap/react";
import { Sparkles, Wand2 } from "lucide-react";

type Props = {
  editor: Editor | null;
  onSummarize?: (original: string) => void;
  onImprove?: (original: string) => void;
};

export default function SelectionToolbar({
  editor,
  onSummarize,
  onImprove,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number }>({
    left: 0,
    top: 0,
  });

  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      const state = editor.state;
      const { from, to } = state.selection;
      const hasSelection = to > from;
      setVisible(hasSelection);
      if (hasSelection) {
        const start = editor.view.coordsAtPos(from);
        const end = editor.view.coordsAtPos(to);
        const left = (start.left + end.left) / 2;
        const top = Math.min(start.top, end.top) - 40;
        setPosition({ left, top });
      }
    };
    editor.on("selectionUpdate", handler);
    return () => {
      editor.off("selectionUpdate", handler);
    };
  }, [editor]);

  if (!editor || !visible) return null;

  const getSelectedText = (): string => {
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, " ");
  };

  return (
    <div
      className="fixed z-50"
      style={{ left: position.left, top: position.top }}
    >
      <div className="flex items-center gap-2 rounded-md border bg-white shadow px-2 py-1 text-xs">
        <button
          className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-50"
          onClick={() => onSummarize?.(getSelectedText())}
        >
          <Sparkles className="h-3 w-3" /> Summarize
        </button>
        <button
          className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-50"
          onClick={() => onImprove?.(getSelectedText())}
        >
          <Wand2 className="h-3 w-3" /> Improve
        </button>
      </div>
    </div>
  );
}
