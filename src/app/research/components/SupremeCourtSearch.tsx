"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Api } from "@/lib/api-client";

type Result = unknown;

export default function SupremeCourtSearch() {
  const [tab, setTab] = useState<"party" | "diary" | "detail">("party");

  const [partyType, setPartyType] = useState<string>("any");
  const [partyName, setPartyName] = useState<string>("");
  const [partyYear, setPartyYear] = useState<string>("");
  const [partyStatus, setPartyStatus] = useState<string>("P");

  const [diaryNo, setDiaryNo] = useState<string>("");
  const [diaryYear, setDiaryYear] = useState<string>("");

  const [detailDiaryNo, setDetailDiaryNo] = useState<string>("");
  const [detailDiaryYear, setDetailDiaryYear] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Result | null>(null);

  const callApi = async (path: string, body: any) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await Api.post<Result, any>(path, body);
      setData(res);
    } catch (err: any) {
      setError(err?.message ?? "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const onSubmitParty = (e: React.FormEvent) => {
    e.preventDefault();
    const yr = Number(partyYear) || undefined;
    callApi("/research/supreme-court/search-party", {
      party_type: partyType,
      party_name: partyName,
      year: yr,
      party_status: partyStatus,
    });
  };

  const onSubmitDiary = (e: React.FormEvent) => {
    e.preventDefault();
    callApi("/research/supreme-court/search-diary", {
      diary_no: Number(diaryNo) || undefined,
      year: Number(diaryYear) || undefined,
    });
  };

  const onSubmitDetail = (e: React.FormEvent) => {
    e.preventDefault();
    callApi("/research/supreme-court/case-detail", {
      diary_no: Number(detailDiaryNo) || undefined,
      diary_year: Number(detailDiaryYear) || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={tab === "party" ? "default" : "outline"}
          onClick={() => setTab("party")}
        >
          Search Party
        </Button>
        <Button
          variant={tab === "diary" ? "default" : "outline"}
          onClick={() => setTab("diary")}
        >
          Search Diary
        </Button>
        <Button
          variant={tab === "detail" ? "default" : "outline"}
          onClick={() => setTab("detail")}
        >
          Case Detail
        </Button>
      </div>

      {tab === "party" && (
        <form
          onSubmit={onSubmitParty}
          className="grid grid-cols-1 md:grid-cols-4 gap-2"
        >
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={partyType}
            onChange={(e) => setPartyType(e.target.value)}
          >
            <option value="any">Any</option>
            <option value="petitioner">Petitioner</option>
            <option value="respondent">Respondent</option>
          </select>
          <input
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Party name"
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
          />
          <input
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Year (optional)"
            inputMode="numeric"
            value={partyYear}
            onChange={(e) => setPartyYear(e.target.value)}
          />
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={partyStatus}
            onChange={(e) => setPartyStatus(e.target.value)}
          >
            <option value="P">Petitioner</option>
            <option value="R">Respondent</option>
            <option value="Both">Both</option>
          </select>
          <div className="md:col-span-4">
            <Button type="submit">Search</Button>
          </div>
        </form>
      )}

      {tab === "diary" && (
        <form
          onSubmit={onSubmitDiary}
          className="grid grid-cols-1 md:grid-cols-3 gap-2"
        >
          <input
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Diary no"
            inputMode="numeric"
            value={diaryNo}
            onChange={(e) => setDiaryNo(e.target.value)}
          />
          <input
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Year"
            inputMode="numeric"
            value={diaryYear}
            onChange={(e) => setDiaryYear(e.target.value)}
          />
          <Button type="submit">Search</Button>
        </form>
      )}

      {tab === "detail" && (
        <form
          onSubmit={onSubmitDetail}
          className="grid grid-cols-1 md:grid-cols-3 gap-2"
        >
          <input
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Diary no"
            inputMode="numeric"
            value={detailDiaryNo}
            onChange={(e) => setDetailDiaryNo(e.target.value)}
          />
          <input
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Diary year"
            inputMode="numeric"
            value={detailDiaryYear}
            onChange={(e) => setDetailDiaryYear(e.target.value)}
          />
          <Button type="submit">Get Detail</Button>
        </form>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : null}
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {data ? (
        <pre className="rounded-md border p-3 text-xs overflow-auto bg-card">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
