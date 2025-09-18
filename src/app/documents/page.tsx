"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Api } from "@/lib/api-client";
import AutoDraft from "./components/AutoDraft";
import { Trash2, Plus, Upload, Search, X } from "lucide-react";

type Item = {
  id: string;
  type: "file" | "folder";
  filename: string;
  parent_folder_id?: string | null;
};

export default function DocumentsPage() {
  const { currentWorkspace } = useSelector((s: RootState) => s.auth);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const filtered = useMemo(
    () =>
      items.filter((i) =>
        (i.filename || "").toLowerCase().includes(search.toLowerCase())
      ),
    [items, search]
  );

  const fetchItems = async (folderId: string | null = null) => {
    if (!currentWorkspace) return;
    setIsFetching(true);
    try {
      const query: string[] = [
        `workspaceId=${encodeURIComponent(currentWorkspace.id)}`,
      ];
      if (folderId) {
        // Send both to be compatible with different backends expecting either param
        const enc = encodeURIComponent(folderId);
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
      const list: Item[] = rawList.map((d: any) => ({
        id: String(d?.id ?? ""),
        type:
          String(d?.type ?? "file").toLowerCase() === "folder"
            ? "folder"
            : "file",
        filename: String(d?.name ?? d?.filename ?? ""),
        parent_folder_id: d?.parentId ?? d?.parent_folder_id ?? null,
      }));
      setItems(list);
    } catch (e) {
      // noop for now
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    setFolderPath([]);
    setCurrentFolderId(null);
    fetchItems(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace]);

  // Fetch items whenever the current folder changes (navigate into/out of subfolders)
  useEffect(() => {
    if (!currentWorkspace) return;
    fetchItems(currentFolderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !currentWorkspace) return;
    const form = new FormData();
    Array.from(files).forEach((f) => form.append("files", f));
    form.append("workspaceId", currentWorkspace.id);
    if (currentFolderId) form.append("parentId", currentFolderId);
    setIsUploading(true);
    try {
      await Api.post("/document/upload/files", form, true);
      setShowUploadArea(false);
      fetchItems(currentFolderId);
    } catch (e) {
      // noop
    } finally {
      setIsUploading(false);
    }
  };

  const createFolder = async () => {
    if (!currentWorkspace) return;
    const name = newFolderName.trim();
    if (!name) return;
    try {
      await Api.post("/document", {
        name,
        workspaceId: currentWorkspace.id,
        parentId: currentFolderId || undefined,
      });
      setNewFolderName("");
      setShowCreateFolderModal(false);
      fetchItems(currentFolderId);
    } catch {}
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleUpload(e.target.files);
    if (e.target) e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  const remove = async (item: Item) => {
    if (!window.confirm(`Delete this ${item.type}? This cannot be undone.`))
      return;
    try {
      await Api.delete(`/document?id=${encodeURIComponent(item.id)}`);
      fetchItems(currentFolderId);
    } catch {}
  };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="rounded-lg border bg-background overflow-hidden">
        <div className="border-b p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <button
                onClick={() => {
                  setCurrentFolderId(null);
                  setFolderPath([]);
                }}
                className="rounded-md border px-2 py-1"
                title="Home"
              >
                🏠
              </button>
              {folderPath.map((f, idx) => (
                <div key={f.id} className="flex items-center gap-1">
                  <span>›</span>
                  <button
                    onClick={() => {
                      const np = folderPath.slice(0, idx + 1);
                      setFolderPath(np);
                      setCurrentFolderId(np[np.length - 1].id);
                    }}
                    className="text-muted-foreground hover:underline"
                  >
                    {f.name}
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateFolderModal(true)}
                className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-accent"
              >
                <Plus className="h-4 w-4" /> New Folder
              </button>
              <button
                onClick={() => setShowUploadArea((v) => !v)}
                className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-accent"
              >
                <Upload className="h-4 w-4" /> Upload Files
              </button>
            </div>
          </div>

          <div className="mt-3 relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files and folders…"
              className="w-full rounded-md border px-8 py-2 text-sm"
            />
          </div>

          {showUploadArea ? (
            <div className="mt-4 relative">
              <button
                onClick={() => setShowUploadArea(false)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center ${isDragOver ? "border-blue-500 bg-blue-50" : "border-muted bg-accent"} ${isUploading ? "opacity-60 pointer-events-none" : ""}`}
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="text-sm mt-2">
                  {isUploading ? "Uploading…" : "Upload Files"}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Drag and drop or click to browse
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="rounded-md border px-3 py-2 text-sm hover:bg-accent"
                >
                  {isUploading ? "Uploading…" : "Choose Files"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                />
              </div>
            </div>
          ) : null}
        </div>

        {isFetching ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : (
          <div className="p-4">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-6xl">📁</div>
                <p>No files or folders found</p>
                {!showUploadArea ? (
                  <button
                    onClick={() => setShowUploadArea(true)}
                    className="mt-4 rounded-md border px-3 py-2 text-sm hover:bg-accent"
                  >
                    Upload Your First File
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent"
                  >
                    <div className="text-xl">
                      {it.type === "folder" ? "📁" : "📄"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-medium">
                          {it.filename}
                        </p>
                        <button
                          className="text-red-600 hover:underline text-xs inline-flex items-center gap-1"
                          onClick={() => remove(it)}
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </div>
                    {it.type === "folder" ? (
                      <button
                        className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
                        onClick={() => {
                          setCurrentFolderId(it.id);
                          setFolderPath((p) => [
                            ...p,
                            { id: it.id, name: it.filename },
                          ]);
                        }}
                      >
                        Open
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="border-t px-4 py-3 text-sm text-muted-foreground">
          {filtered.length} item{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {showCreateFolderModal ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-background rounded-lg p-6 w-full max-w-md border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Create New Folder</h3>
              <button
                onClick={() => setShowCreateFolderModal(false)}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm mb-3"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowCreateFolderModal(false)}
                className="rounded-md border px-3 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={createFolder}
                className="rounded-md border px-3 py-2 text-sm hover:bg-accent"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AutoDraft />
    </main>
  );
}
