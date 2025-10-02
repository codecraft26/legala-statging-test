"use client";

import React from "react";

interface Crumb {
  id: string;
  name: string;
}

interface BreadcrumbsProps {
  path: Crumb[];
  onHome: () => void;
  onCrumbClick: (index: number) => void;
}

export default function Breadcrumbs({
  path,
  onHome,
  onCrumbClick,
}: BreadcrumbsProps) {
  return (
    <div className="flex items-center gap-2 text-sm flex-wrap">
      <button
        onClick={onHome}
        className="rounded-md border px-2 py-1"
        title="Home"
      >
        🏠
      </button>
      {path.map((f, idx) => (
        <div key={f.id} className="flex items-center gap-1">
          <span>›</span>
          <button
            onClick={() => onCrumbClick(idx)}
            className="text-muted-foreground hover:underline"
          >
            {f.name}
          </button>
        </div>
      ))}
    </div>
  );
}
