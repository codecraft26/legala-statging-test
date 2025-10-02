"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface TabDef<T extends string> {
  id: T;
  label: string;
}

interface ResearchTabsProps<T extends string> {
  tabs: TabDef<T>[];
  active: T;
  onChange: (t: T) => void;
}

export default function ResearchTabs<T extends string>({
  tabs,
  active,
  onChange,
}: ResearchTabsProps<T>) {
  return (
    <div className="flex gap-2">
      {tabs.map((t) => (
        <Button
          key={t.id}
          variant={active === t.id ? "default" : "outline"}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </Button>
      ))}
    </div>
  );
}
