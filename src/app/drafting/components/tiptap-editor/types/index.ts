export interface TiptapEditorProps {
  onDocumentTitleChange?: (title: string) => void;
  onEditorContentChange?: (getContentFn: () => string) => void;
  currentDraftId?: string | null;
  initialTitle?: string;
  onSave?: () => void;
  isSaving?: boolean;
  onNewDraft?: () => void;
}

export interface VariableDef {
  unique_id: string;
  label: string;
  type?: "text" | "date" | "decimal" | "number";
}

export interface EditorState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  code: boolean;
  codeBlock: boolean;
  bulletList: boolean;
  orderedList: boolean;
  blockquote: boolean;
  link: boolean;
  table: boolean;
  textAlignLeft: boolean;
  textAlignCenter: boolean;
  textAlignRight: boolean;
  textAlignJustify: boolean;
  heading1: boolean;
  heading2: boolean;
  heading3: boolean;
  heading4: boolean;
  heading5: boolean;
  heading6: boolean;
  fontSize: string;
  fontFamily: string;
}

export interface DocumentData {
  title: string;
  content: string;
  variables?: Record<string, string>;
  variableDefinitions?: VariableDef[];
  lastModified: string;
  type: "template" | "final";
  replacementsMade?: number;
  originalVariables?: Record<string, string>;
}

export interface DraftFromDocumentsParams {
  documentId: string[];
  instruction: string;
  workspaceId: string;
}

export interface SaveDraftToDocumentParams {
  fileName: string;
  workspaceId: string;
  fileFormat?: "docx" | "pdf" | "txt";
}
