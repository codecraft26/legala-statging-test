"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { districtIndex } from "../utils/districtId";

export default function DistrictPartySearch() {
  const [stateName, setStateName] = useState<string>(
    districtIndex[0]?.state ?? ""
  );
  const [district, setDistrict] = useState<string>("");
  const [party, setParty] = useState<string>("");
  const [results, setResults] = useState<
    Array<{ id: string; title: string; date: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  const states = useMemo(() => districtIndex.map((d) => d.state), []);
  const districts = useMemo(
    () => districtIndex.find((d) => d.state === stateName)?.districts ?? [],
    [stateName]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!party.trim()) {
      setError("Enter a party name.");
      setResults([]);
      return;
    }
    setResults([
      {
        id: "d1",
        title: `${party} vs State (${stateName} - ${district || districts[0] || "District"})`,
        date: new Date().toISOString(),
      },
      {
        id: "d2",
        title: `${party} vs ABC (${stateName})`,
        date: new Date(Date.now() - 86400000).toISOString(),
      },
    ]);
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 md:grid-cols-4 gap-2"
      >
        <select
          className="rounded-md border px-3 py-2 text-sm"
          value={stateName}
          onChange={(e) => setStateName(e.target.value)}
        >
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border px-3 py-2 text-sm"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
        >
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
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
