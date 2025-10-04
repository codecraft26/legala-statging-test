"use client";

import React from "react";
import { Pencil, Trash2 } from "lucide-react";

export type DocItem = {
  id: string;
  type: "file" | "folder";
  filename: string;
  filePath?: string;
  user?: { name?: string; email?: string; role?: string };
  createdAt?: string;
};

interface ItemsListProps {
  items: DocItem[];
  onFolderOpen: (item: DocItem) => void;
  onRenameFolder: (item: DocItem) => void;
  onDelete: (item: DocItem) => void;
  onFileClick?: (item: DocItem) => void;
}

export default function ItemsList({
  items,
  onFolderOpen,
  onRenameFolder,
  onDelete,
  onFileClick,
}: ItemsListProps) {
  if (!items.length) return null;
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div
          key={it.id}
          className={`flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent ${it.type === "folder" || it.type === "file" ? "cursor-pointer" : ""}`}
          onClick={() => {
            if (it.type === "folder") {
              onFolderOpen(it);
            } else if (it.type === "file" && onFileClick) {
              onFileClick(it);
            }
          }}
          role={
            it.type === "folder" || it.type === "file" ? "button" : undefined
          }
          tabIndex={it.type === "folder" || it.type === "file" ? 0 : undefined}
          onKeyDown={(e) => {
            if (it.type === "folder" && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              onFolderOpen(it);
            } else if (
              it.type === "file" &&
              onFileClick &&
              (e.key === "Enter" || e.key === " ")
            ) {
              e.preventDefault();
              onFileClick(it);
            }
          }}
        >
          <div className="text-xl">{it.type === "folder" ? "📁" : "📄"}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{it.filename}</p>
                {it.type === "file" && it.user && (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground truncate">
                      Uploaded by{" "}
                      <span className="font-medium text-foreground">
                        {it.user.name || it.user.email}
                      </span>
                    </p>
                    {it.user.role && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {it.user.role}
                      </span>
                    )}
                    {it.createdAt && (
                      <span className="text-xs text-muted-foreground">
                        • {new Date(it.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {it.type === "folder" ? (
                <button
                  className="text-xs inline-flex items-center gap-2 ml-2 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRenameFolder(it);
                  }}
                  title="Rename"
                >
                  <Pencil className="h-3 w-3" /> Rename
                </button>
              ) : null}
              <button
                className="text-red-600 hover:underline text-xs inline-flex items-center gap-1 ml-2 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(it);
                }}
                title="Delete"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
