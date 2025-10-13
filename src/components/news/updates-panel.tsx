"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";

export interface UpdatesPanelProps {
  open: boolean;
  onClose: () => void;
  isLoading: boolean;
  data?: {
    updates_data?: any[];
    matches?: any[];
  } | null;
}

export function UpdatesPanel({ open, onClose, isLoading, data }: UpdatesPanelProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-background border-l shadow-xl flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Recent Updates</div>
          <div className="text-xs text-muted-foreground">Latest RBI notifications with matches</div>
        </div>
        <button
          className="rounded-md border p-1 hover:bg-accent"
          onClick={onClose}
          aria-label="Close updates panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Loading updates…</span>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Matches first */}
            <div>
              <div className="text-sm font-medium mb-2">Matches</div>
              <div className="space-y-3">
                {(data.matches || []).map((m: any, i: number) => (
                  <div key={i} className="rounded-md border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="font-medium text-sm truncate">{m.update_notification?.title}</div>
                          {m.stored_notification?.category && (
                            <span className="text-white text-[10px] px-2 py-0.5 rounded bg-black">{m.stored_notification.category}</span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                          <span>{m.update_notification?.date}</span>
                          {typeof m.match_score !== "undefined" && (
                            <span className="text-[10px] rounded border px-1 py-0.5">score: {m.match_score}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {m.update_notification?.view_link && (
                          <a className="text-xs underline" href={`https://www.rbi.org.in/${m.update_notification.view_link}`} target="_blank" rel="noreferrer">View</a>
                        )}
                        {m.update_notification?.pdf_link && (
                          <a className="text-xs underline" href={m.update_notification.pdf_link} target="_blank" rel="noreferrer">PDF</a>
                        )}
                      </div>
                    </div>
                    {m.stored_notification?.title && (
                      <div className="mt-2 text-xs">
                        <span className="text-muted-foreground">Related:</span> {m.stored_notification.title}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* Updates next */}
            <div>
              <div className="text-sm font-medium mb-2">Updates</div>
              <div className="space-y-3">
                {(data.updates_data || []).map((u: any, i: number) => (
                  <div key={i} className="rounded-md border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-sm">{u.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{u.date}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {u.view_link && (
                          <a className="text-xs underline" href={`https://www.rbi.org.in/${u.view_link}`} target="_blank" rel="noreferrer">View</a>
                        )}
                        {u.pdf_link && (
                          <a className="text-xs underline" href={u.pdf_link} target="_blank" rel="noreferrer">PDF</a>
                        )}
                      </div>
                    </div>
                    {u.size && <div className="mt-2 text-[10px] text-muted-foreground">{u.size}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-sm text-muted-foreground">No updates.</div>
        )}
      </div>
    </div>
  );
}

export default UpdatesPanel;


