"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

type Workspace = { id: string; name: string };

export default function WorkspaceSettingsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const workspaceId = params?.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data =
          (await Api.get<Workspace[]>("/workspace", "no-store")) || [];
        const current = (data as Workspace[]).find(
          (w) => String(w.id) === String(workspaceId)
        );
        if (current) setName(current.name || "");
      } catch (e: any) {
        setError(e?.message ?? "Failed to load workspace");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [workspaceId]);

  const save = async () => {
    if (!workspaceId) return;
    setSaving(true);
    setError(null);
    try {
      await Api.patch(`/workspace?id=${workspaceId}`, { name });
    } catch (e: any) {
      setError(e?.message ?? "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!workspaceId) return;
    if (!confirm("Delete this workspace? This cannot be undone.")) return;
    setDeleting(true);
    setError(null);
    try {
      await Api.delete(`/workspace?id=${workspaceId}`);
      try {
        if (typeof window !== "undefined") {
          const saved = localStorage.getItem("workspaceId");
          if (saved === String(workspaceId))
            localStorage.removeItem("workspaceId");
        }
      } catch {}
      router.push("/dashboard");
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete workspace");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Workspace Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage name and dangerous actions.
        </p>
      </div>

      <div className="rounded-lg border p-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm mb-1">
            Name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Workspace name"
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex items-center gap-2">
          <Button onClick={save} disabled={saving || loading}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/user/members")}
          >
            Manage members
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/user/invites")}
          >
            Invites
          </Button>
        </div>
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="text-sm font-semibold mb-2">Danger Zone</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Delete this workspace and all its data.
        </p>
        <Button variant="destructive" onClick={remove} disabled={deleting}>
          {deleting ? "Deleting…" : "Delete workspace"}
        </Button>
      </div>
    </main>
  );
}
