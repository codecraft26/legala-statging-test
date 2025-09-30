"use client";

import React from "react";
import { X } from "lucide-react";

interface RenameModalProps {
  open: boolean;
  value: string;
  busy?: boolean;
  onChange: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export default function RenameModal({ open, value, busy, onChange, onClose, onSubmit }: RenameModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-background rounded-lg p-6 w-full max-w-md border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Rename File</h3>
          <button onClick={onClose} className="text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
          }}
          className="w-full rounded-md border px-3 py-2 text-sm mb-3"
        />
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-md border px-3 py-2 text-sm">Cancel</button>
          <button onClick={onSubmit} disabled={!!busy} className="rounded-md border px-3 py-2 text-sm hover:bg-accent">
            {busy ? "Renaming…" : "Rename"}
          </button>
        </div>
      </div>
    </div>
  );
}


