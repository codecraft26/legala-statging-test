"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Api } from "@/lib/api-client";
import { districtId, districtIndex } from "../utils/districtId";
import { useEstCodes } from "@/hooks/use-est-codes";
import ResearchTabs from "./common/ResearchTabs";
import EstCodeField from "./common/EstCodeField";
import ResultPanel from "./common/ResultPanel";

type Result = unknown;

export default function DistrictAdvancedSearch() {
  const [tab, setTab] = useState<"party" | "detail">("party");
  const {
    getEstCodeOptionsForDistrict,
    loading: estLoading,
    error: estError,
  } = useEstCodes();

  const states = useMemo(() => districtIndex.map((d) => d.state), []);
  const [stateName, setStateName] = useState<string>(
    districtIndex[0]?.state ?? ""
  );
  const districts = useMemo(
    () => districtIndex.find((d) => d.state === stateName)?.districts ?? [],
    [stateName]
  );
  const [district, setDistrict] = useState<string>("");

  const estCodeOptions = useMemo(() => {
    return district ? getEstCodeOptionsForDistrict(district) : [];
  }, [district, getEstCodeOptionsForDistrict]);

  const [partyName, setPartyName] = useState<string>("");
  const [regYear, setRegYear] = useState<string>("");
  const [caseStatus, setCaseStatus] = useState<string>("P");
  const [estCode, setEstCode] = useState<string>("");

  const [cino, setCino] = useState<string>("");
  const [detailDistrictName, setDetailDistrictName] = useState<string>("");

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
    const selectedDistrictName = district || districts[0]?.name || "";
    callApi("/research/district-court/search-party", {
      district_name: String(selectedDistrictName)
        .toLowerCase()
        .replace(/\s+/g, " "),
      litigant_name: partyName,
      reg_year: Number(regYear) || undefined,
      case_status: caseStatus,
      est_code: estCode,
    });
  };

  const onSubmitDetail = (e: React.FormEvent) => {
    e.preventDefault();
    callApi("/research/district-court/case-detail", {
      cino,
      district_name: detailDistrictName.toLowerCase().replace(/\s+/g, " "),
    });
  };

  return (
    <div className="space-y-4">
      <ResearchTabs
        tabs={[
          { id: "party", label: "Search Party" },
          { id: "detail", label: "Case Detail" },
        ]}
        active={tab}
        onChange={(t) => setTab(t as any)}
      />

      {tab === "party" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
            <EstCodeField
              value={estCode}
              onChange={setEstCode}
              options={estCodeOptions}
              disabled={!district || estLoading}
              errorText={!district ? "Select a district first to see EST codes." : estError || null}
              helper={district && estCodeOptions.length > 0 ? (
                <>{estCodeOptions.length} EST codes available. Type to search or click dropdown arrow.</>
              ) : undefined}
            />
          </div>
          <form
            onSubmit={onSubmitParty}
            className="grid grid-cols-1 md:grid-cols-3 gap-2"
          >
            <input
              className="rounded-md border px-3 py-2 text-sm"
              placeholder="Party name"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
            />
            <input
              className="rounded-md border px-3 py-2 text-sm"
              placeholder="Registration year"
              inputMode="numeric"
              value={regYear}
              onChange={(e) => setRegYear(e.target.value)}
            />
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={caseStatus}
              onChange={(e) => setCaseStatus(e.target.value)}
            >
              <option value="P">P</option>
              <option value="D">D</option>
              <option value="Both">Both</option>
            </select>
            <div className="md:col-span-3">
              <Button type="submit">Search</Button>
            </div>
          </form>
        </>
      )}

      {tab === "detail" && (
        <form
          onSubmit={onSubmitDetail}
          className="grid grid-cols-1 md:grid-cols-3 gap-2"
        >
          <input
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="CINO"
            value={cino}
            onChange={(e) => setCino(e.target.value)}
          />
          <input
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="District name"
            value={detailDistrictName}
            onChange={(e) => setDetailDistrictName(e.target.value)}
          />
          <Button type="submit">Get Detail</Button>
        </form>
      )}

      <ResultPanel loading={loading} error={error} data={data} />
    </div>
  );
}
