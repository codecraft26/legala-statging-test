"use client";

import React, { useEffect, useState } from "react";
import { FileText, Folder, ChevronLeft, Upload } from "lucide-react";
import { Api } from "@/lib/api-client";
import { useDraftingList, useDraftingDetail } from "@/hooks/use-drafting";

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
  onLoadDraftContent?: (data: { name?: string; content?: string }) => void;
};

export default function DocumentBrowser({ workspaceId, onImportDocx, onLoadDraftContent }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const drafting = useDraftingList(workspaceId);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const draftDetail = useDraftingDetail(selectedDraftId);
  const [isDraftsOpen, setIsDraftsOpen] = useState(false);

  const handleImportDraft = async () => {
    if (!selectedDraftId) return;
    try {
      let data = draftDetail.data;
      if (!data) {
        const res: any = await draftDetail.refetch();
        data = (res?.data as any) || null;
      }
      if (data && onLoadDraftContent) {
        onLoadDraftContent({ name: data.name, content: data.content || "" });
      }
    } catch (e) {
      // noop
    }
  };

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

  // Do not auto-import on select; import happens only on button click

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
                    className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded border text-black border-gray-300 hover:bg-gray-100"
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
          {/* Drafting list inside dropdown */}
        </div>
      ) : null}

      {/* Separate Drafting section */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Drafting</label>
          <button
            onClick={() => setIsDraftsOpen((v) => !v)}
            className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
          >
            {isDraftsOpen ? "Hide" : "Browse"}
          </button>
        </div>
        {isDraftsOpen ? (
          <div className="border rounded-md overflow-hidden">
            <div className="p-2 border-b text-xs text-gray-500">
              {drafting.isLoading
                ? "Loading…"
                : `${(drafting.data || []).length} draft${(drafting.data || []).length !== 1 ? "s" : ""}`}
            </div>
            {drafting.isLoading ? (
              <div className="p-2 text-xs text-gray-500">Loading drafts…</div>
            ) : !drafting.data || drafting.data.length === 0 ? (
              <div className="p-2 text-xs text-gray-500">No drafts found</div>
            ) : (
              <div className="max-h-64 overflow-auto">
                {(drafting.data || []).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => { setSelectedDraftId(d.id); }}
                    className={`w-full text-left px-3 py-2 text-sm border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-zinc-800 ${
                      selectedDraftId === d.id
                        ? "bg-gray-100 dark:bg-zinc-800"
                        : "bg-white dark:bg-zinc-900"
                    }`}
                    title={d.name || d.instruction}
                  >
                    <div className="truncate">{d.name || d.instruction || "Untitled"}</div>
                    <div className="text-xs text-gray-500 truncate">Uploaded by: {d.user?.name || (d.user?.email || "").split("@")[0] || "Unknown"}</div>
                  </button>
                ))}
              </div>
            )}
            {selectedDraftId ? (
              <div className="p-2 bg-gray-50 space-y-2">
                {draftDetail.isLoading ? (
                  <div className="text-xs text-gray-500">Loading draft…</div>
                ) : draftDetail.data ? (
                  <div className="space-y-1">
                    <div className="text-sm font-medium truncate">{draftDetail.data.name || "Draft"}</div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">No details</div>
                )}
                <button
                  onClick={handleImportDraft}
                  className="w-full text-xs px-3 py-2 rounded border bg-white hover:bg-gray-100"
                  disabled={draftDetail.isLoading}
                >
                  {draftDetail.isLoading ? "Importing…" : "Import Document"}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
