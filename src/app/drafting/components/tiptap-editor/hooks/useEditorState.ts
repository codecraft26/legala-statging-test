import { useCallback, useState } from "react";
import { Editor } from "@tiptap/react";
import { EditorState } from "../types";

export const useEditorState = (editor: Editor | null) => {
  const [editorState, setEditorState] = useState<EditorState>({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    code: false,
    codeBlock: false,
    bulletList: false,
    orderedList: false,
    blockquote: false,
    link: false,
    table: false,
    textAlignLeft: false,
    textAlignCenter: false,
    textAlignRight: false,
    textAlignJustify: false,
    heading1: false,
    heading2: false,
    heading3: false,
    heading4: false,
    heading5: false,
    heading6: false,
    fontSize: "",
    fontFamily: "inherit",
  });

  const updateEditorState = useCallback(() => {
    if (!editor) return;
    setEditorState({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      strike: editor.isActive("strike"),
      code: editor.isActive("code"),
      codeBlock: editor.isActive("codeBlock"),
      bulletList: editor.isActive("bulletList"),
      orderedList: editor.isActive("orderedList"),
      blockquote: editor.isActive("blockquote"),
      link: editor.isActive("link"),
      table: editor.isActive("table"),
      textAlignLeft: editor.isActive({ textAlign: "left" }),
      textAlignCenter: editor.isActive({ textAlign: "center" }),
      textAlignRight: editor.isActive({ textAlign: "right" }),
      textAlignJustify: editor.isActive({ textAlign: "justify" }),
      heading1: editor.isActive("heading", { level: 1 }),
      heading2: editor.isActive("heading", { level: 2 }),
      heading3: editor.isActive("heading", { level: 3 }),
      heading4: editor.isActive("heading", { level: 4 }),
      heading5: editor.isActive("heading", { level: 5 }),
      heading6: editor.isActive("heading", { level: 6 }),
      fontSize: editor.getAttributes("textStyle").fontSize || "",
      fontFamily: editor.getAttributes("textStyle").fontFamily || "inherit",
    });
  }, [editor]);

  return { editorState, updateEditorState };
};
