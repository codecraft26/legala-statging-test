"use client";

import React, { useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  Hash,
  Table as TableIcon,
  Minus,
  FilePlus,
  ArrowRightFromLine,
} from "lucide-react";
import { Editor } from "@tiptap/react";

type Props = {
  editor: Editor | null;
  editorState: any;
  updateEditorState: () => void;
  showTableMenu: boolean;
  setShowTableMenu: (v: boolean) => void;
  tableRows: number;
  setTableRows: (n: number) => void;
  tableCols: number;
  setTableCols: (n: number) => void;
  tableWithHeader: boolean;
  setTableWithHeader: (v: boolean) => void;
  setShowLinkModal: (v: boolean) => void;
  setShowCustomFontSizeInput: (v: boolean) => void;
  content?: string;
  onSave?: () => void;
  isSaving?: boolean;
};

export default function EditorToolbar(props: Props) {
  const {
    editor,
    editorState,
    updateEditorState,
    onSave,
    isSaving,
    showTableMenu,
    setShowTableMenu,
    tableRows,
    setTableRows,
    tableCols,
    setTableCols,
    tableWithHeader,
    setTableWithHeader,
    setShowLinkModal,
    setShowCustomFontSizeInput,
  } = props;
  const params = useSearchParams();
  const tableMenuRef = useRef<HTMLDivElement | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        tableMenuRef.current &&
        !tableMenuRef.current.contains(e.target as Node)
      ) {
        setShowTableMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [setShowTableMenu]);

  const ToolbarButton: React.FC<{
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    title?: string;
    className?: string;
    children: React.ReactNode;
  }> = ({ onClick, isActive, disabled, title, className = "", children }) => (
    <button
      onClick={(e) => {
        e.preventDefault();
        onClick();
        setTimeout(() => updateEditorState(), 10);
      }}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
        isActive ? "bg-gray-200 text-black" : "text-gray-700"
      } ${className}`}
    >
      {children}
    </button>
  );

  if (!editor) return null;

  const insertNewBlock = () => {
    editor
      .chain()
      .focus()
      .unsetAllMarks()
      .setParagraph()
      .insertContent("<p><br></p>")
      .run();
  };

  const exitBlock = () => {
    const { selection, doc } = editor.state;
    const { $from } = selection as any;
    const pos = Math.min($from.after($from.depth), doc.content.size);
    editor
      .chain()
      .focus()
      .setTextSelection(pos)
      .insertContent("<p></p>")
      .setTextSelection(pos + 1)
      .run();
  };

  return (
    <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="px-4 py-3 space-y-3 overflow-x-auto">
        <div className="flex items-center justify-between min-w-max">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg">
              <ToolbarButton
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().chain().focus().undo().run()}
                title="Undo"
              >
                <Undo size={16} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().chain().focus().redo().run()}
                title="Redo"
              >
                <Redo size={16} />
              </ToolbarButton>
            </div>

            <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editorState.bold}
                title="Bold"
              >
                <Bold size={16} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editorState.italic}
                title="Italic"
              >
                <Italic size={16} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                isActive={editorState.underline}
                title="Underline"
              >
                <UnderlineIcon size={16} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editorState.strike}
                title="Strikethrough"
              >
                <Strikethrough size={16} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleCode().run()}
                isActive={editorState.code}
                title="Inline Code"
              >
                <Code size={16} />
              </ToolbarButton>
            </div>

            <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editorState.bulletList}
                title="Bullet List"
              >
                <List size={16} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editorState.orderedList}
                title="Numbered List"
              >
                <ListOrdered size={16} />
              </ToolbarButton>
            </div>

            <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editorState.blockquote}
                title="Blockquote"
              >
                <Quote size={16} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                isActive={editorState.codeBlock}
                title="Code Block"
              >
                <Hash size={16} />
              </ToolbarButton>
              <ToolbarButton onClick={insertNewBlock} title="Insert New Block">
                <FilePlus size={16} />
              </ToolbarButton>
              <ToolbarButton onClick={exitBlock} title="Exit Block">
                <ArrowRightFromLine size={16} />
              </ToolbarButton>
            </div>

            <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg">
              <ToolbarButton
                onClick={() =>
                  editor.chain().focus().setTextAlign("left").run()
                }
                isActive={editorState.textAlignLeft}
                title="Align Left"
              >
                <AlignLeft size={16} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() =>
                  editor.chain().focus().setTextAlign("center").run()
                }
                isActive={editorState.textAlignCenter}
                title="Align Center"
              >
                <AlignCenter size={16} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() =>
                  editor.chain().focus().setTextAlign("right").run()
                }
                isActive={editorState.textAlignRight}
                title="Align Right"
              >
                <AlignRight size={16} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() =>
                  editor.chain().focus().setTextAlign("justify").run()
                }
                title="Justify"
              >
                <AlignJustify size={16} />
              </ToolbarButton>
            </div>

            <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg">
              <ToolbarButton
                onClick={() => setShowLinkModal(true)}
                isActive={editorState.link}
                title="Add Link"
              >
                <LinkIcon size={16} />
              </ToolbarButton>
              <div className="relative" ref={tableMenuRef}>
                <ToolbarButton
                  onClick={() => setShowTableMenu(!showTableMenu)}
                  isActive={editorState.table || showTableMenu}
                  title="Table Options"
                >
                  <TableIcon size={16} />
                </ToolbarButton>
                {showTableMenu ? (
                  <div className="absolute z-10 mt-2 w-60 bg-white border rounded-md shadow">
                    <div className="p-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Rows</span>
                        <input
                          type="number"
                          className="w-20 border rounded px-2 py-1"
                          value={tableRows}
                          onChange={(e) =>
                            setTableRows(parseInt(e.target.value || "0", 10))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Columns</span>
                        <input
                          type="number"
                          className="w-20 border rounded px-2 py-1"
                          value={tableCols}
                          onChange={(e) =>
                            setTableCols(parseInt(e.target.value || "0", 10))
                          }
                        />
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={tableWithHeader}
                          onChange={(e) => setTableWithHeader(e.target.checked)}
                        />
                        <span>Header row</span>
                      </label>
                      <button
                        className="w-full border rounded px-2 py-1 hover:bg-gray-50"
                        onClick={() => {
                          editor
                            .chain()
                            .focus()
                            .insertTable({
                              rows: Math.max(1, tableRows),
                              cols: Math.max(1, tableCols),
                              withHeaderRow: tableWithHeader,
                            })
                            .run();
                          setShowTableMenu(false);
                        }}
                      >
                        Insert table
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg">
              <ToolbarButton
                onClick={() => editor.chain().focus().unsetAllMarks().run()}
                title="Clear Formatting"
              >
                <Code size={16} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                title="Horizontal Rule"
              >
                <Minus size={16} />
              </ToolbarButton>
            </div>

            {/* Save button removed per requirements */}
          </div>
        </div>
      </div>
    </div>
  );
}
