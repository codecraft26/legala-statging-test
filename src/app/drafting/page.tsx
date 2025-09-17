"use client";

import React from "react";
import AdvancedEditor from "./components/AdvancedEditor";
import { Button } from "@/components/ui/button";

export default function DraftingPage() {
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">AutoDraft Pro</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline">Import</Button>
          <Button>Save</Button>
        </div>
      </div>
      <AdvancedEditor />
    </main>
  );
}
