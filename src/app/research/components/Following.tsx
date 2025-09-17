"use client";

import React from "react";
import { Button } from "@/components/ui/button";

export default function Following({
  items,
  onUnfollow,
  onView,
}: {
  items: Array<{ id: string; title: string; court: string; date: string }>;
  onUnfollow: (id: string) => void;
  onView: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No followed cases.</p>
      ) : null}
      {items.map((it) => (
        <div
          key={it.id}
          className="rounded-lg border p-4 flex items-center justify-between"
        >
          <div>
            <div className="text-sm font-medium">{it.title}</div>
            <div className="text-xs text-muted-foreground">
              {it.court} • {new Date(it.date).toLocaleDateString()}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => onView(it.id)}>
              View
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onUnfollow(it.id)}
            >
              Unfollow
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
