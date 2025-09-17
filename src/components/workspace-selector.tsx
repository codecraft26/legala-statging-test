"use client";

import React, { useEffect, useState } from "react";
import { Api } from "@/lib/api-client";

type Workspace = {
  id: string;
  name: string;
};

export default function WorkspaceSelector() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await Api.get<Workspace[]>("/workspace", "no-store");
        if (Array.isArray(data)) setWorkspaces(data);
        const saved =
          typeof window !== "undefined"
            ? localStorage.getItem("workspaceId")
            : null;
        if (saved) setSelected(saved);
        else if (!selected && Array.isArray(data) && data.length)
          setSelected(data[0].id);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load workspaces");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="w-48 flex items-center">
      <label className="sr-only">Workspace</label>
      <select
        className="h-9 w-full rounded-md border bg-background px-3 text-sm align-middle"
        value={selected ?? ""}
        onChange={(e) => {
          setSelected(e.target.value);
          try {
            if (typeof window !== "undefined")
              localStorage.setItem("workspaceId", e.target.value);
          } catch {}
        }}
        disabled={loading || !!error}
      >
        {loading ? <option>Loading...</option> : null}
        {error ? <option>Workspaces unavailable</option> : null}
        {!loading && !error
          ? workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))
          : null}
      </select>
    </div>
  );
}
