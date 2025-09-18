"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to workspaces page
    router.replace("/workspaces");
  }, [router]);

  return (
    <main className="max-w-3xl mx-auto p-8">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-muted-foreground">Redirecting to workspaces...</p>
      </div>
    </main>
  );
}
