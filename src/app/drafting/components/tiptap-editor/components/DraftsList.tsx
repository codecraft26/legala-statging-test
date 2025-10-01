"use client";

import React, { useState } from "react";
import { FileText, Clock, User, Plus } from "lucide-react";
import { useDraftingList, useDraftingDetail } from "@/hooks/use-drafting";

type Props = {
  workspaceId?: string;
  onLoadDraftContent?: (data: { name?: string; content?: string }) => void;
  onCreateNewDraft?: () => void;
};

export default function DraftsList({ workspaceId, onLoadDraftContent, onCreateNewDraft }: Props) {
  const drafting = useDraftingList(workspaceId);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const draftDetail = useDraftingDetail(selectedDraftId);

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
      console.error("Error importing draft:", e);
    }
  };

  const handleDraftClick = (draftId: string) => {
    setSelectedDraftId(draftId);
  };

  const handleCreateNewDraft = () => {
    try {
      if (onCreateNewDraft) {
        onCreateNewDraft();
      }
      if (onLoadDraftContent) {
        onLoadDraftContent({ name: "New Draft", content: "" });
      }
      setSelectedDraftId(null);
    } catch (error) {
      console.error("Error preparing new draft:", error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "Unknown";
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-black" />
            <h3 className="text-lg font-semibold text-gray-900">Drafts</h3>
          </div>
          <button
            onClick={handleCreateNewDraft}
            className="flex items-center gap-1 px-3 py-1.5 bg-black hover:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-colors duration-200"
            title="Start a new draft"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {drafting.isLoading 
            ? "Loading..." 
            : `${(drafting.data || []).length} draft${(drafting.data || []).length !== 1 ? "s" : ""} available`
          }
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {drafting.isLoading ? (
          <div className="p-4 space-y-3 pb-32">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : !drafting.data || drafting.data.length === 0 ? (
          <div className="p-4 text-center pb-32">
            <FileText size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No drafts found</p>
            <p className="text-gray-400 text-xs mt-1">Create your first draft to get started</p>
          </div>
        ) : (
          <div className="p-2 space-y-1 pb-40">
            {(drafting.data || []).map((draft) => (
              <button
                key={draft.id}
                onClick={() => handleDraftClick(draft.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
                  selectedDraftId === draft.id
                    ? "bg-gray-100 border-gray-300 shadow-sm"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate text-sm">
                      {draft.name || draft.instruction || "Untitled Draft"}
                    </h4>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <User size={12} />
                        <span className="truncate">
                          {draft.user?.name || (draft.user?.email || "").split("@")[0] || "Unknown"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{formatDate(draft.updatedAt || draft.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full ${
                    selectedDraftId === draft.id ? "bg-black" : "bg-gray-300"
                  }`}></div>
                </div>
              </button>
            ))}
          </div>
        )}

      </div>

      {/* Static footer with Load Draft */}
      <div className="flex-shrink-0 px-4 pt-3 pb-4 border-t border-gray-200 bg-gray-50">
        <div className="space-y-3">
          <div>
            {selectedDraftId && draftDetail.data ? (
              <>
                <h5 className="font-medium text-gray-900 text-sm truncate">
                  {draftDetail.data.name || "Draft"}
                </h5>
                {draftDetail.data.instruction && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {draftDetail.data.instruction}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-gray-600">Select a draft to load</p>
            )}
          </div>
          <button
            onClick={handleImportDraft}
            className="w-full px-4 py-2 bg-black hover:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedDraftId || draftDetail.isLoading}
          >
            {draftDetail.isLoading ? "Loading..." : "Load Draft"}
          </button>
        </div>
      </div>
    </div>
  );
}