"use client";

import React from "react";
import { Api } from "@/lib/api-client";
import { useDraftingList, useDeleteDrafting, useCreateEmptyDraft } from "@/hooks/use-drafting";
import { useRouter } from "next/navigation";
import { getCookie } from "@/lib/utils";

type AutoDraftItem = {
  id: string;
  file: string;
  user_role: string;
  user_email: string;
  created_at: string;
};

export default function AutoDraft() {
  const [drafting, setDrafting] = React.useState<AutoDraftItem[]>([]);
  const [mounted, setMounted] = React.useState(false);
  const [workspaceId, setWorkspaceId] = React.useState<string | null>(null);
  const draftingList = useDraftingList(workspaceId);
  const deleteDraft = useDeleteDrafting(workspaceId);
  const createEmptyDraft = useCreateEmptyDraft(workspaceId);
  const router = useRouter();

  React.useEffect(() => {
    setMounted(true);
    try {
      const id = typeof window !== "undefined" ? getCookie("workspaceId") : null;
      setWorkspaceId(id);
    } catch {
      setWorkspaceId(null);
    }
  }, []);

  const getDisplayRole = (role: string) => {
    switch (role?.toLowerCase()) {
      case "owner":
        return "Owner";
      case "admin":
        return "Admin";
      case "member":
        return "Member";
      default:
        return role || "Member";
    }
  };
  const [template, setTemplate] = React.useState<AutoDraftItem[]>([]);
  const [invalidated, setInvalidated] = React.useState(false);
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(
    new Set()
  );

  const folders: Array<{ name: string; files: any[] }> = [
    { name: "Drafting", files: draftingList.data || [] },
    { name: "Template", files: template },
  ];

  const toggleFolder = (folderName: string) => {
    const next = new Set(expandedFolders);
    if (next.has(folderName)) next.delete(folderName);
    else next.add(folderName);
    setExpandedFolders(next);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const handleCreateNewDraft = async () => {
    if (!workspaceId) return;
    try {
      const newDraft = await createEmptyDraft.mutateAsync({
        name: "New Draft",
        workspaceId: workspaceId,
      });
      // Navigate to the drafting page with the new draft
      router.push("/drafting");
    } catch (error) {
      console.error("Error creating new draft:", error);
    }
  };

  const removeDraft = async (id: string) => {
    try {
      await Api.delete(`/auto-drafts/${encodeURIComponent(id)}`);
      setInvalidated((v) => !v);
    } catch {}
  };

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [templateRes] = await Promise.all([
          Api.get<{ autoDrafts: AutoDraftItem[] }>(
            `/auto-drafts?folder=template`,
            "no-store"
          ),
        ]);
        if (!mounted) return;
        setTemplate(
          templateRes?.autoDrafts ??
            (templateRes as any)?.data?.autoDrafts ??
            []
        );
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [invalidated]);

  return (
    <div className="p-1 select-none">
      <div className="bg-white rounded-lg border">
        <div className="px-4 py-3 border-b bg-white rounded-t-lg">
          <h2 className="text-base font-semibold">Auto Draft</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Auto drafts saved documents for template and drafting.
          </p>
        </div>
        {folders.map(({ name, files }) => {
          const isExpanded = expandedFolders.has(name);
          return (
            <div key={name} className="border-b last:border-b-0">
              <div className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleFolder(name)}>
                  <div
                    className={`transition-transform ${isExpanded ? "rotate-90" : "rotate-0"}`}
                  >
                    <svg
                      className="w-4 h-4 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                  <div className="text-2xl">{isExpanded ? "📂" : "📁"}</div>
                  <span className="text-sm font-medium">{name}</span>
                  <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
                    {files.length} {files.length === 1 ? "file" : "files"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {name === "Drafting" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateNewDraft();
                      }}
                      disabled={!mounted || !workspaceId || createEmptyDraft.isPending}
                      className="p-1.5 hover:bg-blue-100 rounded text-blue-600 disabled:text-gray-400 disabled:hover:bg-gray-100 transition-colors"
                      title="Create new draft"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  )}
                  {name === "Drafting" && mounted && draftingList.isFetching ? (
                    <span className="text-xs text-muted-foreground">Refreshing…</span>
                  ) : null}
                </div>
              </div>
              {isExpanded ? (
                <div className="bg-white">
                  {name === "Drafting"
                    ? (
                        (files as any[]).length === 0 ? (
                          <div className="p-3 ml-8 border-l text-xs text-muted-foreground">No drafting jobs</div>
                        ) : (
                          (files as any[]).map((job: any) => (
                            <div key={job.id} className="flex items-center justify-between p-3 ml-8 border-l hover:bg-gray-50">
                              <div className="flex items-center gap-3 flex-1">
                                <span className="text-xl">📄</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium truncate" title={job.name || job.instruction}>{job.name || job.instruction || "Untitled"}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${job.status === "COMPLETED" ? "bg-green-100 text-green-800" : job.status === "FAILED" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                                      {job.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                    <span>
                                      Uploaded by: {job.user?.name || ((job.user?.email || "").split("@")[0]) || "Unknown"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  className="p-1 hover:bg-red-100 rounded"
                                  onClick={(e) => { e.stopPropagation(); deleteDraft.mutate(job.id); }}
                                  title="Delete"
                                  disabled={deleteDraft.isPending}
                                >
                                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))
                        )
                      )
                    : (
                        files.map((file: AutoDraftItem) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-3 ml-8 border-l hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <span className="text-xl">📄</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium truncate">
                                    {file.file}
                                  </span>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${file.user_role === "Owner" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}
                                  >
                                    {getDisplayRole(file.user_role)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                  <span>{(file.user_email || "").split("@")[0]}</span>
                                  <span>{formatDate(file.created_at)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                className="p-1 hover:bg-red-100 rounded"
                                onClick={() => removeDraft(file.id)}
                                title="Delete"
                              >
                                <svg
                                  className="w-4 h-4 text-muted-foreground"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
