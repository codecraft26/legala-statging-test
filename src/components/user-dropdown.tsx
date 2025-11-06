"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUserRole } from "@/hooks/use-user-role";
import { getCookie } from "@/lib/utils";
import { Api } from "@/lib/api-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// RoleBadge component inline to avoid import issues
function RoleBadge({ role }: { role?: string }) {
  if (!role) return null;

  const getRoleStyles = (role: string) => {
    switch (role) {
      case "Owner":
        return "text-amber-700 bg-amber-50 border-amber-200";
      case "Admin":
        return "text-blue-700 bg-blue-50 border-blue-200";
      case "Member":
        return "text-green-700 bg-green-50 border-green-200";
      default:
        return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  return (
    <span
      className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getRoleStyles(role)}`}
    >
      {role}
    </span>
  );
}

interface UserDropdownProps {
  collapsed: boolean;
}

export function UserDropdown({ collapsed }: UserDropdownProps) {
  const { signOut, user } = useAuth();
  const router = useRouter();
  const { currentRole } = useUserRole(user);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const safeGetLsUser = () => {
    try {
      if (typeof window === "undefined") return {} as any;
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {} as any;
    }
  };

  const getTokenPayload = () => {
    try {
      const token = getCookie("token");
      if (!token) return null;
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(json);
    } catch {
      return null;
    }
  };

  const getUserDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split("@")[0];

    const lsUser = safeGetLsUser();
    if (lsUser?.name) return lsUser.name;
    if (lsUser?.email) return String(lsUser.email).split("@")[0];

    const payload = getTokenPayload();
    if (payload?.name) return String(payload.name);
    if (payload?.email) return String(payload.email).split("@")[0];

    return "User";
  };

  const getUserEmail = () => {
    if (user?.email) return user.email;

    const lsUser = safeGetLsUser();
    if (lsUser?.email) return String(lsUser.email);

    const payload = getTokenPayload();
    if (payload?.email) return String(payload.email);

    return null;
  };

  const [resolvedEmail, setResolvedEmail] = useState<string | null>(getUserEmail());

  useEffect(() => {
    // Update from auth changes
    if (user?.email && user.email !== resolvedEmail) {
      setResolvedEmail(user.email);
      try {
        const lsUser = safeGetLsUser();
        localStorage.setItem(
          "user",
          JSON.stringify({ ...lsUser, email: user.email, name: user.name ?? lsUser.name })
        );
      } catch {}
      return;
    }

    // If we still don't have an email, fetch it once
    if (!resolvedEmail) {
      (async () => {
        try {
          const detail: any = await Api.get("/user/detail");
          const data = (detail && (detail as any).data) || detail || {};
          const email = data?.email ? String(data.email) : null;
          if (email) {
            setResolvedEmail(email);
            try {
              localStorage.setItem("user", JSON.stringify(data));
            } catch {}
          }
        } catch {}
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const initials = (() => {
    if (user?.email) return user.email.charAt(0).toUpperCase();
    const lsUser = safeGetLsUser();
    if (lsUser?.email) return String(lsUser.email).charAt(0).toUpperCase();
    const payload = getTokenPayload();
    if (payload?.email) return String(payload.email).charAt(0).toUpperCase();
    if (payload?.name) return String(payload.name).charAt(0).toUpperCase();
    return "U";
  })();
  const displayName = getUserDisplayName();
  const email = getUserEmail();

  const handleSignOut = () => {
    setUserDropdownOpen(false);
    signOut();
    router.push("/login");
  };

  if (collapsed) {
    return (
      <div className="relative">
        <button
          className="w-full flex justify-center p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          onClick={() => setUserDropdownOpen(!userDropdownOpen)}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-600 text-white text-sm">
            {initials}
          </div>
        </button>

        {userDropdownOpen && (
          <div className="absolute bottom-0 left-full ml-2 w-56 rounded-md border bg-background p-1 shadow-md z-50">
            <DropdownMenuItem asChild>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-accent"
                onClick={() => setUserDropdownOpen(false)}
              >
                <UserIcon size={14} /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/settings"
                className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-accent"
                onClick={() => setUserDropdownOpen(false)}
              >
                <Settings size={14} /> Workspace
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              onClick={handleSignOut}
            >
              <LogOut size={14} /> Sign out
            </DropdownMenuItem>
          </div>
        )}
      </div>
    );
  }

  return (
    <DropdownMenu open={userDropdownOpen} onOpenChange={setUserDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-600 text-white text-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <RoleBadge role={currentRole} />
            </div>
            {(resolvedEmail || email) && (
              <p className="text-xs text-muted-foreground truncate">{resolvedEmail || email}</p>
            )}
          </div>
          <ChevronDown
            size={14}
            className={`text-muted-foreground transition ${userDropdownOpen ? "rotate-180" : ""}`}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 rounded-md border bg-background p-1 shadow-md">
        <DropdownMenuItem asChild>
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-accent"
            onClick={() => setUserDropdownOpen(false)}
          >
            <UserIcon size={14} /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/workspaces"
            className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-accent"
            onClick={() => setUserDropdownOpen(false)}
          >
            <Settings size={14} /> Workspace
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
          onClick={handleSignOut}
        >
          <LogOut size={14} /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
