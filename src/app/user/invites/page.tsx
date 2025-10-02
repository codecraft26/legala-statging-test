"use client";

import React, { useEffect, useState } from "react";
import { Api } from "@/lib/api-client";
import { getCookie } from "@/lib/utils";

interface Invite {
  id: string;
  email: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  token?: string; // backend may return invite token separately from id
}

interface Member {
  id: string;
  name?: string;
  email?: string;
  role?: string;
}

export default function InvitesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

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

  const fetchMembers = async () => {
    try {
      const res = await Api.get<any>("/user/owner/members", "no-store");
      const list: Member[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];
      setMembers(list);
    } catch (err: any) {
      // don't override invites error; surface below if needed
    }
  };

  useEffect(() => {
    const token = typeof window !== "undefined" ? getCookie("token") : null;
    if (!token) {
      window.location.href = "/login";
      return;
    }
    fetchInvites();
    fetchMembers();
  }, []);

  const normalizedEmail = email.trim().toLowerCase();
  const isExistingMember = normalizedEmail && members.some((m) => (m.email || "").toLowerCase() === normalizedEmail);
  const isPendingInvite = normalizedEmail && invites.some((i) => (i.email || "").toLowerCase() === normalizedEmail && String(i.status || "").toUpperCase() !== "ACCEPTED");

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      if (!normalizedEmail) throw new Error("Email required");
      if (isExistingMember) throw new Error("User is already a member of this workspace");
      if (isPendingInvite) throw new Error("An invite has already been sent to this email");
      await Api.post("/user/invite", { email });
      setEmail("");
      fetchInvites();
    } catch (err: any) {
      setError(err?.message ?? "Failed to send invite");
    } finally {
      setSending(false);
    }
  };

  const resendInvite = async (tokenOrId: string) => {
    setResendingId(tokenOrId);
    setError(null);
    try {
      await Api.post(`/user/resend-invite?token=${encodeURIComponent(tokenOrId)}`);
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
      <form onSubmit={sendInvite} className="flex flex-col gap-2">
        <div className="flex gap-3">
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
            disabled={
              sending || Boolean(isExistingMember) || Boolean(isPendingInvite)
            }
            className="rounded-md border px-4 py-2 text-sm hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-900"
            title={
              isExistingMember
                ? "User is already a member"
                : isPendingInvite
                  ? "Invite already sent to this email"
                  : "Send invite"
            }
          >
            {sending ? "Sending..." : "Send invite"}
          </button>
        </div>
        {isExistingMember ? (
          <p className="text-xs text-amber-600">This user is already a member of your workspace.</p>
        ) : isPendingInvite ? (
          <p className="text-xs text-amber-600">An invite has already been sent to this email.</p>
        ) : null}
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
              </tr>
            </thead>
            <tbody>
              {invites.map((i) => (
                <tr key={i.id} className="border-t">
                  <td className="px-4 py-3">{i.email}</td>
                  <td className="px-4 py-3">{i.status ?? "pending"}</td>
                  
                </tr>
              ))}
              {invites.length === 0 ? (
                <tr>
                  <td className="px-4 py-6" colSpan={2}>
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
