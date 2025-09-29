"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import { getCookie } from "@/lib/utils";

const AUTH_PATHS = [
  "/login",
  "/signup",
  "/accept-invite",
  "/forgot-password",
  "/reset-password",
  "/invite",
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuth = AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(`${p}?`)
  );

  useEffect(() => {
    if (isAuth) return;
    try {
      const token = typeof window !== "undefined" ? getCookie("token") : null;
      if (!token) {
        router.replace("/login");
      }
    } catch {}
  }, [isAuth, pathname, router]);

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
