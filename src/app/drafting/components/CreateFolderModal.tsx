"use client";

import React from "react";
import { X, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreateFolderModalProps {
  isOpen: boolean;
  newFolderName: string;
  onNameChange: (name: string) => void;
  onClose: () => void;
  onCreate: () => void;
  isCreating: boolean;
  currentFolderName: string;
}

export default function CreateFolderModal({
  isOpen,
  newFolderName,
  onNameChange,
  onClose,
  onCreate,
  isCreating,
  currentFolderName,
}: CreateFolderModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md border shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Create New Folder</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Folder Name
            </label>
            <Input
              type="text"
              placeholder="Enter folder name"
              value={newFolderName}
              onChange={(e) => onNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onCreate();
                }
              }}
              autoFocus
            />
          </div>
          <div className="text-sm text-gray-500">
            Will be created in:{" "}
            <span className="font-medium">{currentFolderName}</span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onCreate}
            disabled={!newFolderName.trim() || isCreating}
            className="bg-black text-white hover:bg-zinc-800"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
