"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Api } from "@/lib/api-client";

interface Member {
  id: string;
  name?: string;
  email?: string;
  role?: string;
}

export default function MembersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const user = useSelector((s: RootState) => s.auth.user);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      window.location.href = "/login";
      return;
    }
    (async () => {
      try {
        const res = await Api.get<any>("/user/owner/members", "no-store");
        const list: Member[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : [];
        setMembers(list);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load members");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const removeMember = async (memberId: string) => {
    const confirmed = window.confirm(
      "Remove this user? This action cannot be undone."
    );
    if (!confirmed) return;
    setRemovingId(memberId);
    try {
      await Api.delete(`/user/remove?userId=${encodeURIComponent(memberId)}`);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err: any) {
      setError(err?.message ?? "Failed to remove user");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <main className="max-w-5xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Team Members</h1>
      {loading ? <p className="text-muted-foreground">Loading...</p> : null}
      {error ? <p className="text-red-600 text-sm">{error}</p> : null}
      {!loading && !error ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/40">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                {user?.role === "Owner" ? (
                  <th className="px-4 py-3 text-left">Actions</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-4 py-3">{m.name ?? "—"}</td>
                  <td className="px-4 py-3">{m.email ?? "—"}</td>
                  <td className="px-4 py-3">{m.role ?? "member"}</td>
                  {user?.role === "Owner" ? (
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="rounded-md border px-3 py-1 text-xs hover:bg-red-50 text-red-600 dark:hover:bg-red-950/20 disabled:opacity-50"
                        onClick={() => removeMember(m.id)}
                        disabled={removingId === m.id}
                      >
                        {removingId === m.id ? "Removing..." : "Remove"}
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
              {members.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-6"
                    colSpan={user?.role === "Owner" ? 4 : 3}
                  >
                    <p className="text-muted-foreground">No members found.</p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </main>
  );
}
