"use client";

import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      window.location.href = "/login";
      return;
    }
    (async () => {
      try {
        const data = await Api.get<Member[]>("/user/owner/members", "no-store");
        setMembers(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load members");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-4 py-3">{m.name ?? "—"}</td>
                  <td className="px-4 py-3">{m.email ?? "—"}</td>
                  <td className="px-4 py-3">{m.role ?? "member"}</td>
                </tr>
              ))}
              {members.length === 0 ? (
                <tr>
                  <td className="px-4 py-6" colSpan={3}>
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
