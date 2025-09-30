"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Brain,
  PenTool,
  Newspaper,
  Users,
  Mail,
  Folder,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { getCookie, deleteCookie } from "@/lib/utils";

const NavItem = ({
  href,
  icon,
  label,
  collapsed,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
}) => {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`group flex items-center rounded-xl border px-3 py-2 transition-all ${
        active
          ? "bg-accent/60 border-accent"
          : "border-transparent hover:bg-accent/40 hover:border-accent"
      } ${collapsed ? "justify-center" : "gap-3"}`}
    >
      <span className="text-muted-foreground group-hover:text-foreground">
        {icon}
      </span>
      {!collapsed && <span className="text-sm">{label}</span>}
    </Link>
  );
};

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector((s: RootState) => s.auth.user);
  const [mounted, setMounted] = useState(false);
  const [lsRole, setLsRole] = useState<string | undefined>(undefined);
  const [tokenRole, setTokenRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
    try {
      if (typeof window !== "undefined") {
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        if (u?.role) {
          // Normalize role from localStorage
          const normalizedRole =
            u.role?.toLowerCase() === "owner"
              ? "Owner"
              : u.role?.toLowerCase() === "admin"
                ? "Admin"
                : u.role?.toLowerCase() === "member"
                  ? "Member"
                  : u.role || "Member";
          setLsRole(normalizedRole);
        }
        const token = getCookie("token");
        if (token) {
          const parts = token.split(".");
          if (parts.length === 3) {
            try {
              const payload = JSON.parse(
                atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
              );
              if (payload?.role) setTokenRole(String(payload.role));
            } catch {}
          }
        }
      }
    } catch {}
  }, []);

  // Debug logging
  useEffect(() => {
    // console.log("Sidebar role debug:", {
    //   userRole: user?.role,
    //   lsRole,
    //   tokenRole,
    //   mounted,
    //   finalRole: user?.role || (mounted ? lsRole : undefined) || tokenRole,
    //   isOwner:
    //     (user?.role || (mounted ? lsRole : undefined) || tokenRole) === "Owner",
    // });
  }, [user?.role, lsRole, tokenRole, mounted]);

  return (
    <aside
      className={`sticky top-0 h-svh shrink-0 border-r bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3 transition-[width] ${
        collapsed ? "w-[64px]" : "w-[240px]"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        {!collapsed ? (
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo.png" alt="logo" className="h-7 w-7" />
            <span className="text-sm font-semibold">InfraHive</span>
          </Link>
        ) : (
          <Link href="/dashboard">
            <img src="/logo.png" alt="logo" className="h-7 w-7" />
          </Link>
        )}
        <button
          type="button"
          aria-label="Toggle sidebar"
          onClick={() => setCollapsed((v) => !v)}
          className="rounded-md border p-1 hover:bg-accent"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="space-y-2">
        <NavItem
          collapsed={collapsed}
          href="/dashboard"
          icon={<LayoutDashboard size={16} />}
          label="Dashboard"
        />
        <NavItem
          collapsed={collapsed}
          href="/extract"
          icon={<FileText size={16} />}
          label="Smart Extract"
        />
        <NavItem
          collapsed={collapsed}
          href="/research"
          icon={<Brain size={16} />}
          label="Research"
        />
        <NavItem
          collapsed={collapsed}
          href="/drafting"
          icon={<PenTool size={16} />}
          label="AutoDraft"
        />
        {/* <NavItem
          collapsed={collapsed}
          href="/news"
          icon={<Newspaper size={16} />}
          label="Legal News"
        /> */}
        {(() => {
          const currentRole = user?.role || lsRole || tokenRole;
          return currentRole === "Owner";
        })() ? (
          <>
            <div className="pt-2 text-[11px] uppercase text-muted-foreground/80 pl-1">
              Team
            </div>
            <NavItem
              collapsed={collapsed}
              href="/user/members"
              icon={<Users size={16} />}
              label="Members"
            />
            <NavItem
              collapsed={collapsed}
              href="/user/invites"
              icon={<Mail size={16} />}
              label="Invites"
            />
          </>
        ) : null}
        <div className="pt-2 text-[11px] uppercase text-muted-foreground/80 pl-1">
          Storage
        </div>
        <NavItem
          collapsed={collapsed}
          href="/documents"
          icon={<Folder size={16} />}
          label="Documents"
        />
      </nav>

      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") deleteCookie("token");
            dispatch(logout());
            router.push("/login");
          }}
          className={`mt-2 w-full inline-flex items-center ${
            collapsed ? "justify-center" : "justify-start gap-2"
          } rounded-xl border px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20`}
        >
          <LogOut size={16} /> {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}
