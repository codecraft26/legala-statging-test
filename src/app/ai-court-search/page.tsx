"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type SupremeCourtItem = {
  index: number;
  case_title?: { full_title?: string };
  citation?: { scr_citation?: string; neutral_citation?: string };
  bench?: { judges?: string[]; author_judge?: string };
  case_details?: {
    decision_date?: string;
    case_number?: string;
    disposal_nature?: string;
    bench_size?: string;
  };
  cnr?: string;
  highlights?: string[];
  pdf_params?: {
    court_code?: string;
    year?: string;
    case_id?: string;
    citation_code?: string;
    flag?: string;
  };
  court?: string;
};

import { useAICourtSearch } from "@/hooks/use-research";

const YEAR_REGEX = /\b(19|20)\d{2}\b/;

function normalizeQueryWithYear(input: string) {
  const clean = input.trim();
  if (YEAR_REGEX.test(clean)) {
    return {
      normalizedQuery: clean,
      addedYear: null as number | null,
    };
  }
  const currentYear = new Date().getFullYear();
  const base = clean.replace(/[.\s]+$/, "");
  return {
    normalizedQuery: `${base} from ${currentYear}`,
    addedYear: currentYear,
  };
}

export default function AICourtSearchPage() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);
  const [searchPage, setSearchPage] = useState<number>(1);
  const [effectiveQuery, setEffectiveQuery] = useState<string | null>(null);
  const [queryNotice, setQueryNotice] = useState<string | null>(null);
  const { data, isLoading, isError, error } = useAICourtSearch(
    submittedQuery
      ? {
          query: submittedQuery,
          page: searchPage,
        }
      : null
  );
  const [activeTab, setActiveTab] = useState<"supreme" | "high">("supreme");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const samplePrompts: string[] = [
    "Find me court cases having phrase 'release on probation under Section 4 of the Probation of Offenders Act' from 2023",
    "Show Supreme Court cases about anticipatory bail with Section 438 CrPC since 2022",
    "High Court decisions on cheque dishonour under Section 138 NI Act in 2024",
  ];

  // Extract Supreme Court and High Court results
  const supremeRaw = data?.data?.supreme_court as
    | SupremeCourtItem[]
    | { error: string }
    | undefined;
  const highRaw = (data?.data as any)?.high_court as
    | {
        records?: Array<{
          serial_number?: number;
          case_number?: string;
          petitioner?: string;
          respondent?: string;
          judge?: string;
          judgment_excerpt?: string;
          cnr?: string;
          registration_date?: string;
          decision_date?: string;
          disposal_nature?: string;
          status?: string;
          court?: string;
        }>;
        totalpages?: number;
        currentpage?: number;
        totalrecords?: number;
      }
    | Array<{
        serial_number?: number;
        case_number?: string;
        petitioner?: string;
        respondent?: string;
        judge?: string;
        judgment_excerpt?: string;
        cnr?: string;
        registration_date?: string;
        decision_date?: string;
        disposal_nature?: string;
        status?: string;
        court?: string;
      }>
    | undefined;

  const supremeError =
    supremeRaw && !Array.isArray(supremeRaw) ? supremeRaw.error : undefined;

  const supremeResults: SupremeCourtItem[] = Array.isArray(supremeRaw)
    ? supremeRaw
    : [];

  // Map High Court results into SupremeCourtItem shape for the table
  const highArray = Array.isArray(highRaw)
    ? highRaw
    : Array.isArray(highRaw?.records)
      ? highRaw.records
      : [];
  const highPagination = !Array.isArray(highRaw) && highRaw
    ? {
        totalPages:
          Number(
            (highRaw as any).totalpages ?? (highRaw as any).totalPages ?? 1
          ) || 1,
        currentPage:
          Number(
            (highRaw as any).currentpage ?? (highRaw as any).currentPage ?? searchPage
          ) || searchPage,
        totalRecords:
          Number(
            (highRaw as any).totalrecords ?? (highRaw as any).totalRecords ?? highArray.length
          ) || highArray.length,
      }
    : null;
  const highAsSupreme: SupremeCourtItem[] = highArray.map((h, i) => {
    const titleParts = [h.petitioner, h.respondent].filter(Boolean);
    return {
      index: h.serial_number ?? i + 1,
      case_title: {
        full_title:
          titleParts.length > 0
            ? `${titleParts[0]}${titleParts[1] ? " v. " + titleParts[1] : ""}`
            : h.case_number || "-",
      },
      citation: {},
      bench: {
        judges: h.judge ? h.judge.split(",").map((s) => s.trim()) : [],
        author_judge: undefined,
      },
      case_details: {
        decision_date: h.decision_date || h.registration_date,
        case_number: h.case_number,
        disposal_nature: h.disposal_nature,
        bench_size: undefined,
      },
      cnr: h.cnr,
      highlights: h.judgment_excerpt ? [h.judgment_excerpt] : [],
      pdf_params: undefined,
      court: h.court,
    };
  });

  // Auto-switch tab to where data exists
  React.useEffect(() => {
    if (activeTab === "supreme" && (supremeResults.length === 0 || !!supremeError) && highAsSupreme.length > 0) {
      setActiveTab("high");
      return;
    }
    if (activeTab === "high" && highAsSupreme.length === 0 && supremeResults.length > 0) {
      setActiveTab("supreme");
    }
  }, [activeTab, supremeResults.length, highAsSupreme.length, supremeError]);

  // Select results based on active tab

  const handleSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const { normalizedQuery, addedYear } = normalizeQueryWithYear(trimmed);
    setSubmittedQuery(normalizedQuery);
    setEffectiveQuery(normalizedQuery);
    setSearchPage(1);
    setQueryNotice(
      addedYear
        ? `No year detected in your prompt. Added ${addedYear} automatically for better results.`
        : null
    );
  };

  const toRow = (item: SupremeCourtItem) => {
    const title = item.case_title?.full_title || "-";
    const scr = item.citation?.scr_citation || "-";
    const neutral = item.citation?.neutral_citation || "-";
    const date = item.case_details?.decision_date || "-";
    const caseNo = item.case_details?.case_number || "-";
    const benchSize = item.case_details?.bench_size || "-";
    const disposalNature = item.case_details?.disposal_nature || "-";
    const judges = (item.bench?.judges || []).join(", ") || "-";
    const author = item.bench?.author_judge || "-";
    const cnr = item.cnr || "-";
    const highlights =
      item.highlights && item.highlights.length > 0
        ? item.highlights.join(" | ")
        : "-";
    const court = item.court || "-";

    return {
      index: item.index,
      title,
      scr,
      neutral,
      date,
      caseNo,
      bench: benchSize,
      disposalNature,
      judges,
      author,
      cnr,
      highlights,
      court,
    };
  };

  React.useEffect(() => {
    if (!submittedQuery) return;
    if (
      highPagination?.currentPage &&
      highPagination.currentPage !== searchPage
    ) {
      setSearchPage(highPagination.currentPage);
    }
  }, [highPagination?.currentPage, searchPage, submittedQuery]);

  const highTotalRecords = highPagination?.totalRecords ?? highAsSupreme.length;
  const totalCount = supremeResults.length + (highTotalRecords || 0);
  const canPaginate =
    !!submittedQuery && !!highPagination && highPagination.totalPages > 1;
  const isFirstPage =
    (highPagination?.currentPage ?? 1) <= 1;
  const isLastPage =
    !!highPagination && highPagination.currentPage >= highPagination.totalPages;
  const handlePageStep = (direction: "prev" | "next") => {
    if (!submittedQuery || !highPagination) return;
    const delta = direction === "prev" ? -1 : 1;
    const target = Math.min(
      highPagination.totalPages,
      Math.max(1, (highPagination.currentPage ?? 1) + delta)
    );
    if (target !== searchPage) {
      setSearchPage(target);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="border-b p-4">
        <h1 className="text-lg font-semibold">AI Court Search</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter a natural language query to find matching court cases.
        </p>
      </div>

      <div className="p-4 space-y-3 border-b">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            ref={inputRef}
            placeholder="e.g. Find me court cases having phrase 'release on probation under Section 4 of the Probation of Offenders Act' from 2023"
          />
          <Button onClick={handleSearch} disabled={isLoading || !query.trim()}>
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>
        <Alert className="bg-amber-50 border-amber-200 text-amber-900">
          <AlertTitle>Prompt needs to be precise</AlertTitle>
          <AlertDescription>
            Specify statutes, sections, parties, and a time period for best results. Broader prompts may return limited or no data.
          </AlertDescription>
        </Alert>
        {/* sample prompts moved to empty state below for better UX */}
        {isError && (
          <div className="text-sm text-destructive">{(error as any)?.message || "Something went wrong"}</div>
        )}
        {!isError && supremeError && activeTab === "supreme" && (
          <div className="text-sm text-destructive">Supreme Court: {supremeError}</div>
        )}
        {queryNotice && (
          <div className="text-xs text-amber-600">{queryNotice}</div>
        )}
      </div>

      {/* Loading overlay: show only loader while searching */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted-foreground/30 border-t-primary" />
            <div className="text-sm text-muted-foreground">Searching... Powered by Infrahive</div>
          </div>
        </div>
      ) : (
        <div className="p-4">
        {/* Only show tables when we actually have results */}
        {(supremeResults.length > 0 || highAsSupreme.length > 0) ? (
          <>
          {/* Results summary */}
          <div className="mb-4">
            <div className="text-sm text-muted-foreground">
              Found <span className="font-medium text-foreground">{totalCount}</span> result(s)
            </div>
            {effectiveQuery && (
              <div className="text-xs text-muted-foreground mt-1">
                Showing results for: <span className="font-medium text-foreground">{effectiveQuery}</span>
              </div>
            )}
            {highPagination && (
              <div className="text-xs text-muted-foreground mt-1">
                High Court index: page {highPagination.currentPage} of {highPagination.totalPages} ({highPagination.totalRecords} total records)
              </div>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="supreme" disabled={(supremeResults.length === 0 || !!supremeError) && highAsSupreme.length > 0}>
              Supreme Court ({supremeResults.length})
            </TabsTrigger>
            <TabsTrigger value="high" disabled={highTotalRecords === 0 && supremeResults.length > 0}>
              High Court ({highTotalRecords})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="supreme">
            {supremeResults.length > 0 ? (
              <div className="space-y-3 max-h-[calc(100vh-6rem)] overflow-auto pr-2">
                  {supremeResults.map((item) => {
                    const row = toRow(item);
                    return (
                      <Card key={`${row.index}-${row.caseNo}-${row.title}`}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-semibold">
                            {row.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center gap-2 mb-2">
                            {row.court && row.court !== '-' && (
                              <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded">{row.court}</span>
                            )}
                            {row.date && row.date !== '-' && (
                              <span className="text-[10px] text-muted-foreground">• {row.date}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {row.caseNo && row.caseNo !== '-' && (
                              <span className="text-[10px] bg-muted text-foreground px-2 py-1 rounded">Case No: {row.caseNo}</span>
                            )}
                            {row.cnr && row.cnr !== '-' && (
                              <span className="text-[10px] bg-muted text-foreground px-2 py-1 rounded">CNR: {row.cnr}</span>
                            )}
                            {row.disposalNature && row.disposalNature !== '-' && (
                              <span className="text-[10px] bg-muted text-foreground px-2 py-1 rounded">Disposal: {row.disposalNature}</span>
                            )}
                          </div>
                          {/* Full details inline */}
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div><span className="font-medium text-foreground">SCR Citation:</span> {row.scr}</div>
                            <div><span className="font-medium text-foreground">Neutral Citation:</span> {row.neutral}</div>
                            <div><span className="font-medium text-foreground">Bench Size:</span> {row.bench}</div>
                            <div><span className="font-medium text-foreground">Author Judge:</span> {row.author}</div>
                            <div className="sm:col-span-2"><span className="font-medium text-foreground">Judges:</span> {row.judges}</div>
                          </div>
                          {row.highlights && row.highlights !== '-' && (
                            <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                              {row.highlights}
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="pt-0 flex gap-2 items-center">
                          <Button disabled title="Coming soon" className="bg-foreground text-background hover:bg-foreground/90">
                            <span>Summarize</span>
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-600">soon</span>
                          </Button>
                          <Button disabled title="Coming soon" className="bg-foreground text-background hover:bg-foreground/90">
                            <span>Chat with AI</span>
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-600">soon</span>
                          </Button>
                          <Button disabled title="Coming soon" className="bg-foreground text-background hover:bg-foreground/90">
                            <span>PDF</span>
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-600">soon</span>
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">{isLoading ? "Loading results..." : "No results yet. Try a search."}</div>
            )}
          </TabsContent>

          <TabsContent value="high">
            {highAsSupreme.length > 0 ? (
              <div className="space-y-3 max-h-[calc(100vh-6rem)] overflow-auto pr-2">
                  {highAsSupreme.map((item) => {
                    const row = toRow(item);
                    return (
                      <Card key={`${row.index}-${row.caseNo}-${row.title}`}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-semibold">
                            {row.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center gap-2 mb-2">
                            {row.court && row.court !== '-' && (
                              <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded">{row.court}</span>
                            )}
                            {row.date && row.date !== '-' && (
                              <span className="text-[10px] text-muted-foreground">• {row.date}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {row.caseNo && row.caseNo !== '-' && (
                              <span className="text-[10px] bg-muted text-foreground px-2 py-1 rounded">Case No: {row.caseNo}</span>
                            )}
                            {row.cnr && row.cnr !== '-' && (
                              <span className="text-[10px] bg-muted text-foreground px-2 py-1 rounded">CNR: {row.cnr}</span>
                            )}
                            {row.disposalNature && row.disposalNature !== '-' && (
                              <span className="text-[10px] bg-muted text-foreground px-2 py-1 rounded">Disposal: {row.disposalNature}</span>
                            )}
                          </div>
                          {/* Full details inline */}
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div><span className="font-medium text-foreground">SCR Citation:</span> {row.scr}</div>
                            <div><span className="font-medium text-foreground">Neutral Citation:</span> {row.neutral}</div>
                            <div><span className="font-medium text-foreground">Bench Size:</span> {row.bench}</div>
                            <div><span className="font-medium text-foreground">Author Judge:</span> {row.author}</div>
                            <div className="sm:col-span-2"><span className="font-medium text-foreground">Judges:</span> {row.judges}</div>
                          </div>
                          {row.highlights && row.highlights !== '-' && (
                            <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                              {row.highlights}
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="pt-0 flex gap-2 items-center">
                          <Button disabled title="Coming soon" className="bg-foreground text-background hover:bg-foreground/90">
                            <span>Summarize With AI</span>
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-600">soon</span>
                          </Button>
                          <Button disabled title="Coming soon" className="bg-foreground text-background hover:bg-foreground/90">
                            <span>Chat with AI</span>
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-600">soon</span>
                          </Button>
                          <Button disabled title="Coming soon" className="bg-foreground text-background hover:bg-foreground/90">
                            <span>PDF</span>
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-600">soon</span>
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                  {canPaginate && (
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        Page {highPagination?.currentPage} of {highPagination?.totalPages}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageStep("prev")}
                          disabled={isFirstPage || isLoading}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageStep("next")}
                          disabled={isLastPage || isLoading}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">{isLoading ? "Loading results..." : "No results yet. Try a search."}</div>
            )}
          </TabsContent>
          </Tabs>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-6">
            <Image src="/logo.png" alt="Infrahive" width={72} height={72} />
            {submittedQuery ? (
              <div className="text-sm text-muted-foreground">No results found for your query.</div>
            ) : (
              <div className="text-sm text-muted-foreground">Discover legal insights with Infrahive</div>
            )}
            <div className="w-full max-w-3xl">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Try a sample prompt</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid gap-2 sm:grid-cols-1">
                    {samplePrompts.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setQuery(p);
                          if (inputRef.current) inputRef.current.focus();
                        }}
                        className="w-full text-left text-sm px-3 py-2 rounded border bg-card hover:bg-accent hover:text-accent-foreground transition"
                        aria-label={`Use sample prompt ${i + 1}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        </div>
      )}
    </div>
  );
}


