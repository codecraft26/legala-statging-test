"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getCookie } from "@/lib/utils";
import { type CreditDetail } from "@/lib/credit-api";
import { useCreditDetail, useProfileDetail } from "@/hooks/use-profile";
// Pie chart removed per request

export default function ProfilePage() {
  const { user, refetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credit, setCredit] = useState<CreditDetail | null>(null);

  const token = typeof window !== "undefined" ? getCookie("token") : null;
  const profileQuery = useProfileDetail();
  const role = String((profileQuery.data || {})?.role || "").toLowerCase();
  const creditQuery = useCreditDetail(role === "owner" || role === "admin");

  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }
    if (!user) refetch();
  }, [token, user, refetch]);

  useEffect(() => {
    setLoading(profileQuery.isLoading || creditQuery.isLoading);
    setError(profileQuery.error ? (profileQuery.error as any)?.message ?? null : null);
    setCredit(creditQuery.data || null);
  }, [profileQuery.isLoading, creditQuery.isLoading, profileQuery.error, creditQuery.data]);

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

  const initials = String((user as any)?.name || (user as any)?.email || "U")
    .trim()
    .slice(0, 1)
    .toUpperCase();

  return (
    <main className="max-w-4xl mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-200 text-lg font-semibold">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Profile</h1>
            <p className="text-sm text-muted-foreground">Account overview and workspace details</p>
          </div>
        </div>
      </div>
      {error ? (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <section className="rounded-lg border p-6">
        <h2 className="text-lg font-medium mb-4">Account</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-md border p-4">
            <p className="text-xs text-muted-foreground">Name</p>
            <p className="text-sm mt-1">{(user as any).name ?? "—"}</p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm mt-1 break-all">{(user as any).email ?? "—"}</p>
          </div>
          {(user as any).role ? (
            <div className="rounded-md border p-4">
              <p className="text-xs text-muted-foreground">Role</p>
              <div className="mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                {String((user as any).role)}
              </div>
            </div>
          ) : null}
        </div>
      </section>
      {(() => {
        const role = String((user as any)?.role || "").toLowerCase();
        if (role !== "owner" && role !== "admin") return null;
        const extraction = (credit as any)?.extractionCredit || (credit as any)?.extraction;
        const research = (credit as any)?.researchCredit || (credit as any)?.research;
        return (
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-lg font-medium">Credits</h2>
            <div className="flex flex-col gap-6">
              <div className="rounded-md border p-4">
                <h3 className="text-sm font-semibold mb-2">Extraction</h3>
                {extraction ? (
                  <div className="text-sm space-y-1">
                    <div className="grid grid-cols-2 gap-2">
                      <p>Credit: {extraction.credit ?? "—"}</p>
                      <p>Default: {extraction.defaultCredit ?? "—"}</p>
                      <p>Renew: {extraction.renew ?? "—"}</p>
                      <p>Remaining: {extraction.credit && extraction.usage?.totalUsage ? 
                        (extraction.credit - Number(extraction.usage.totalUsage)) : "—"}</p>
                    </div>
                    {extraction.usage?.totalUsage ? (
                      <p className="text-xs text-muted-foreground">Total usage: {extraction.usage.totalUsage}</p>
                    ) : null}
                    {Array.isArray(extraction.usage?.users) && extraction.usage.users.length ? (
                      <div className="mt-3">
                        <p className="font-medium text-xs mb-2">Member usage</p>
                        <div className="overflow-x-auto rounded border">
                          <table className="w-full text-xs">
                            <thead className="bg-zinc-50 dark:bg-zinc-900/40">
                              <tr>
                                <th className="px-3 py-2 text-left">Name</th>
                                <th className="px-3 py-2 text-left">Email</th>
                                <th className="px-3 py-2 text-left">Role</th>
                                <th className="px-3 py-2 text-left">Usage</th>
                                <th className="px-3 py-2 text-left">Types</th>
                              </tr>
                            </thead>
                            <tbody>
                              {extraction.usage.users.map((u: any) => (
                                <tr key={u.userId} className="border-t">
                                  <td className="px-3 py-2">{u.name || "—"}</td>
                                  <td className="px-3 py-2">{u.email || "—"}</td>
                                  <td className="px-3 py-2">{u.role || "—"}</td>
                                  <td className="px-3 py-2">{u.usage ?? 0}</td>
                                  <td className="px-3 py-2">
                                    {Array.isArray(u.types) && u.types.length ? (
                                      <div className="flex flex-wrap gap-1">
                                        {u.types.map((t: any, idx: number) => (
                                          <span key={idx} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
                                            <span className="text-[10px] text-muted-foreground">{t?.name || "—"}</span>
                                            <span className="text-[10px]">{t?.usage ?? 0}</span>
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No extraction credit data.</p>
                )}
              </div>
              <div className="rounded-md border p-4">
                <h3 className="text-sm font-semibold mb-2">Research</h3>
                {research ? (
                  <div className="text-sm space-y-1">
                    <div className="grid grid-cols-2 gap-2">
                      <p>Credit: {research.credit ?? "—"}</p>
                      <p>Default: {research.defaultCredit ?? "—"}</p>
                      <p>Renew: {research.renew ?? "—"}</p>
                      <p>Remaining: {research.credit && research.usage?.totalUsage ? 
                        (research.credit - Number(research.usage.totalUsage)) : "—"}</p>
                    </div>
                    {research.usage?.totalUsage ? (
                      <p className="text-xs text-muted-foreground">Total usage: {research.usage.totalUsage}</p>
                    ) : null}
                    {Array.isArray(research.usage?.users) && research.usage.users.length ? (
                      <div className="mt-3">
                        <p className="font-medium text-xs mb-2">Member usage</p>
                        <div className="overflow-x-auto rounded border">
                          <table className="w-full text-xs">
                            <thead className="bg-zinc-50 dark:bg-zinc-900/40">
                              <tr>
                                <th className="px-3 py-2 text-left">Name</th>
                                <th className="px-3 py-2 text-left">Email</th>
                                <th className="px-3 py-2 text-left">Role</th>
                                <th className="px-3 py-2 text-left">Usage</th>
                              </tr>
                            </thead>
                            <tbody>
                              {research.usage.users.map((u: any) => (
                                <tr key={u.userId} className="border-t">
                                  <td className="px-3 py-2">{u.name || "—"}</td>
                                  <td className="px-3 py-2">{u.email || "—"}</td>
                                  <td className="px-3 py-2">{u.role || "—"}</td>
                                  <td className="px-3 py-2">{u.usage ?? 0}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No research credit data.</p>
                )}
              </div>
            </div>
          </div>
        );
      })()}
      <section className="rounded-lg border p-6">
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
                {/* Removed workspace id display */}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
