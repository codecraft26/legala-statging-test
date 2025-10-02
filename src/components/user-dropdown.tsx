"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUserRole } from "@/hooks/use-user-role";
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
  const { currentRole, mounted } = useUserRole(user);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const getUserDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split("@")[0];

    if (mounted && typeof window !== "undefined") {
      const lsUser = JSON.parse(localStorage.getItem("user") || "{}");
      return lsUser.name || lsUser.email?.split("@")[0] || "User";
    }

    return "User";
  };

  const getUserEmail = () => {
    if (user?.email) return user.email;

    if (mounted && typeof window !== "undefined") {
      const lsUser = JSON.parse(localStorage.getItem("user") || "{}");
      return lsUser.email;
    }

    return null;
  };

  const initials = (user?.email || "U").charAt(0).toUpperCase();
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
            {email && (
              <p className="text-xs text-muted-foreground truncate">{email}</p>
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
