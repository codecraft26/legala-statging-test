 export interface RefineRequest {
  text: string;
  instruction: string;
}

export interface RefineResponse {
  refined_text?: string;
  text?: string;
  content?: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface RefineError {
  message: string;
  status?: number;
}

export class RefineApi {
  private static getRefineEndpoint(): string {
    // Lazy import to avoid potential circular deps at module init
    const { getApiBaseUrl } = require("@/lib/utils");
    const base: string = getApiBaseUrl();
    return `${base}/tool/refine-text`;
  }

  static async refineText(request: RefineRequest): Promise<RefineResponse> {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const response = await fetch(RefineApi.getRefineEndpoint(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      return {
        refined_text: result.refined_text || result.text || result.content,
        usage: result.usage || null,
      };
    } catch (error) {
      console.error("Error refining text:", error);
      throw error;
    }
  }

  static async refineTextStream(
    request: RefineRequest,
    onChunk: (content: string) => void,
    onUsage?: (usage: { input_tokens: number; output_tokens: number }) => void
  ): Promise<{
    content: string;
    usage?: { input_tokens: number; output_tokens: number };
  }> {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const response = await fetch(RefineApi.getRefineEndpoint(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body reader available");
      }

      const decoder = new TextDecoder();
      let content = "";
      let usage: { input_tokens: number; output_tokens: number } | undefined;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((line) => line.trim());

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.content) {
                content = data.content;
                onChunk(content);
              }
              if (data.usage) {
                usage = data.usage;
                onUsage?.(data.usage);
              }
            } catch (e) {
              console.warn("Invalid JSON in stream:", line);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      return { content, usage };
    } catch (error) {
      console.error("Error refining text with stream:", error);
      throw error;
    }
  }
}
