"use client";

import React from "react";
import { Api } from "@/lib/api-client";

type AutoDraftItem = {
  id: string;
  file: string;
  user_role: string;
  user_email: string;
  created_at: string;
};

export default function AutoDraft() {
  const [drafting, setDrafting] = React.useState<AutoDraftItem[]>([]);
  const [template, setTemplate] = React.useState<AutoDraftItem[]>([]);
  const [invalidated, setInvalidated] = React.useState(false);
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(
    new Set()
  );

  const folders: Array<{ name: string; files: AutoDraftItem[] }> = [
    { name: "Drafting", files: drafting },
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
        const [draftingRes, templateRes] = await Promise.all([
          Api.get<{ autoDrafts: AutoDraftItem[] }>(
            `/auto-drafts?folder=drafting`,
            "no-store"
          ),
          Api.get<{ autoDrafts: AutoDraftItem[] }>(
            `/auto-drafts?folder=template`,
            "no-store"
          ),
        ]);
        if (!mounted) return;
        setDrafting(
          draftingRes?.autoDrafts ??
            (draftingRes as any)?.data?.autoDrafts ??
            []
        );
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
      <div className="bg-background rounded-lg border">
        <div className="px-4 py-3 border-b bg-accent rounded-t-lg">
          <h2 className="text-base font-semibold">Auto Draft</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Auto drafts saved documents for template and drafting.
          </p>
        </div>
        {folders.map(({ name, files }) => {
          const isExpanded = expandedFolders.has(name);
          return (
            <div key={name} className="border-b last:border-b-0">
              <div
                className="flex items-center justify-between p-4 hover:bg-accent cursor-pointer"
                onClick={() => toggleFolder(name)}
              >
                <div className="flex items-center gap-3">
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
              </div>
              {isExpanded ? (
                <div className="bg-accent">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 ml-8 border-l hover:bg-background"
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
                              {file.user_role}
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
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
