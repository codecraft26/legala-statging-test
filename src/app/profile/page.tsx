"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { Api } from "@/lib/api-client";
import { setUser } from "@/store/slices/authSlice";

export default function ProfilePage() {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      window.location.href = "/login";
      return;
    }
    // Fetch latest user detail if missing or to refresh workspaces
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const detail: any = await Api.get("/user/detail");
        const userData = (detail && (detail.data ?? detail)) as any;
        if (userData) dispatch(setUser(userData));
      } catch (e: any) {
        setError(e?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [dispatch]);

  if (!user || loading) {
    return (
      <main className="max-w-3xl mx-auto p-8">
        <h1 className="text-2xl font-semibold mb-4">Profile</h1>
        <p className="text-muted-foreground">Loading user details...</p>
      </main>
    );
  }

  const workspaces: Array<{ id: string; name: string; createdAt?: string }> =
    Array.isArray((user as any)?.workspace)
      ? ((user as any)?.workspace as any[])
      : [];

  return (
    <main className="max-w-3xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>
      {error ? (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <div className="rounded-lg border p-6 space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Name</p>
          <p className="text-base">{(user as any).name ?? "—"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="text-base">{(user as any).email ?? "—"}</p>
        </div>
        {(user as any).role ? (
          <div>
            <p className="text-sm text-muted-foreground">Role</p>
            <p className="text-base">{String((user as any).role)}</p>
          </div>
        ) : null}
      </div>
      <div className="rounded-lg border p-6">
        <h2 className="text-lg font-medium mb-3">Workspaces</h2>
        {workspaces.length === 0 ? (
          <p className="text-sm text-muted-foreground">No workspaces found.</p>
        ) : (
          <ul className="space-y-2">
            {workspaces.map((ws) => (
              <li
                key={ws.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{ws.name}</p>
                  {ws.createdAt ? (
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(ws.createdAt).toLocaleString()}
                    </p>
                  ) : null}
                </div>
                <code className="text-[10px] text-muted-foreground">
                  {ws.id}
                </code>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
