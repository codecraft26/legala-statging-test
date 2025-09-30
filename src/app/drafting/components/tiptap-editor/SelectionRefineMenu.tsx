"use client";

import React from "react";
import { BubbleMenu, Editor } from "@tiptap/react";
import { useRefineText } from "@/hooks/use-refine";

type Props = {
  editor: Editor;
};

export default function SelectionRefineMenu({ editor }: Props) {
  const [result, setResult] = React.useState<string | null>(null);
  const [instruction, setInstruction] = React.useState(
    "Improve clarity and grammar"
  );

  const hasSelection = editor?.state.selection && !editor.state.selection.empty;
  const refineMutation = useRefineText();
  const { mutateAsync: refineText, isPending: loading, error: refineError } = refineMutation;

  const handleRefine = async () => {
    try {
      setResult(null);
      const selectedText = editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to,
        "\n"
      );

      if (!selectedText || selectedText.trim() === "") {
        return;
      }

      const res = await refineText({
        text: selectedText,
        instruction,
      });

      const refined = res?.refined_text || "";
      if (refined) {
        setResult(refined);
      }
    } catch (e: any) {
      // Error is handled by the hook
    }
  };

  const replaceSelection = () => {
    if (!result) return;
    const { from, to } = editor.state.selection;
    editor.chain().focus().deleteRange({ from, to }).insertContent(result).run();
    setResult(null);
  };

  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={() => Boolean(hasSelection)}
      tippyOptions={{ maxWidth: 420 }}
      className="z-50"
    >
      <div className="flex items-start gap-2 rounded-md border bg-white p-2 shadow-md min-w-[260px]">
        <input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          className="flex-1 border rounded px-2 py-1 text-xs"
          placeholder="Refine instruction"
        />
        <button
          className="text-xs rounded border px-2 py-1 hover:bg-gray-100"
          onClick={handleRefine}
          disabled={loading}
        >
          {loading ? "Refining…" : "Refine"}
        </button>
      </div>

      {(refineError || result) && (
        <div className="mt-2 rounded-md border bg-white p-2 shadow-md max-w-[420px]">
          {refineError ? (
            <div className="text-xs text-red-600">
              {refineError instanceof Error ? refineError.message : "Refine failed"}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-gray-500">Preview</div>
              <div className="text-sm whitespace-pre-wrap">{result}</div>
              <div className="flex gap-2">
                <button
                  className="text-xs rounded border px-2 py-1 hover:bg-gray-100"
                  onClick={replaceSelection}
                >
                  Replace Selection
                </button>
                <button
                  className="text-xs rounded border px-2 py-1 hover:bg-gray-100"
                  onClick={() => setResult(null)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </BubbleMenu>
  );
}


