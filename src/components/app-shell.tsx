"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";

const AUTH_PATHS = [
  "/login",
  "/signup",
  "/accept-invite",
  "/forgot-password",
  "/reset-password",
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}?`)
  );

  if (isAuth) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-svh">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1">
        <Topbar />
        <div className="px-3 md:px-6">{children}</div>
      </div>
    </div>
  );
}
