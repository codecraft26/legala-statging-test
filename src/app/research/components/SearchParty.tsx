"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

export default function SearchParty({ court }: { court: string }) {
  const [party, setParty] = useState("");
  const [results, setResults] = useState<
    Array<{ id: string; title: string; date: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!party.trim()) {
      setError("Enter a party name to search.");
      setResults([]);
      return;
    }
    setResults([
      {
        id: "1",
        title: `${court} v Foo (by ${party})`,
        date: new Date().toISOString(),
      },
      {
        id: "2",
        title: `${court} v Bar (by ${party})`,
        date: "2024-01-14T12:00:00.000Z",
      },
    ]);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Party name"
          value={party}
          onChange={(e) => setParty(e.target.value)}
        />
        <Button type="submit">Search</Button>
      </form>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="space-y-2">
        {results.map((r) => (
          <div key={r.id} className="rounded-md border border-border bg-card p-3 shadow-sm">
            <div className="text-sm font-medium text-card-foreground">{r.title}</div>
            <div className="text-xs text-muted-foreground">
              {new Date(r.date).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
