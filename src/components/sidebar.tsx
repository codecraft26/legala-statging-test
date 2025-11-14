"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  FileText,
  Brain,
  PenTool,
  Users,
  Mail,
  Folder,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Bot,
  Gavel,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUserRole } from "@/hooks/use-user-role";
import { getCookie } from "@/lib/utils";
import dynamic from "next/dynamic";
import WorkspaceSelector from "./workspace-selector";
const UserDropdown = dynamic(() => import("./user-dropdown").then(m => m.UserDropdown), { ssr: false });
import {
  SIDEBAR_WIDTHS,
  NAVIGATION_ITEMS,
  OWNER_ONLY_ITEMS,
} from "./sidebar-constants";

// Icon mapping for navigation items
const iconMap = {
  LayoutDashboard,
  FileText,
  Brain,
  PenTool,
  Users,
  Mail,
  Folder,
  Newspaper,
  Bot,
  Gavel,
} as const;

const NavItem = ({
  href,
  iconName,
  label,
  badge,
  collapsed,
}: {
  href: string;
  iconName: keyof typeof iconMap;
  label: string;
  badge?: string;
  collapsed: boolean;
}) => {
  const pathname = usePathname();
  const active = pathname === href;
  const IconComponent = iconMap[iconName];

  return (
    <Link
      href={href}
      className={`group flex items-center rounded-xl border px-3 py-2 transition-colors ${
        active
          ? "bg-zinc-100 dark:bg-zinc-900/40 border-zinc-300 dark:border-zinc-800"
          : "border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900/40 hover:border-zinc-200 dark:hover:border-zinc-800"
      } ${collapsed ? "justify-center" : "gap-3 min-w-0"}`}
    >
      <span className="text-muted-foreground group-hover:text-foreground">
        <IconComponent size={16} />
      </span>
      {!collapsed && (
        <span className="text-sm flex items-center gap-2">
          {label}
          {badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-600 text-white">{badge}</span>
          )}
        </span>
      )}
    </Link>
  );
};

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const { isOwner } = useUserRole(user);

  const isAuthed = Boolean(
    user || (typeof window !== "undefined" && getCookie("token"))
  );

  return (
    <aside
      className={`sticky top-0 h-svh shrink-0 border-r bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3 transition-[width] shadow-lg ${
        collapsed ? SIDEBAR_WIDTHS.COLLAPSED : SIDEBAR_WIDTHS.EXPANDED
      }`}
    >
      <div className={`mb-4 flex items-center ${collapsed ? "flex-col gap-3" : "justify-between"}`}>
        {!collapsed ? (
          <>
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image src="/logo.png" alt="logo" width={28} height={28} />
              <span className="text-sm font-bold tracking-wide">InfraHive</span>
            </Link>
            <button
              type="button"
              aria-label="Toggle sidebar"
              onClick={() => setCollapsed((v) => !v)}
              className="rounded-md border p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <PanelLeftClose size={16} />
            </button>
          </>
        ) : (
          <>
            <Link href="/dashboard" className="flex items-center justify-center w-full">
              <Image src="/logo.png" alt="logo" width={40} height={40} className="object-contain" />
            </Link>
            <button
              type="button"
              aria-label="Toggle sidebar"
              onClick={() => setCollapsed((v) => !v)}
              className="rounded-md border p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors w-full flex items-center justify-center"
            >
              <PanelLeftOpen size={16} />
            </button>
          </>
        )}
      </div>

      {/* Workspace Selector */}
      {!collapsed && (
        <div className="mb-4">
          <WorkspaceSelector />
        </div>
      )}

      <nav className="space-y-1">
        {NAVIGATION_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            collapsed={collapsed}
            href={item.href}
            iconName={item.iconName as keyof typeof iconMap}
            label={item.label}
            badge={(item as any).badge}
          />
        ))}

        {isOwner &&
          OWNER_ONLY_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              collapsed={collapsed}
              href={item.href}
              iconName={item.iconName as keyof typeof iconMap}
              label={item.label}
            />
          ))}
      </nav>

      <div className="mt-auto pt-4">
        {isAuthed ? (
          <UserDropdown collapsed={collapsed} />
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="w-full rounded-md border px-3 py-2 text-sm hover:bg-accent text-center"
            >
              Login
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
