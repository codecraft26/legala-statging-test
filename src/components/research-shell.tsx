"use client";

import React from "react";

export default function ResearchShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-background border-b border-border px-6 py-4">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      </div>
      <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
    </div>
  );
}


