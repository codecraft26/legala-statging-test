"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { Api } from "@/lib/api-client";
import {
  setWorkspaces,
  setCurrentWorkspace,
  addWorkspace,
  Workspace,
} from "@/store/slices/authSlice";
import { getCookie, setCookie } from "@/lib/utils";
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
  const dispatch = useDispatch();
  const { workspaces, currentWorkspace } = useSelector(
    (s: RootState) => s.auth
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await Api.get<any>("/workspace", "no-store");
        const workspaceList: Workspace[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : [];

        dispatch(setWorkspaces(workspaceList));

        // Set current workspace from cookie or first available
        const savedId = typeof window !== "undefined" ? getCookie("workspaceId") : null;

        if (savedId && workspaceList.length) {
          const savedWorkspace = workspaceList.find((w) => w.id === savedId);
          if (savedWorkspace) {
            dispatch(setCurrentWorkspace(savedWorkspace));
          } else if (workspaceList.length > 0) {
            dispatch(setCurrentWorkspace(workspaceList[0]));
            setCookie("workspaceId", workspaceList[0].id, 30, { sameSite: "lax", secure: true });
          }
        } else if (workspaceList.length > 0) {
          dispatch(setCurrentWorkspace(workspaceList[0]));
          setCookie("workspaceId", workspaceList[0].id, 30, { sameSite: "lax", secure: true });
        }
      } catch (err: any) {
        setError(err?.message ?? "Failed to load workspaces");
      } finally {
        setLoading(false);
      }
    })();
  }, [dispatch]);

  const handleWorkspaceChange = (workspaceId: string) => {
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (workspace) {
      dispatch(setCurrentWorkspace(workspace));
      try {
        if (typeof window !== "undefined") {
          setCookie("workspaceId", workspaceId, 30, { sameSite: "lax", secure: true });
        }
      } catch {}

      // Force a soft refresh so pages pick up the new workspace and re-fetch
      try {
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      } catch {}
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    
    setIsCreating(true);
    try {
      const newWorkspace = await Api.post<Workspace>("/workspace", {
        name: newWorkspaceName.trim(),
      });
      
      // Update workspaces list
      dispatch(addWorkspace(newWorkspace));
      
      // Set as current workspace
      dispatch(setCurrentWorkspace(newWorkspace));
      setCookie("workspaceId", newWorkspace.id, 30, { sameSite: "lax", secure: true });
      
      // Reset form
      setNewWorkspaceName("");
      setIsDialogOpen(false);
      
      // Refresh to pick up new workspace
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (err: any) {
      console.error("Failed to create workspace:", err);
      // You might want to show an error toast here
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
