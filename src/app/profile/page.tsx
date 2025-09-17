"use client";

import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

export default function ProfilePage() {
  const user = useSelector((s: RootState) => s.auth.user);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      window.location.href = "/login";
    }
  }, []);

  if (!user) {
    return (
      <main className="max-w-3xl mx-auto p-8">
        <h1 className="text-2xl font-semibold mb-4">Profile</h1>
        <p className="text-muted-foreground">Loading user details...</p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <div className="rounded-lg border p-6 space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Name</p>
          <p className="text-base">{user.name ?? "—"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="text-base">{user.email ?? "—"}</p>
        </div>
        {user.role ? (
          <div>
            <p className="text-sm text-muted-foreground">Role</p>
            <p className="text-base">{String(user.role)}</p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
