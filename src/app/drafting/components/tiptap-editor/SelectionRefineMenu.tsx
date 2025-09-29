"use client";

import React from "react";
import { BubbleMenu, Editor } from "@tiptap/react";
import { Api } from "@/lib/api-client";

type Props = {
  editor: Editor;
};

export default function SelectionRefineMenu({ editor }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<string | null>(null);
  const [instruction, setInstruction] = React.useState(
    "Improve clarity and grammar"
  );

  const hasSelection = editor?.state.selection && !editor.state.selection.empty;

  const handleRefine = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const selectedText = editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to,
        "\n"
      );

      if (!selectedText || selectedText.trim() === "") {
        setError("Select some text to refine.");
        setLoading(false);
        return;
      }

      const res = await Api.post<{ refined: string }>("/refine", {
        text: selectedText,
        instruction,
      });

      const refined = (res as any)?.refined ?? (res as any)?.data?.refined ?? "";
      if (!refined) {
        setError("No result from API.");
      } else {
        setResult(refined);
      }
    } catch (e: any) {
      setError(e?.message || "Refine failed");
    } finally {
      setLoading(false);
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

      {(error || result) && (
        <div className="mt-2 rounded-md border bg-white p-2 shadow-md max-w-[420px]">
          {error ? (
            <div className="text-xs text-red-600">{error}</div>
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


