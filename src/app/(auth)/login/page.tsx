"use client";

import React, { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth, useLogin } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { getCookie, setCookie } from "@/lib/utils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { token, refetch } = useAuth();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    const storedToken = typeof window !== "undefined" ? getCookie("token") : null;
    if (token || storedToken) {
      router.replace("/dashboard");
    }
  }, [token, router]);

  const loginMutation = useLogin();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await loginMutation.mutateAsync({ email, password });
      const token = (res as any)?.token;
      if (typeof window !== "undefined") {
        setCookie("token", token, 7, { sameSite: "lax", secure: true });
      }
      // Trigger auth refetch to populate user in TanStack cache
      try { await refetch(); } catch {}
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-svh flex items-center justify-center p-6">
      <div className="w-full max-w-3xl rounded-lg border p-0 shadow-sm bg-background overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Left: Form */}
          <div className="p-6 md:p-8">
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-sm">Login to your account</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border px-3 py-2"
                  required
                  autoComplete="current-email"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm" htmlFor="password">Password</label>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 pr-10"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-2 my-auto inline-flex h-8 w-8 items-center justify-center rounded hover:bg-zinc-100 text-muted-foreground dark:hover:bg-zinc-900"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1">
                <a href="/forgot-password" className="text-sm underline hover:text-blue-600 dark:hover:text-blue-400">Forgot password?</a>
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-900"
              >
                {loading ? "Signing in..." : "Login"}
              </button>

              <div className="text-muted-foreground text-center text-xs">
                By clicking continue, you agree to our <a className="underline underline-offset-4" href="#">Terms of Service</a> and <a className="underline underline-offset-4" href="#">Privacy Policy</a>.
              </div>
            </form>
          </div>
          {/* Right: Visual */}
          <div className="hidden md:block bg-muted relative min-h-[280px]">
            <img src="/logo.png" alt="Logo" className="absolute inset-0 w-full h-full object-contain p-10 dark:opacity-80" />
          </div>
        </div>
      </div>
    </main>
  );
}
