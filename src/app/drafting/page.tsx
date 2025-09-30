"use client";

import React from "react";
import { getCookie as getCookieUtil } from "@/lib/utils";
import TiptapEditor from "./components/tiptap-editor/TiptapEditor";
import { Button } from "@/components/ui/button";

export default function DraftingPage() {
  const [workspaceId, setWorkspaceId] = React.useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = React.useState<string>("");
  React.useEffect(() => {
    const id = typeof window !== "undefined" ? getCookieUtil("workspaceId") : null;
    setWorkspaceId(id);
    setWorkspaceName("");
  }, []);
  const currentWorkspace = workspaceId ? ({ id: workspaceId, name: workspaceName || "" } as any) : null;

  return (
    <main className="h-screen flex flex-col overflow-hidden bg-background text-foreground">
      <div className="flex-shrink-0 p-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">AutoDraft Pro</h1>
            <p className="text-sm text-muted-foreground">
              Workspace:{" "}
              <span className="font-medium">{currentWorkspace?.name || ""}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">Import</Button>
            <Button>Save</Button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <TiptapEditor />
      </div>
    </main>
  );
}
