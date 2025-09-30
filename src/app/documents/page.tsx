"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getCookie as getCookieUtil } from "@/lib/utils";
import { Api } from "@/lib/api-client";
import AutoDraft from "./components/AutoDraft";
import { Trash2, Plus, Upload } from "lucide-react";
import { useCreateFolder, useDeleteDocument, useDocuments, useRenameFolder, useUploadDocuments } from "@/hooks/use-documents";
import Breadcrumbs from "./components/Breadcrumbs";
import SearchInput from "./components/SearchInput";
import UploadArea from "./components/UploadArea";
import ItemsList from "./components/ItemsList";
import CreateFolderModal from "./components/CreateFolderModal";
import RenameModal from "./components/RenameModal";

type Item = {
  id: string;
  type: "file" | "folder";
  filename: string;
  parent_folder_id?: string | null;
  user?: {
    name?: string;
    email?: string;
    role?: string;
  };
  createdAt?: string;
};

export default function DocumentsPage() {
  const currentWorkspace = React.useMemo(() => {
    const id = typeof window !== "undefined" ? getCookieUtil("workspaceId") : null;
    if (!id) return undefined as any;
    return { id, name: "Workspace" } as any;
  }, []);
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
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameFolderMutation = useRenameFolder();
  const uploadMutation = useUploadDocuments();
  const createFolderMutation = useCreateFolder();
  const deleteMutation = useDeleteDocument();

  const filtered = useMemo(
    () =>
      items.filter((i) =>
        (i.filename || "").toLowerCase().includes(search.toLowerCase())
      ),
    [items, search]
  );

  const { data: docsData, isLoading: docsLoading } = useDocuments(currentWorkspace?.id, currentFolderId);
  useEffect(() => {
    if (docsData) setItems(docsData as any);
  }, [docsData]);

  useEffect(() => {
    setFolderPath([]);
    setCurrentFolderId(null);
    // handled by useDocuments
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace]);

  // Fetch items whenever the current folder changes (navigate into/out of subfolders)
  useEffect(() => {
    if (!currentWorkspace) return;
    // handled by useDocuments
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !currentWorkspace) return;
    setIsUploading(true);
    try {
      await uploadMutation.mutateAsync({ files: Array.from(files), workspaceId: currentWorkspace.id, parentId: currentFolderId });
      setShowUploadArea(false);
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
      await createFolderMutation.mutateAsync({ name, workspaceId: currentWorkspace.id, parentId: currentFolderId });
      setNewFolderName("");
      setShowCreateFolderModal(false);
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
      await deleteMutation.mutateAsync({ id: item.id });
    } catch {}
  };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="rounded-lg border bg-background overflow-hidden">
        <div className="border-b p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Breadcrumbs
              path={folderPath}
              onHome={() => {
                setCurrentFolderId(null);
                setFolderPath([]);
              }}
              onCrumbClick={(idx) => {
                const np = folderPath.slice(0, idx + 1);
                setFolderPath(np);
                setCurrentFolderId(np[np.length - 1].id);
              }}
            />
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

          <SearchInput value={search} onChange={setSearch} />

          <UploadArea
            isOpen={showUploadArea}
            isUploading={isUploading}
            isDragOver={isDragOver}
            onClose={() => setShowUploadArea(false)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onSelectFiles={(files) => {
              handleUpload(files);
            }}
          />
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
              <ItemsList
                items={filtered as any}
                onFolderOpen={(it: any) => {
                  setCurrentFolderId(it.id);
                  setFolderPath((p) => [...p, { id: it.id, name: it.filename }]);
                }}
                onRenameFolder={(it: any) => {
                  setRenamingId(it.id);
                  setRenameValue(it.filename);
                }}
                onDelete={(it: any) => remove(it)}
              />
            )}
          </div>
        )}

        <div className="border-t px-4 py-3 text-sm text-muted-foreground">
          {filtered.length} item{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      <CreateFolderModal
        open={showCreateFolderModal}
        value={newFolderName}
        onChange={setNewFolderName}
        onClose={() => setShowCreateFolderModal(false)}
        onCreate={createFolder}
      />

      <RenameModal
        open={!!renamingId}
        value={renameValue}
        busy={renameFolderMutation.isPending}
        onChange={setRenameValue}
        onClose={() => setRenamingId(null)}
        onSubmit={async () => {
          if (!renameValue.trim() || !renamingId) return;
          try {
            await renameFolderMutation.mutateAsync({ id: renamingId, name: renameValue.trim() });
            setRenamingId(null);
          } catch {}
        }}
      />

      <AutoDraft />
    </main>
  );
}
