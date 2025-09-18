"use client";

import React, { useEffect, useState } from "react";
import { FileText, Folder, ChevronLeft, Upload } from "lucide-react";
import { Api } from "@/lib/api-client";

type Item = {
  id: string;
  type: "file" | "folder";
  filename: string;
  s3_key_original?: string;
};

type Props = {
  workspaceId?: string;
  onImportDocx: (doc: {
    id: string;
    filename: string;
    s3_key_original?: string;
  }) => void;
};

export default function DocumentBrowser({ workspaceId, onImportDocx }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchItems = async (folderId: string | null) => {
    if (!workspaceId) return;
    setIsLoading(true);
    try {
      const query: string[] = [
        `workspaceId=${encodeURIComponent(workspaceId)}`,
      ];
      if (folderId) {
        const enc = encodeURIComponent(folderId);
        query.push(`parentId=${enc}`);
        query.push(`folderId=${enc}`);
      }
      const res = await Api.get<any>(
        `/document?${query.join("&")}`,
        "no-store"
      );
      const raw: any[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];
      const list: Item[] = raw.map((d: any) => ({
        id: String(d?.id ?? ""),
        type:
          String(d?.type ?? "file").toLowerCase() === "folder"
            ? "folder"
            : "file",
        filename: String(d?.name ?? d?.filename ?? ""),
        s3_key_original: d?.s3_key_original,
      }));
      setItems(list);
    } catch (e) {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setFolderPath([]);
    setCurrentFolderId(null);
    fetchItems(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, workspaceId]);

  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">
          Datahub Documents
        </label>
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
        >
          {isOpen ? "Hide" : "Browse"}
        </button>
      </div>
      {isOpen ? (
        <div className="border rounded-md overflow-hidden">
          <div className="p-2 border-b text-xs text-gray-500 flex items-center gap-2">
            {folderPath.length > 0 ? (
              <button
                className="inline-flex items-center gap-1 px-2 py-1 rounded border hover:bg-gray-50"
                onClick={() => {
                  const np = folderPath.slice(0, -1);
                  setFolderPath(np);
                  setCurrentFolderId(np.length ? np[np.length - 1].id : null);
                  fetchItems(np.length ? np[np.length - 1].id : null);
                }}
              >
                <ChevronLeft className="h-3 w-3" /> Back
              </button>
            ) : null}
            <span>
              {isLoading
                ? "Loading…"
                : `${items.length} item${items.length !== 1 ? "s" : ""}`}
            </span>
          </div>
          <div className="max-h-64 overflow-auto">
            {items.map((it) => (
              <div
                key={it.id}
                className="flex items-center justify-between px-3 py-2 text-sm border-b last:border-b-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="text-gray-500">
                    {it.type === "folder" ? (
                      <Folder className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </div>
                  <div className="truncate">{it.filename}</div>
                </div>
                {it.type === "folder" ? (
                  <button
                    className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                    onClick={() => {
                      setFolderPath((p) => [
                        ...p,
                        { id: it.id, name: it.filename },
                      ]);
                      setCurrentFolderId(it.id);
                      fetchItems(it.id);
                    }}
                  >
                    Open
                  </button>
                ) : it.filename.toLowerCase().endsWith(".docx") ? (
                  <button
                    className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded border text-blue-700 border-blue-300 hover:bg-blue-50"
                    onClick={() =>
                      onImportDocx({
                        id: it.id,
                        filename: it.filename,
                        s3_key_original: it.s3_key_original,
                      })
                    }
                    title="Import .docx"
                  >
                    <Upload className="h-3 w-3" /> Import
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">Unsupported</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
