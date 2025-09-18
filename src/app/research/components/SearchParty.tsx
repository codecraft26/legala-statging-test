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
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Party name"
          value={party}
          onChange={(e) => setParty(e.target.value)}
        />
        <Button type="submit">Search</Button>
      </form>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <div className="space-y-2">
        {results.map((r) => (
          <div key={r.id} className="rounded-md border p-3">
            <div className="text-sm font-medium">{r.title}</div>
            <div className="text-xs text-muted-foreground">
              {new Date(r.date).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
