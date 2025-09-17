"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Api } from "@/lib/api-client";

function AcceptInviteContent() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await Api.post("/user/accept-invite", { token, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message ?? "Failed to accept invite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-6 text-2xl font-semibold">Accept Invite</h1>
      {success ? (
        <p className="text-green-600">Invite accepted. You can now log in.</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm" htmlFor="password">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
              required
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-900"
          >
            {loading ? "Submitting..." : "Accept"}
          </button>
        </form>
      )}
    </main>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md p-8">
          <div className="text-sm text-muted-foreground">Loading…</div>
        </main>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
