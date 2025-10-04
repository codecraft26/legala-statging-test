"use client";

import { useMutation } from "@tanstack/react-query";
import { Api } from "@/lib/api-client";
import { getCookie } from "@/lib/utils";

export interface SignedUrlRequest {
  file: string;
}

export interface SignedUrlResponse {
  status: number;
  url: string;
}

export function useGetSignedUrl() {
  return useMutation<SignedUrlResponse, Error, SignedUrlRequest>({
    mutationFn: async (data: SignedUrlRequest) => {
      return await Api.post<SignedUrlResponse>("/media/signed/url", data);
    },
    onError: (error) => {
      console.error("Error getting signed URL:", error);
    },
  });
}

export function useDownloadFile() {
  return useMutation<void, Error, { filePath: string }>({
    mutationFn: async ({ filePath }) => {
      // First get the signed URL
      const signedUrlResponse = await Api.post<SignedUrlResponse>(
        "/media/signed/url",
        {
          file: filePath,
        }
      );

      // For downloads, we can use a simpler approach - just open the URL directly
      // This bypasses CORS issues for downloads
      const link = document.createElement("a");
      link.href = signedUrlResponse.url;
      link.download = filePath.split("/").pop() || "document";
      link.target = "_blank"; // Open in new tab as fallback
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    onError: (error) => {
      console.error("Error downloading file:", error);
    },
  });
}

export function useFetchFileContent() {
  return useMutation<Blob, Error, { filePath: string }>({
    mutationFn: async ({ filePath }) => {
      // Try to use a proxy endpoint first (if it exists)
      try {
        const response = await fetch(
          `/api/media/proxy?file=${encodeURIComponent(filePath)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${typeof window !== "undefined" ? getCookie("token") : ""}`,
            },
          }
        );

        if (response.ok) {
          const blob = await response.blob();
          return blob;
        }
      } catch (proxyError) {
        // Proxy endpoint not available, falling back to direct fetch
      }

      // Fallback: Direct fetch with signed URL
      const signedUrlResponse = await Api.post<SignedUrlResponse>(
        "/media/signed/url",
        {
          file: filePath,
        }
      );

      // Try different fetch configurations
      const fetchConfigs = [
        // Try 1: CORS with minimal headers
        {
          method: "GET",
          mode: "cors" as RequestMode,
          credentials: "omit" as RequestCredentials,
          cache: "no-cache" as RequestCache,
        },
        // Try 2: CORS with no headers at all
        {
          method: "GET",
          mode: "cors" as RequestMode,
          credentials: "omit" as RequestCredentials,
        },
        // Try 3: Same-origin mode (won't work but worth trying)
        {
          method: "GET",
          mode: "same-origin" as RequestMode,
        },
      ];

      for (let i = 0; i < fetchConfigs.length; i++) {
        try {
          const response = await fetch(signedUrlResponse.url, fetchConfigs[i]);

          if (response.ok) {
            const blob = await response.blob();
            return blob;
          }
        } catch (error) {
          // Continue to next configuration
        }
      }

      throw new Error(
        "All fetch attempts failed. The S3 bucket may not be configured for CORS, or the signed URL may be invalid."
      );
    },
    onError: (error) => {
      console.error("Error fetching file content:", error);
    },
  });
}
