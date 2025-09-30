"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  stateCodeMapping,
  courtComplexMapping,
  courtCodeMapping,
} from "../utils/courtMappings";
import {
  useHighByAdvocate,
  useHighByFilingNumber,
  useHighDetail,
} from "@/hooks/use-research";

type Result = unknown;

export default function HighCourtAdvancedSearch() {
  const [tab, setTab] = useState<"advocate" | "filing" | "detail">("advocate");

  const [courtCode, setCourtCode] = useState<string>("");
  const [stateCode, setStateCode] = useState<string>("");
  const [courtComplexCode, setCourtComplexCode] = useState<string>("");
  const [advocateName, setAdvocateName] = useState<string>("");
  const [f, setF] = useState<string>("Both");

  const [caseNo, setCaseNo] = useState<string>("");
  const [rgYear, setRgYear] = useState<string>("");

  const [detailCino, setDetailCino] = useState<string>("");
  const [detailNatCourtCode, setDetailNatCourtCode] = useState<string>("");
  const [detailDistCd, setDetailDistCd] = useState<string>("");

  // Query parameters for each tab
  const advocateParams = courtCode && stateCode && courtComplexCode && advocateName ? {
    court_code: Number(courtCode),
    state_code: Number(stateCode),
    court_complex_code: Number(courtComplexCode),
    advocate_name: advocateName,
    f: f as "P" | "R" | "Both",
  } : null;

  const filingParams = courtCode && stateCode && courtComplexCode && caseNo && rgYear ? {
    court_code: Number(courtCode),
    state_code: Number(stateCode),
    court_complex_code: Number(courtComplexCode),
    case_no: Number(caseNo),
    rgyear: Number(rgYear),
  } : null;

  const detailParams = caseNo && stateCode && detailCino && courtCode && detailNatCourtCode && detailDistCd ? {
    case_no: Number(caseNo),
    state_code: Number(stateCode),
    cino: detailCino,
    court_code: Number(courtCode),
    national_court_code: detailNatCourtCode,
    dist_cd: Number(detailDistCd),
  } : null;

  // TanStack Query hooks
  const advocateQuery = useHighByAdvocate(advocateParams);
  const filingQuery = useHighByFilingNumber(filingParams);
  const detailQuery = useHighDetail(detailParams);

  // Get current query based on active tab
  const currentQuery = tab === "advocate" ? advocateQuery : 
                      tab === "filing" ? filingQuery : 
                      detailQuery;

  const onSubmitAdvocate = (e: React.FormEvent) => {
    e.preventDefault();
    if (advocateParams) {
      advocateQuery.refetch();
    }
  };

  const onSubmitFiling = (e: React.FormEvent) => {
    e.preventDefault();
    if (filingParams) {
      filingQuery.refetch();
    }
  };

  const onSubmitDetail = (e: React.FormEvent) => {
    e.preventDefault();
    if (detailParams) {
      detailQuery.refetch();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={tab === "advocate" ? "default" : "outline"}
          onClick={() => setTab("advocate")}
        >
          Advocate
        </Button>
        <Button
          variant={tab === "filing" ? "default" : "outline"}
          onClick={() => setTab("filing")}
        >
          Filing Number
        </Button>
        <Button
          variant={tab === "detail" ? "default" : "outline"}
          onClick={() => setTab("detail")}
        >
          Case Detail
        </Button>
      </div>

      {(tab === "advocate" || tab === "filing" || tab === "detail") && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={courtCode}
            onChange={(e) => setCourtCode(e.target.value)}
          >
            <option value="">Select Court Type</option>
            {courtCodeMapping.map((court) => (
              <option key={court.code} value={court.code}>
                {court.name}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value)}
          >
            <option value="">Select State</option>
            {stateCodeMapping.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={courtComplexCode}
            onChange={(e) => setCourtComplexCode(e.target.value)}
          >
            <option value="">Select Court Complex</option>
            {courtComplexMapping.map((complex) => (
              <option key={complex.code} value={complex.code}>
                {complex.name}
              </option>
            ))}
          </select>
          {tab === "advocate" ? (
            <input
              className="rounded-md border px-3 py-2 text-sm"
              placeholder="Advocate name"
              value={advocateName}
              onChange={(e) => setAdvocateName(e.target.value)}
            />
          ) : tab === "filing" ? (
            <>
              <input
                className="rounded-md border px-3 py-2 text-sm"
                placeholder="Case no"
                inputMode="numeric"
                value={caseNo}
                onChange={(e) => setCaseNo(e.target.value)}
              />
              <input
                className="rounded-md border px-3 py-2 text-sm"
                placeholder="RG year"
                inputMode="numeric"
                value={rgYear}
                onChange={(e) => setRgYear(e.target.value)}
              />
            </>
          ) : (
            <>
              <input
                className="rounded-md border px-3 py-2 text-sm"
                placeholder="Case no"
                inputMode="numeric"
                value={caseNo}
                onChange={(e) => setCaseNo(e.target.value)}
              />
              <input
                className="rounded-md border px-3 py-2 text-sm"
                placeholder="CINO"
                value={detailCino}
                onChange={(e) => setDetailCino(e.target.value)}
              />
              <input
                className="rounded-md border px-3 py-2 text-sm"
                placeholder="National court code"
                value={detailNatCourtCode}
                onChange={(e) => setDetailNatCourtCode(e.target.value)}
              />
              <input
                className="rounded-md border px-3 py-2 text-sm"
                placeholder="District code"
                inputMode="numeric"
                value={detailDistCd}
                onChange={(e) => setDetailDistCd(e.target.value)}
              />
            </>
          )}
        </div>
      )}

      {tab === "advocate" && (
        <form onSubmit={onSubmitAdvocate} className="space-y-2">
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={f}
            onChange={(e) => setF(e.target.value)}
          >
            <option value="P">P</option>
            <option value="R">R</option>
            <option value="Both">Both</option>
          </select>
          <div>
            <Button type="submit">Search</Button>
          </div>
        </form>
      )}

      {tab === "filing" && (
        <form onSubmit={onSubmitFiling} className="space-y-2">
          <Button type="submit">Search</Button>
        </form>
      )}

      {tab === "detail" && (
        <form onSubmit={onSubmitDetail} className="space-y-2">
          <Button type="submit">Get Detail</Button>
        </form>
      )}

      {currentQuery.isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : null}
      {currentQuery.error ? (
        <div className="text-sm text-red-600">
          {currentQuery.error instanceof Error 
            ? currentQuery.error.message 
            : "An error occurred"}
        </div>
      ) : null}
      {currentQuery.data ? (
        <pre className="rounded-md border p-3 text-xs overflow-auto bg-card">
          {JSON.stringify(currentQuery.data, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
