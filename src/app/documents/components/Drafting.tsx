"use client";

import React from "react";
import { useDraftingList, useDeleteDrafting, useCreateEmptyDraft } from "@/hooks/use-drafting";
import { useRouter } from "next/navigation";
import { getCookie } from "@/lib/utils";

export default function Drafting() {
  const workspaceId = typeof window !== "undefined" ? getCookie("workspaceId") : null;
  const list = useDraftingList(workspaceId);
  const del = useDeleteDrafting(workspaceId);
  const createEmptyDraft = useCreateEmptyDraft(workspaceId);
  const router = useRouter();
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set(["Drafting Jobs"]));

  const toggle = (name: string) => {
    const next = new Set(expanded);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setExpanded(next);
  };

  const folders: Array<{ name: string; files: any[] }> = [
    { name: "Drafting Jobs", files: list.data || [] },
  ];

  const formatDate = (d?: string) => {
    if (!d) return "—";
    try { return new Date(d).toLocaleString(); } catch { return d; }
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

  return (
    <div className="p-1 select-none">
      <div className="bg-background rounded-lg border">
        <div className="px-4 py-3 border-b bg-accent rounded-t-lg">
          <h2 className="text-base font-semibold">Drafting</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Jobs created from drafting API.
          </p>
        </div>
        {folders.map(({ name, files }) => {
          const isExpanded = expanded.has(name);
          return (
            <div key={name} className="border-b last:border-b-0">
              <div className="flex items-center justify-between p-4 hover:bg-accent">
                <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggle(name)}>
                  <div className={`transition-transform ${isExpanded ? "rotate-90" : "rotate-0"}`}>
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div className="text-2xl">{isExpanded ? "📂" : "📁"}</div>
                  <span className="text-sm font-medium">{name}</span>
                  <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
                    {(files || []).length} {(files || []).length === 1 ? "file" : "files"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateNewDraft();
                    }}
                    disabled={!workspaceId || createEmptyDraft.isPending}
                    className="p-1.5 hover:bg-blue-100 rounded text-blue-600 disabled:text-gray-400 disabled:hover:bg-gray-100 transition-colors"
                    title="Create new draft"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  {list.isFetching ? (
                    <span className="text-xs text-muted-foreground">Refreshing…</span>
                  ) : null}
                </div>
              </div>
              {isExpanded ? (
                <div className="bg-accent">
                  {(files || []).length === 0 ? (
                    <div className="p-3 ml-8 border-l">
                      <div className="text-xs text-muted-foreground mb-2">No drafting jobs</div>
                      <button
                        onClick={handleCreateNewDraft}
                        disabled={!workspaceId || createEmptyDraft.isPending}
                        className="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400 hover:underline"
                      >
                        Create your first draft →
                      </button>
                    </div>
                  ) : (
                    files.map((job: any) => (
                      <div key={job.id} className="flex items-center justify-between p-3 ml-8 border-l hover:bg-background">
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
                              <span>Created: {formatDate(job.createdAt)}</span>
                              <span>Updated: {formatDate(job.updatedAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="p-1 hover:bg-red-100 rounded text-xs"
                            onClick={(e) => { e.stopPropagation(); del.mutate(job.id); }}
                            title="Delete"
                            disabled={del.isPending}
                          >
                            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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


