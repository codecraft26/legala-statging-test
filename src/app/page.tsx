import React from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
export default function Home() {
  return (
    <main className="max-w-6xl w-full mx-auto flex flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">LegalAI Dashboard</h1>
        <ThemeToggle />
      </header>
      <section className="rounded-lg border p-6">
        <p className="text-muted-foreground">
          Next.js app ready. Start migrating pages from Vite app.
        </p>
      </section>
    </main>
  );
}
