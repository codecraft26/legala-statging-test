"use client";

import React, { useEffect, useState } from "react";
import { Api } from "@/lib/api-client";

interface Invite {
  id: string;
  email: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function InvitesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const fetchInvites = async () => {
    try {
      const res = await Api.get<any>("/user/owner/invites", "no-store");
      const list: Invite[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];
      setInvites(list);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load invites");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      window.location.href = "/login";
      return;
    }
    fetchInvites();
  }, []);

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      await Api.post("/user/invite", { email });
      setEmail("");
      fetchInvites();
    } catch (err: any) {
      setError(err?.message ?? "Failed to send invite");
    } finally {
      setSending(false);
    }
  };

  const resendInvite = async (token: string) => {
    setResendingId(token);
    setError(null);
    try {
      await Api.post(`/user/resend-invite?token=${encodeURIComponent(token)}`);
      await fetchInvites();
    } catch (err: any) {
      setError(err?.message ?? "Failed to resend invite");
    } finally {
      setResendingId(null);
    }
  };

  return (
    <main className="max-w-5xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Invitations</h1>
      <form onSubmit={sendInvite} className="flex gap-3">
        <input
          type="email"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="min-w-64 rounded-md border px-3 py-2"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-md border px-4 py-2 text-sm hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-900"
        >
          {sending ? "Sending..." : "Send invite"}
        </button>
      </form>
      {loading ? <p className="text-muted-foreground">Loading...</p> : null}
      {error ? <p className="text-red-600 text-sm">{error}</p> : null}
      {!loading && !error ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/40">
              <tr>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((i) => (
                <tr key={i.id} className="border-t">
                  <td className="px-4 py-3">{i.email}</td>
                  <td className="px-4 py-3">{i.status ?? "pending"}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="rounded-md border px-3 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-50"
                      onClick={() => resendInvite(i.id)}
                      disabled={
                        resendingId === i.id ||
                        String(i.status || "").toUpperCase() === "ACCEPTED"
                      }
                      title={
                        String(i.status || "").toUpperCase() === "ACCEPTED"
                          ? "Already accepted"
                          : "Resend invitation"
                      }
                    >
                      {String(i.status || "").toUpperCase() === "ACCEPTED"
                        ? "Accepted"
                        : resendingId === i.id
                          ? "Resending..."
                          : "Resend"}
                    </button>
                  </td>
                </tr>
              ))}
              {invites.length === 0 ? (
                <tr>
                  <td className="px-4 py-6" colSpan={3}>
                    <p className="text-muted-foreground">No invites yet.</p>
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
