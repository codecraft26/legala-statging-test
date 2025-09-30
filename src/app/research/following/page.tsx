"use client";

import React from "react";
import ResearchShell from "@/components/research-shell";
import { Bookmark } from "lucide-react";

export default function FollowedCasesPage() {
  return (
    <ResearchShell title="Followed Cases">
      <div className="p-6">
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Bookmark className="h-12 w-12 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">
            Followed Cases
          </h3>
          <p className="text-gray-600 dark:text-zinc-400 max-w-md mx-auto">
            Track and manage your followed legal cases
          </p>
        </div>
      </div>
    </ResearchShell>
  );
}


