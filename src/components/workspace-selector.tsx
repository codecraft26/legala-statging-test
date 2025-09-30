"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Api } from "@/lib/api-client";
import { getCookie, setCookie } from "@/lib/utils";
type Workspace = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDownIcon, PlusIcon, Building2Icon, CheckIcon } from "lucide-react";

export default function WorkspaceSelector() {
  const queryClient = useQueryClient();
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const workspacesQuery = useQuery<Workspace[]>({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const res = await Api.get<any>("/workspace", "no-store");
      const list: Workspace[] = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      return list;
    },
  });

  const workspaces = useMemo(() => workspacesQuery.data || [], [workspacesQuery.data]);

  useEffect(() => {
    setLoading(workspacesQuery.isLoading || workspacesQuery.isFetching);
    setError(workspacesQuery.error ? (workspacesQuery.error as any)?.message ?? "Failed to load workspaces" : null);
  }, [workspacesQuery.isLoading, workspacesQuery.isFetching, workspacesQuery.error]);

  useEffect(() => {
    if (!workspaces || workspaces.length === 0) return;
    const savedId = typeof window !== "undefined" ? getCookie("workspaceId") : null;
    if (savedId) {
      const saved = workspaces.find((w) => w.id === savedId);
      if (saved) {
        setCurrentWorkspaceState(saved);
        return;
      }
    }
    // default to first
    setCurrentWorkspaceState(workspaces[0]);
    setCookie("workspaceId", workspaces[0].id, 30, { sameSite: "lax", secure: true });
  }, [workspaces]);

  const handleWorkspaceChange = (workspaceId: string) => {
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (!workspace) return;
    setCurrentWorkspaceState(workspace);
    try {
      if (typeof window !== "undefined") {
        setCookie("workspaceId", workspaceId, 30, { sameSite: "lax", secure: true });
      }
    } catch {}
    // consumers should rely on cookie + queries; minimal reload for now
    try {
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch {}
  };

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      return await Api.post<Workspace>("/workspace", { name });
    },
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setCurrentWorkspaceState(created as any);
      setCookie("workspaceId", (created as any).id, 30, { sameSite: "lax", secure: true });
      setNewWorkspaceName("");
      setIsDialogOpen(false);
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    },
  });

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    setIsCreating(true);
    try {
      await createMutation.mutateAsync(newWorkspaceName.trim());
    } catch (err) {
      // noop
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="w-48 flex items-center">
        <div className="h-9 w-full rounded-md border bg-white px-3 py-2 text-sm animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-48 flex items-center">
        <div className="h-9 w-full rounded-md border bg-white px-3 py-2 text-sm text-red-600">
          Workspaces unavailable
        </div>
      </div>
    );
  }

  return (
    <div className="w-48 flex items-center">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between bg-white hover:bg-gray-50 border-gray-200"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Building2Icon className="h-4 w-4 text-gray-500 shrink-0" />
                <span className="truncate text-left">
                  {currentWorkspace?.name || "Select workspace"}
                </span>
              </div>
              <ChevronDownIcon className="h-4 w-4 shrink-0 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 bg-white border-gray-200 shadow-lg">
            {workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => handleWorkspaceChange(workspace.id)}
                className="flex items-center justify-between cursor-pointer hover:bg-gray-50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2Icon className="h-4 w-4 text-gray-500 shrink-0" />
                  <span className="truncate">{workspace.name}</span>
                </div>
                {currentWorkspace?.id === workspace.id && (
                  <CheckIcon className="h-4 w-4 text-blue-600" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-gray-100" />
            <DialogTrigger asChild>
              <DropdownMenuItem className="cursor-pointer hover:bg-gray-50">
                <PlusIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span>Create new workspace</span>
              </DropdownMenuItem>
            </DialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>

        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Create New Workspace</DialogTitle>
            <DialogDescription className="text-gray-600">
              Create a new workspace to organize your projects and collaborate with your team.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="workspace-name" className="text-sm font-medium">
                Workspace Name
              </Label>
              <Input
                id="workspace-name"
                placeholder="Enter workspace name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isCreating) {
                    handleCreateWorkspace();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setNewWorkspaceName("");
              }}
              className="bg-white hover:bg-gray-50 border-gray-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateWorkspace}
              disabled={!newWorkspaceName.trim() || isCreating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isCreating ? "Creating..." : "Create Workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
