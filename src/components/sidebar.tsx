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
  const active = pathname === href || pathname.startsWith(href + "/");
  const IconComponent = iconMap[iconName];

  return (
    <Link
      href={href}
      className={`group relative flex items-center rounded-md px-2 py-1 transition-all duration-200 ease-out ${
        collapsed ? "justify-center w-full" : "gap-1.5 min-w-0"
      } ${
        active
          ? "bg-gradient-to-br from-zinc-100/80 via-zinc-100/60 to-zinc-100/80 dark:from-zinc-800/40 dark:via-zinc-800/30 dark:to-zinc-800/40 text-zinc-900 dark:text-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.12)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)] border border-zinc-300/50 dark:border-zinc-700/50"
          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 hover:text-zinc-900 dark:hover:text-zinc-100 border border-transparent hover:border-zinc-200/50 dark:hover:border-zinc-700/50"
      }`}
    >
      {active && (
        <>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gradient-to-b from-zinc-700 via-zinc-600 to-zinc-700 dark:from-zinc-500 dark:via-zinc-400 dark:to-zinc-500 rounded-r-full shadow-sm shadow-black/20 dark:shadow-black/40" />
          <div className="absolute inset-0 rounded-md bg-gradient-to-br from-white/30 to-transparent dark:from-white/5 pointer-events-none" />
        </>
      )}
      <span className={`relative z-10 flex items-center justify-center transition-all duration-200 ${
        active 
          ? "scale-105 text-zinc-900 dark:text-zinc-100" 
          : "group-hover:scale-[1.02] text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200"
      }`}>
        <IconComponent 
          size={15} 
          strokeWidth={active ? 2.5 : 2} 
          className={active ? "drop-shadow-sm" : ""}
        />
      </span>
      {!collapsed && (
        <span className="text-xs font-medium flex items-center gap-1 relative z-10 tracking-tight">
          <span className={active ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-700 dark:text-zinc-300"}>
            {label}
          </span>
          {badge && (
            <span className="relative inline-flex items-center">
              <span className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full blur-[2px] opacity-50 animate-pulse" />
              <span className="relative text-[8px] px-1 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 text-white font-bold shadow-sm shadow-emerald-500/25 uppercase tracking-wider">
                {badge}
              </span>
            </span>
          )}
        </span>
      )}
      {!active && (
        <div className="absolute inset-0 rounded-md bg-gradient-to-r from-transparent via-white/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
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
      className={`sticky top-0 h-svh shrink-0 border-r border-zinc-200/60 dark:border-zinc-800/60 bg-background p-3 transition-all duration-500 ease-out shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_4px_24px_rgba(0,0,0,0.05)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_4px_24px_rgba(0,0,0,0.3)] ${
        collapsed ? SIDEBAR_WIDTHS.COLLAPSED : SIDEBAR_WIDTHS.EXPANDED
      }`}
    >
      
      <div className="flex flex-col h-full relative z-10">
        {/* Header */}
        <div className={`mb-3 flex items-center ${collapsed ? "flex-col gap-3" : "justify-between"}`}>
          {!collapsed ? (
            <>
              <Link 
                href="/dashboard" 
                className="flex items-center gap-2 group transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/30 via-blue-400/30 to-purple-400/30 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Image 
                    src="/logo.png" 
                    alt="logo" 
                    width={28} 
                    height={28} 
                    className="object-contain drop-shadow-md relative z-10"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-extrabold bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 dark:from-indigo-400 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent tracking-tight leading-none">
                    InfraHive
                  </span>
                  <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-widest">
                    AI Platform
                  </span>
                </div>
              </Link>
              <button
                type="button"
                aria-label="Toggle sidebar"
                onClick={() => setCollapsed((v) => !v)}
                className="rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm p-1.5 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50"
              >
                <PanelLeftClose size={16} className="text-zinc-600 dark:text-zinc-400" strokeWidth={2.5} />
              </button>
            </>
          ) : (
            <>
              <Link 
                href="/dashboard" 
                className="flex items-center justify-center w-full group transition-all duration-300 hover:scale-105"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/40 via-blue-400/40 to-purple-400/40 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Image 
                    src="/logo.png" 
                    alt="logo" 
                    width={36} 
                    height={36} 
                    className="object-contain drop-shadow-lg relative z-10"
                  />
                </div>
              </Link>
              <button
                type="button"
                aria-label="Toggle sidebar"
                onClick={() => setCollapsed((v) => !v)}
                className="rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm p-1.5 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50 w-full flex items-center justify-center"
              >
                <PanelLeftOpen size={16} className="text-zinc-600 dark:text-zinc-400" strokeWidth={2.5} />
              </button>
            </>
          )}
        </div>

        {/* Workspace Selector */}
        {!collapsed && (
          <div className="mb-3">
            <WorkspaceSelector />
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-0 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent pr-1 -mr-1">
          {/* Main Section */}
          <NavItem
            collapsed={collapsed}
            href={NAVIGATION_ITEMS[0].href}
            iconName={NAVIGATION_ITEMS[0].iconName as keyof typeof iconMap}
            label={NAVIGATION_ITEMS[0].label}
            badge={(NAVIGATION_ITEMS[0] as any).badge}
          />

          {/* AI Tools Section */}
          {!collapsed && (
            <div className="px-2 pt-2 pb-1">
              <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.1em]">
                AI Tools
              </span>
            </div>
          )}
          {collapsed && <div className="h-1" />}
          <div className="space-y-0">
            {NAVIGATION_ITEMS.slice(1, 3).map((item) => (
              <NavItem
                key={item.href}
                collapsed={collapsed}
                href={item.href}
                iconName={item.iconName as keyof typeof iconMap}
                label={item.label}
                badge={(item as any).badge}
              />
            ))}
          </div>

          {/* Research Section */}
          {!collapsed && (
            <div className="px-2 pt-2 pb-1">
              <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.1em]">
                Research
              </span>
            </div>
          )}
          {collapsed && <div className="h-1" />}
          <div className="space-y-0">
            {NAVIGATION_ITEMS.slice(3, 5).map((item) => (
              <NavItem
                key={item.href}
                collapsed={collapsed}
                href={item.href}
                iconName={item.iconName as keyof typeof iconMap}
                label={item.label}
                badge={(item as any).badge}
              />
            ))}
          </div>

          {/* Content Section */}
          {!collapsed && (
            <div className="px-2 pt-2 pb-1">
              <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.1em]">
                Content
              </span>
            </div>
          )}
          {collapsed && <div className="h-1" />}
          <div className="space-y-0">
            {NAVIGATION_ITEMS.slice(5, 6).map((item) => (
              <NavItem
                key={item.href}
                collapsed={collapsed}
                href={item.href}
                iconName={item.iconName as keyof typeof iconMap}
                label={item.label}
                badge={(item as any).badge}
              />
            ))}
          </div>

          {/* Documents Section */}
          {!collapsed && (
            <div className="px-2 pt-2 pb-1">
              <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.1em]">
                Documents
              </span>
            </div>
          )}
          {collapsed && <div className="h-1" />}
          <div className="space-y-0">
            {NAVIGATION_ITEMS.slice(6).map((item) => (
              <NavItem
                key={item.href}
                collapsed={collapsed}
                href={item.href}
                iconName={item.iconName as keyof typeof iconMap}
                label={item.label}
                badge={(item as any).badge}
              />
            ))}
          </div>

          {/* Admin Section */}
          {isOwner && (
            <>
              {!collapsed && (
                <div className="px-2 pt-2 pb-1">
                  <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.1em]">
                    Admin
                  </span>
                </div>
              )}
              {collapsed && <div className="h-1" />}
              <div className="space-y-0">
                {OWNER_ONLY_ITEMS.map((item) => (
                  <NavItem
                    key={item.href}
                    collapsed={collapsed}
                    href={item.href}
                    iconName={item.iconName as keyof typeof iconMap}
                    label={item.label}
                  />
                ))}
              </div>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60">
          {isAuthed ? (
            <UserDropdown collapsed={collapsed} />
          ) : (
            <Link
              href="/login"
              className="w-full rounded-xl border border-indigo-200/60 dark:border-indigo-800/60 px-4 py-3 text-sm font-semibold bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-indigo-950/40 dark:via-blue-950/40 dark:to-purple-950/40 hover:from-indigo-100 hover:via-blue-100 hover:to-purple-100 dark:hover:from-indigo-950/60 dark:hover:via-blue-950/60 dark:hover:to-purple-950/60 text-indigo-700 dark:text-indigo-300 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/30 block backdrop-blur-sm"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
