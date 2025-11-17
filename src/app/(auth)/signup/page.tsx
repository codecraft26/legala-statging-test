"use client";

import React, { useState } from "react";
import { useSignup } from "@/hooks/use-auth";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [invite, setInvite] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const signupMutation = useSignup();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signupMutation.mutateAsync({ name, email, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message ?? "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-svh flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-semibold text-center">
          Create account
        </h1>
        {success ? (
          <div className="space-y-3 text-center">
            <p className="text-green-600">
              Account created. You can now log in.
            </p>
            <a href="/login" className="underline">
              Go to login
            </a>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
                required
                minLength={3}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character
              </p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm" htmlFor="invite">
                Invite Code (optional)
              </label>
              <input
                id="invite"
                type="number"
                value={invite}
                onChange={(e) => setInvite(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-900"
            >
              {loading ? "Creating..." : "Create account"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
