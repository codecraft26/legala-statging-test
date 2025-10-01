import { Api } from "@/lib/api-client";

export interface DraftingRequest {
  documentId: string[];
  instruction: string;
  workspaceId: string;
}

export interface DraftingResponse {
  id: string;
  status: string;
  content?: string;
}

export interface CreateEmptyDraftRequest {
  name: string;
  workspaceId: string;
}

export interface CreateEmptyDraftResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    status: string;
    instruction: string;
    content: string;
    workspaceId: string;
    usage: number;
    userId: string;
    error: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export interface UpdateDraftRequest {
  id: string;
  name?: string;
  content?: string;
}

export interface UpdateDraftResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    status: string;
    instruction: string;
    content: string;
    workspaceId: string;
    usage: number;
    userId: string;
    error: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export const DraftingApi = {
  /**
   * Draft a document from existing documents
   * @param request - Drafting request with document IDs, instruction, and workspace
   * @returns Promise with draft response
   */
  draftFromDocuments: async (request: DraftingRequest): Promise<DraftingResponse> => {
    return Api.post<DraftingResponse>("/drafting", request);
  },

  /**
   * Create an empty draft
   * @param request - Request with name and workspaceId
   * @returns Promise with draft response
   */
  createEmptyDraft: async (request: CreateEmptyDraftRequest): Promise<CreateEmptyDraftResponse> => {
    return Api.post<CreateEmptyDraftResponse>("/drafting/empty", request);
  },

  /**
   * Update an existing draft
   * @param request - Request with draft ID and updated fields
   * @returns Promise with updated draft response
   */
  updateDraft: async (request: UpdateDraftRequest): Promise<UpdateDraftResponse> => {
    const { id, ...updateData } = request;
    return Api.patch<UpdateDraftResponse>(`/drafting?id=${encodeURIComponent(id)}`, updateData);
  },

  /**
   * Save draft as a document
   * @param draftId - ID of the draft to save
   * @param fileName - Name for the saved document
   * @param workspaceId - Workspace ID
   * @param fileFormat - File format (docx, pdf, txt)
   */
  saveDraftToDocument: async (
    draftId: string,
    fileName: string,
    workspaceId: string,
    fileFormat: "docx" | "pdf" | "txt" = "docx"
  ): Promise<any> => {
    return Api.post("/drafting/save-to-document", {
      draftId,
      fileName: fileName.endsWith(`.${fileFormat}`) ? fileName : `${fileName}.${fileFormat}`,
      workspaceId,
      fileFormat,
    });
  },
};
