"use client";

import React, { useState } from "react";
import { Api } from "@/lib/api-client";
import { Eye, EyeOff } from "lucide-react";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/store/slices/authSlice";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await Api.post<{ token: string }>("/user/login", {
        email,
        password,
      });
      const token = res.token;
      if (typeof window !== "undefined") {
        localStorage.setItem("token", token);
      }
      // Fetch user detail
      const user = await Api.get("/user/detail");
      dispatch(setCredentials({ token, user } as any));
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(user));
        }
      } catch {}
      if (typeof window !== "undefined") {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-svh flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border p-8 shadow-sm">
        <div className="flex items-center justify-center">
          <img src="./logo.png" alt="logo" className="w-18 h-18" />
          <h1 className="text-3xl font-semibold">
            Infra<span className="text-yellow-500">Hive</span>
          </h1>
        </div>
        {/* <h1 className="text-2xl font-semibold text-center">Welcome back</h1> */}
        {/* <p className="mt-2 mb-6 text-center text-sm text-muted-foreground">Sign in to your account</p> */}
        <form onSubmit={onSubmit} className="space-y-4">
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
            <label className="block text-sm" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border px-3 py-2 pr-10"
                required
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
          <div className="flex items-center justify-between pt-1">
            {/* <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4" />
            Remember me
          </label> */}
            <a href="#" className="text-sm underline">
              Forgot password?
            </a>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-900"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
