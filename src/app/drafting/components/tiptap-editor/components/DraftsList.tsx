"use client";

import React, { useState } from "react";
import { FileText, Clock, User, Plus } from "lucide-react";
import { useDraftingList, useDraftingDetail, useCreateEmptyDraft } from "@/hooks/use-drafting";

type Props = {
  workspaceId?: string;
  onLoadDraftContent?: (data: { name?: string; content?: string }) => void;
  onCreateNewDraft?: () => void;
};

export default function DraftsList({ workspaceId, onLoadDraftContent, onCreateNewDraft }: Props) {
  const drafting = useDraftingList(workspaceId);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const draftDetail = useDraftingDetail(selectedDraftId);
  const createEmptyDraft = useCreateEmptyDraft(workspaceId);

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

  const handleCreateNewDraft = async () => {
    if (!workspaceId) return;
    try {
      const newDraft = await createEmptyDraft.mutateAsync({
        name: "New Draft",
        workspaceId: workspaceId,
      });
      if (onCreateNewDraft) {
        onCreateNewDraft();
      }
      // Load the new draft content
      if (onLoadDraftContent) {
        onLoadDraftContent({ name: newDraft.name, content: "" });
      }
    } catch (error) {
      console.error("Error creating new draft:", error);
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
            <FileText size={18} className="text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Drafts</h3>
          </div>
          <button
            onClick={handleCreateNewDraft}
            disabled={!workspaceId || createEmptyDraft.isPending}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors duration-200"
            title="Create new draft"
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

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {drafting.isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : !drafting.data || drafting.data.length === 0 ? (
          <div className="p-4 text-center">
            <FileText size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No drafts found</p>
            <p className="text-gray-400 text-xs mt-1">Create your first draft to get started</p>
          </div>
        ) : (
          <div className="overflow-y-auto h-full">
            <div className="p-2 space-y-1">
              {(drafting.data || []).map((draft) => (
                <button
                  key={draft.id}
                  onClick={() => handleDraftClick(draft.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
                    selectedDraftId === draft.id
                      ? "bg-blue-50 border-blue-200 shadow-sm"
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
                      selectedDraftId === draft.id ? "bg-blue-500" : "bg-gray-300"
                    }`}></div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected Draft Details & Import Button */}
      {selectedDraftId && (
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
          {draftDetail.isLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : draftDetail.data ? (
            <div className="space-y-3">
              <div>
                <h5 className="font-medium text-gray-900 text-sm truncate">
                  {draftDetail.data.name || "Draft"}
                </h5>
                {draftDetail.data.instruction && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {draftDetail.data.instruction}
                  </p>
                )}
              </div>
              <button
                onClick={handleImportDraft}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={draftDetail.isLoading}
              >
                {draftDetail.isLoading ? "Loading..." : "Load Draft"}
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Unable to load draft details</div>
          )}
        </div>
      )}
    </div>
  );
}