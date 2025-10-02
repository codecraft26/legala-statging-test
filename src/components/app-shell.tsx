"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
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

  return (
    <>
      {isAuth ? (
        <>{children}</>
      ) : (
        <div className="flex h-svh overflow-x-hidden">
          <div className="hidden md:block">
            <Sidebar />
          </div>
          <div className="flex-1 min-w-0 overflow-x-hidden h-svh overflow-y-auto">
            <div className="px-3 md:px-6 max-w-full min-w-0 overflow-x-hidden">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}
