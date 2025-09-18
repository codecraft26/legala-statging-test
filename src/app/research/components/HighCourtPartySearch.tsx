"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { hcBenches } from "../utils/hcBench";

export default function HighCourtPartySearch() {
  const [bench, setBench] = useState<string>("DELHI");
  const [party, setParty] = useState<string>("");
  const [results, setResults] = useState<
    Array<{ id: string; title: string; date: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  const benchOptions = useMemo(() => hcBenches, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!party.trim()) {
      setError("Enter a party name.");
      setResults([]);
      return;
    }
    // Mocked results
    setResults([
      {
        id: "h1",
        title: `${party} vs State of ${bench}`,
        date: new Date().toISOString(),
      },
      {
        id: "h2",
        title: `${party} vs XYZ (${bench})`,
        date: "2024-01-14T12:00:00.000Z",
      },
    ]);
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 md:grid-cols-3 gap-2"
      >
        <select
          className="rounded-md border px-3 py-2 text-sm"
          value={bench}
          onChange={(e) => setBench(e.target.value)}
        >
          {benchOptions.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <input
          className="rounded-md border px-3 py-2 text-sm"
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
