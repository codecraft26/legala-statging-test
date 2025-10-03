"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Api } from "@/lib/api-client";

export function useRenameDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; name: string }) => {
      const { id, name } = args;
      return await Api.patch<any, { name: string }>(
        `/document?id=${encodeURIComponent(id)}`,
        { name }
      );
    },
    onSuccess: () => {
      // Invalidate any document lists/details
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["extractions"] });
    },
  });
}

export type DocumentItem = {
  id: string;
  type: "file" | "folder";
  filename: string;
  filePath?: string;
  parent_folder_id?: string | null;
  user?: { name?: string; email?: string; role?: string };
  createdAt?: string;
};

export function useDocuments(
  workspaceId?: string | null,
  parentId?: string | null
) {
  return useQuery<DocumentItem[]>({
    enabled: Boolean(workspaceId),
    queryKey: ["documents", workspaceId, parentId || null],
    queryFn: async () => {
      const query: string[] = [
        `workspaceId=${encodeURIComponent(String(workspaceId))}`,
      ];
      if (parentId) {
        const enc = encodeURIComponent(parentId);
        query.push(`parentId=${enc}`);
        query.push(`folderId=${enc}`);
      }
      const res = await Api.get<any>(
        `/document?${query.join("&")}`,
        "no-store"
      );
      const rawList: any[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];
      return rawList.map((d: any) => ({
        id: String(d?.id ?? ""),
        type:
          String(d?.type ?? "file").toLowerCase() === "folder"
            ? "folder"
            : "file",
        filename: String(d?.name ?? d?.filename ?? ""),
        filePath: d?.filePath,
        parent_folder_id: d?.parentId ?? d?.parent_folder_id ?? null,
        user: d?.user
          ? { name: d.user.name, email: d.user.email, role: d.user.role }
          : undefined,
        createdAt: d?.createdAt,
      })) as DocumentItem[];
    },
  });
}

export function useUploadDocuments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      files: File[];
      workspaceId: string;
      parentId?: string | null;
    }) => {
      const { files, workspaceId, parentId } = args;
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      form.append("workspaceId", workspaceId);
      if (parentId) form.append("parentId", parentId);
      return await Api.post("/document/upload/files", form, true);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "documents",
          variables.workspaceId,
          variables.parentId || null,
        ],
      });
    },
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      name: string;
      workspaceId: string;
      parentId?: string | null;
    }) => {
      const { name, workspaceId, parentId } = args;
      return await Api.post("/document", {
        name,
        workspaceId,
        parentId: parentId || undefined,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "documents",
          variables.workspaceId,
          variables.parentId || null,
        ],
      });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string }) => {
      return await Api.delete(`/document?id=${encodeURIComponent(args.id)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useRenameFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; name: string }) => {
      const { id, name } = args;
      return await Api.patch<any, { name: string }>(
        `/document?id=${encodeURIComponent(id)}`,
        { name }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
