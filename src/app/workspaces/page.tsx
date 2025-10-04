"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Api } from "@/lib/api-client";
import { getCookie } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useUserRole } from "@/hooks/use-user-role";
import {
  RefreshCw,
  Folder,
  Plus,
  Star,
  Trash2,
  Search,
  Settings,
} from "lucide-react";

type Workspace = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  is_default?: boolean;
  description?: string;
};

export default function WorkspacesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isOwner, mounted } = useUserRole(user);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await Api.get<any>("/workspace", "no-store");
      const list: Workspace[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];
      setWorkspaces(list);
    } catch (e: any) {
      setError(e?.message || "Failed to load workspaces");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = typeof window !== "undefined" ? getCookie("token") : null;
    if (!token) {
      window.location.href = "/login";
      return;
    }
    fetchWorkspaces();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return workspaces;
    return workspaces.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (w.description || "").toLowerCase().includes(q)
    );
  }, [workspaces, search]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await Api.post("/workspace", { name: newName.trim() });
      setNewName("");
      await fetchWorkspaces();
    } catch (e: any) {
      setError(e?.message || "Failed to create workspace");
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async (id: string) => {
    const target = workspaces.find((w) => w.id === id);
    if (
      !window.confirm(
        `Delete workspace "${target?.name || ""}"? This cannot be undone.`
      )
    )
      return;
    setDeletingId(id);
    setError(null);
    try {
      await Api.delete(`/workspace?id=${encodeURIComponent(id)}`);
      setWorkspaces((prev) => prev.filter((w) => w.id !== id));
    } catch (e: any) {
      setError(e?.message || "Failed to delete workspace");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto p-8">
        <div className="flex flex-col items-center text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin mb-2" />
          <p>Loading workspaces…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-3xl mx-auto p-8">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
        <button
          type="button"
          onClick={fetchWorkspaces}
          className="mt-4 rounded-md border px-3 py-2 text-sm hover:bg-accent"
        >
          Retry
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Folder className="h-5 w-5" /> Workspaces
        </h1>
        <button
          type="button"
          onClick={fetchWorkspaces}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border p-4">
        {mounted && isOwner && (
          <form onSubmit={onCreate} className="flex items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New workspace name"
              className="min-w-64 flex-1 rounded-md border px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={!newName.trim() || creating}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> {creating ? "Creating…" : "Create"}
            </button>
          </form>
        )}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workspaces…"
            className="w-full rounded-md border px-8 py-2 text-sm"
          />
        </div>
      </div>

      <div className="rounded-lg border">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No workspaces found.
          </div>
        ) : (
          <ul className="divide-y">
            {filtered.map((w) => (
              <li key={w.id} className="flex items-center justify-between p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{w.name}</p>
                    {w.is_default ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-[10px] font-medium text-yellow-700 border border-yellow-200">
                        <Star className="h-3 w-3" /> Default
                      </span>
                    ) : null}
                  </div>
                  {w.createdAt ? (
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(w.createdAt).toLocaleString()}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {mounted && isOwner && (
                    <>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs hover:bg-accent"
                        onClick={() => router.push(`/workspaces/${w.id}/settings`)}
                      >
                        <Settings className="h-3 w-3" />
                        Settings
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-50"
                        onClick={() => onDelete(w.id)}
                        disabled={deletingId === w.id}
                      >
                        <Trash2 className="h-3 w-3" />
                        {deletingId === w.id ? "Deleting…" : "Delete"}
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
