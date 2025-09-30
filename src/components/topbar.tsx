"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { logout, setCredentials } from "@/store/slices/authSlice";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  ChevronDown,
  LogOut,
  Settings,
  User as UserIcon,
  Bell,
} from "lucide-react";
import WorkspaceSelector from "@/components/workspace-selector";
import { Api } from "@/lib/api-client";
import { deleteCookie, getCookie } from "@/lib/utils";

function RoleBadge({ role }: { role?: string }) {
  if (!role) return null;
  let cls = "text-gray-700 bg-gray-50 border-gray-200";
  if (role === "Owner") cls = "text-amber-700 bg-amber-50 border-amber-200";
  else if (role === "Admin") cls = "text-blue-700 bg-blue-50 border-blue-200";
  else if (role === "Member")
    cls = "text-green-700 bg-green-50 border-green-200";
  return (
    <span
      className={`px-2 py-0.5 text-xs font-medium rounded-full border ${cls}`}
    >
      {role}
    </span>
  );
}

export default function Topbar() {
  const { user, token } = useSelector((s: RootState) => s.auth);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const router = useRouter();

  const initials = (user?.email || "U").charAt(0).toUpperCase();
  const isAuthed = Boolean(
    user || token || (typeof window !== "undefined" && getCookie("token"))
  );

  // Ensure user is loaded when token exists (after refresh)
  useEffect(() => {
    setMounted(true);
    const lsToken = typeof window !== "undefined" ? getCookie("token") : null;
    if (!user && lsToken) {
      (async () => {
        try {
          const detailResponse = await Api.get<any>("/user/detail");
          const detail = (detailResponse as any).data || detailResponse;
          // Normalize role before storing
          const normalizedDetail = {
            ...detail,
            role:
              detail.role?.toLowerCase() === "owner"
                ? "Owner"
                : detail.role?.toLowerCase() === "admin"
                  ? "Admin"
                  : detail.role?.toLowerCase() === "member"
                    ? "Member"
                    : detail.role || "Member",
          };
          dispatch(
            setCredentials({ token: lsToken, user: normalizedDetail } as any)
          );
          try {
            // keep only in redux/state; avoid duplicating in localStorage
          } catch {}
        } catch (_) {
          // ignore; fall back to login button
        }
      })();
    }
  }, [user, dispatch]);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-zinc-900/60">
      <div className="mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="logo" className="h-6 w-6" />
            <span className="hidden sm:block text-sm font-semibold text-foreground">
              InfraHive
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <WorkspaceSelector />
          </div>
          {user?.role === "Owner" ? (
            <button
              type="button"
              title="Workspace Settings"
              aria-label="Workspace Settings"
              onClick={() => router.push("/settings")}
              className="rounded-md border p-2 hover:bg-accent"
            >
              <Settings size={16} />
            </button>
          ) : null}
          <button
            className="rounded-md border p-2 hover:bg-accent"
            aria-label="Notifications"
          >
            <Bell size={16} />
          </button>
          <ThemeToggle />
          {mounted && isAuthed ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpen((v) => !v)}
                onBlur={(e) => {
                  // Close dropdown when focus is lost, but allow a small delay for clicks
                  setTimeout(() => {
                    if (
                      dropdownRef.current &&
                      !dropdownRef.current.contains(document.activeElement)
                    ) {
                      setOpen(false);
                    }
                  }, 150);
                }}
                className="flex items-center gap-3 rounded-md px-2 py-1 hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-600 text-white text-sm">
                    {initials}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {user?.name ||
                          (user?.email as string)?.split("@")?.[0] ||
                          (mounted && typeof window !== "undefined"
                            ? JSON.parse(localStorage.getItem("user") || "{}")
                                .name ||
                              JSON.parse(
                                localStorage.getItem("user") || "{}"
                              ).email?.split("@")?.[0]
                            : undefined) ||
                          "User"}
                      </p>
                      <RoleBadge
                        role={
                          user
                            ? String(user.role || "")
                            : mounted && typeof window !== "undefined"
                              ? (() => {
                                  const lsUser = JSON.parse(
                                    localStorage.getItem("user") || "{}"
                                  );
                                  return lsUser.role?.toLowerCase() === "owner"
                                    ? "Owner"
                                    : lsUser.role?.toLowerCase() === "admin"
                                      ? "Admin"
                                      : lsUser.role?.toLowerCase() === "member"
                                        ? "Member"
                                        : lsUser.role || "Member";
                                })()
                              : undefined
                        }
                      />
                    </div>
                    {user?.email ? (
                      <p className="text-xs text-muted-foreground truncate max-w-32">
                        {String(user.email || "")}
                      </p>
                    ) : mounted &&
                      typeof window !== "undefined" &&
                      JSON.parse(localStorage.getItem("user") || "{}").email ? (
                      <p className="text-xs text-muted-foreground truncate max-w-32">
                        {JSON.parse(localStorage.getItem("user") || "{}").email}
                      </p>
                    ) : null}
                  </div>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-muted-foreground transition ${open ? "rotate-180" : ""}`}
                />
              </button>
              {open ? (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-md border bg-background p-1 shadow-md z-40"
                  onMouseDown={(e) => e.preventDefault()} // Prevent blur when clicking inside dropdown
                >
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-accent"
                    onClick={() => setOpen(false)}
                  >
                    <UserIcon size={14} /> Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-accent"
                    onClick={() => setOpen(false)}
                  >
                    <Settings size={14} /> Workspace
                  </Link>
                  <div className="my-1 h-px bg-border" />
                  <button
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    onClick={() => {
                      setOpen(false);
                      if (typeof window !== "undefined") {
                        deleteCookie("token");
                      }
                      dispatch(logout());
                      router.push("/login");
                    }}
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-md border px-3 py-2 text-sm hover:bg-accent"
              >
                Login
              </Link>
            </div>
          )}
        </div>
      </div>
      {open ? (
        <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
      ) : null}
    </header>
  );
}
