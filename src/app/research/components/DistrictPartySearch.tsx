"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useDistrictsIndex } from "@/hooks/use-districts";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type DistrictsApiResponse = {
  status: number;
  data: Array<{ state: string; districts: string[] }>;
};

export default function DistrictPartySearch() {
  const [stateName, setStateName] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [stateSearch, setStateSearch] = useState<string>("");
  const [party, setParty] = useState<string>("");
  const [results, setResults] = useState<
    Array<{ id: string; title: string; date: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  const districtsQuery = useDistrictsIndex();

  const states = useMemo(
    () => (districtsQuery.data?.data || []).map((d) => d.state),
    [districtsQuery.data]
  );
  const filteredStates = useMemo(
    () =>
      states.filter((s) =>
        s.toLowerCase().includes(stateSearch.trim().toLowerCase())
      ),
    [states, stateSearch]
  );
  const districts = useMemo(() => {
    const entry = (districtsQuery.data?.data || []).find(
      (d) => d.state === stateName
    );
    return entry?.districts || [];
  }, [districtsQuery.data, stateName]);

  useEffect(() => {
    if (!stateName && states.length > 0) {
      setStateName(states[0]);
    }
  }, [states, stateName]);

  useEffect(() => {
    if (districts.length > 0) {
      setDistrict((prev) => (prev ? prev : districts[0]));
    } else {
      setDistrict("");
    }
  }, [districts]);

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
        date: "2024-01-14T12:00:00.000Z",
      },
    ]);
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 md:grid-cols-4 gap-2"
      >
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-md border px-3 py-2 text-sm w-full text-left">
            {stateName || "Select state"}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 max-h-72 overflow-y-auto">
            {districtsQuery.isLoading ? (
              <DropdownMenuItem>Loading…</DropdownMenuItem>
            ) : districtsQuery.error ? (
              <DropdownMenuItem>Error loading</DropdownMenuItem>
            ) : (
              filteredStates.map((s) => (
                <DropdownMenuItem key={s} onClick={() => setStateName(s)}>
                  {s}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
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
