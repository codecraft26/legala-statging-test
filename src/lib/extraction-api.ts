import { Api } from "./api-client";

// Types based on the API documentation
export interface ExtractionAgent {
  id: string;
  name: string;
  tags: string[];
  instruction: string;
  userId: string;
  workspaceId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  usage?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractionResult {
  id: string;
  file: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractionAgentWithResults extends ExtractionAgent {
  extraction_result: ExtractionResult[];
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export interface ExtractionResultDetail extends ExtractionResult {
  extraction_agent: ExtractionAgentWithResults;
}

export interface CreateExtractionFilesRequest {
  files: File[];
  name: string;
  tags: string[];
  instruction?: string;
  workspaceId: string;
}

export interface CreateExtractionDocumentsRequest {
  documentId: string[];
  name: string;
  tags: string[];
  instruction?: string;
  workspaceId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
}

// API service functions
export const extractionApi = {
  // Extract data from uploaded files
  extractFiles: async (
    request: CreateExtractionFilesRequest
  ): Promise<ApiResponse<ExtractionAgent>> => {
    try {
      const formData = new FormData();

      // Add files
      request.files.forEach((file) => {
        formData.append("files", file);
      });

      // Add other parameters
      formData.append("name", request.name);
      formData.append("tags", JSON.stringify(request.tags));
      if (request.instruction) {
        formData.append("instruction", request.instruction);
      }
      formData.append("workspaceId", request.workspaceId);

      const response = await Api.post<ApiResponse<ExtractionAgent>>(
        "/extract/files",
        formData,
        true
      );
      return response;
    } catch (error) {
      console.error("Extraction API error:", error);
      throw error;
    }
  },

  // Extract data from saved documents
  extractDocuments: async (
    request: CreateExtractionDocumentsRequest
  ): Promise<ApiResponse<ExtractionAgent>> => {
    return Api.post<ApiResponse<ExtractionAgent>>(
      "/extract/documents",
      request
    );
  },

  // Get all extractions for a workspace
  getExtractions: async (
    workspaceId: string
  ): Promise<ApiResponse<ExtractionAgentWithResults[]>> => {
    return Api.get<ApiResponse<ExtractionAgentWithResults[]>>(
      `/extract?workspaceId=${workspaceId}`
    );
  },

  // Get detailed extraction information
  getExtractionDetail: async (
    id: string
  ): Promise<ApiResponse<ExtractionAgentWithResults>> => {
    return Api.get<ApiResponse<ExtractionAgentWithResults>>(
      `/extract/detail?id=${id}`
    );
  },

  // Get extraction result detail
  getExtractionResultDetail: async (
    id: string
  ): Promise<ApiResponse<ExtractionResultDetail>> => {
    return Api.get<ApiResponse<ExtractionResultDetail>>(
      `/extract/result/detail?id=${id}`
    );
  },

  // Remove extraction agent
  removeExtractionAgent: async (
    id: string
  ): Promise<
    ApiResponse<{ id: string; name: string; status: string; deletedAt: string }>
  > => {
    return Api.delete<
      ApiResponse<{
        id: string;
        name: string;
        status: string;
        deletedAt: string;
      }>
    >(`/extract?id=${id}`);
  },

  // Remove extraction result
  removeExtractionResult: async (
    id: string
  ): Promise<ApiResponse<{ id: string; file: string; deletedAt: string }>> => {
    return Api.delete<
      ApiResponse<{ id: string; file: string; deletedAt: string }>
    >(`/extract/result?id=${id}`);
  },
};
