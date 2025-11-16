"use client";

import React from "react";
import TanStackProvider from "@/provider/tanstack";
import { ToastProvider } from "@/components/ui/toast";
import AppShell from "@/components/app-shell";
import { PostHogProvider } from "@/lib/posthog";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider>
      <TanStackProvider>
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </TanStackProvider>
    </PostHogProvider>
  );
}
