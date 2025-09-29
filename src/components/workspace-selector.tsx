"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { Api } from "@/lib/api-client";
import {
  setWorkspaces,
  setCurrentWorkspace,
  Workspace,
} from "@/store/slices/authSlice";
import { getCookie, setCookie } from "@/lib/utils";

export default function WorkspaceSelector() {
  const dispatch = useDispatch();
  const { workspaces, currentWorkspace } = useSelector(
    (s: RootState) => s.auth
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="w-48 flex items-center">
      <label className="sr-only">Workspace</label>
      <select
        className="h-9 w-full rounded-md border bg-background px-3 text-sm align-middle"
        value={currentWorkspace?.id ?? ""}
        onChange={(e) => handleWorkspaceChange(e.target.value)}
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
