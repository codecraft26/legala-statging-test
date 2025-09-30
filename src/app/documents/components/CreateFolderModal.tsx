"use client";

import React from "react";
import { X } from "lucide-react";

interface CreateFolderModalProps {
  open: boolean;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  onCreate: () => void;
}

export default function CreateFolderModal({ open, value, onChange, onClose, onCreate }: CreateFolderModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-background rounded-lg p-6 w-full max-w-md border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Create New Folder</h3>
          <button onClick={onClose} className="text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <input
          type="text"
          placeholder="Folder name"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm mb-3"
        />
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-md border px-3 py-2 text-sm">Cancel</button>
          <button onClick={onCreate} className="rounded-md border px-3 py-2 text-sm hover:bg-accent">Create</button>
        </div>
      </div>
    </div>
  );
}


