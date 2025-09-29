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
