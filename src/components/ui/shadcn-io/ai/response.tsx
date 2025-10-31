"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Response({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("prose prose-sm max-w-none text-foreground", className)}>
      {children}
    </div>
  );
}


