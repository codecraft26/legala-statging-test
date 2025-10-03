import { useEditor } from "@tiptap/react";
import { useCallback, useEffect, useState } from "react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import FontFamily from "@tiptap/extension-font-family";
import TextStyle from "@tiptap/extension-text-style";
import Gapcursor from "@tiptap/extension-gapcursor";
import { TrailingNode } from "../extensions/TrailingNode";
import { FontSize } from "../extensions/FontSize";
import { VariableHighlight } from "../extensions/VariableHighlight";
import { SlashCommands } from "../slash-commands";

export const useEditorSetup = (
  content: string,
  onVariableClick: (variableId: string) => void,
  variables: any[],
  onOpenAIModal?: () => void
) => {
  const [contentUpdateTrigger, setContentUpdateTrigger] = useState(0);

  const editor = useEditor({
    autofocus: true,
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      TextStyle,
      FontFamily,
      FontSize,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
        defaultAlignment: "left",
      }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: 'Start typing or press "/" for commands…',
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
        includeChildren: false,
      }),
      CharacterCount.configure({ limit: undefined }),
      VariableHighlight.configure({
        onVariableClick,
        currentVariables: variables,
      }),
      Gapcursor,
      TrailingNode.configure({ node: "paragraph" }),
      SlashCommands.configure({
        onOpenAIModal,
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "prose prose-lg max-w-none focus:outline-none tiptap-editor-content",
      },
    },
    content: content || "<p>Start drafting your document…</p>",
  });

  // Update variable highlighting when variables change
  useEffect(() => {
    if (editor && variables) {
      const variableHighlightExt = editor.extensionManager.extensions.find(
        (ext) => ext.name === "variableHighlight"
      );
      if (variableHighlightExt) {
        variableHighlightExt.options.currentVariables = variables;
        // Don't dispatch - just update the options, the extension will handle re-rendering
      }
    }
  }, [editor, variables]);

  // Effect to update editor content when content state changes
  useEffect(() => {
    if (editor && content && content !== editor.getHTML()) {
      // Content state changed, updating editor
      editor.chain().focus().setContent(content, false).run();
    }
  }, [editor, content]);

  const updateContent = useCallback((newContent: string) => {
    setContentUpdateTrigger((prev) => prev + 1);
  }, []);

  return { editor, contentUpdateTrigger, updateContent };
};
