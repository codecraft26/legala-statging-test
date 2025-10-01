"use client";

import React from "react";

export default function ResearchShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
    </div>
  );
}


