"use client";

import React, { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Pagination from "@/app/research/components/common/Pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default function AICourtSearchPage() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);
  const { data, isLoading, isError, error } = useAICourtSearch(submittedQuery);
  const [activeTab, setActiveTab] = useState<"supreme" | "high">("supreme");
  const [selectedCase, setSelectedCase] = useState<SupremeCourtItem | null>(null);
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
  const highArray = Array.isArray(highRaw) ? highRaw : [];
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
  const results: SupremeCourtItem[] =
    activeTab === "supreme" ? supremeResults : highAsSupreme;
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const hasResults = results && results.length > 0;

  const handleSearch = () => {
    setSubmittedQuery(query.trim());
  };

  const tableRows = useMemo(() => {
    return results.map((item) => {
      const title = item.case_title?.full_title || "-";
      const scr = item.citation?.scr_citation || "-";
      const neutral = item.citation?.neutral_citation || "-";
      const date = item.case_details?.decision_date || "-";
      const caseNo = item.case_details?.case_number || "-";
      const bench = item.case_details?.bench_size || "-";
      const disposalNature = item.case_details?.disposal_nature || "-";
      const judges = (item.bench?.judges || []).join(", ") || "-";
      const author = item.bench?.author_judge || "-";
      const cnr = item.cnr || "-";
      const highlights = (item.highlights && item.highlights.length > 0)
        ? item.highlights.join(" | ")
        : "-";
      const pdfParams = item.pdf_params;
      const court = item.court || "-";
      return {
        index: item.index,
        title,
        scr,
        neutral,
        date,
        caseNo,
        bench,
        disposalNature,
        judges,
        author,
        cnr,
        highlights,
        pdfParams,
        court,
      };
    });
  }, [results]);

  // Reset pagination when results change
  React.useEffect(() => {
    setPage(1);
  }, [results.length, activeTab]);

  const total = tableRows.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pagedRows = tableRows.slice(start, end);
  const pagedItems = results.slice(start, end);

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
        {/* sample prompts moved to empty state below for better UX */}
        {isError && (
          <div className="text-sm text-destructive">{(error as any)?.message || "Something went wrong"}</div>
        )}
        {!isError && supremeError && activeTab === "supreme" && (
          <div className="text-sm text-destructive">Supreme Court: {supremeError}</div>
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
          {/* Results summary and quick preview */}
          <div className="mb-4">
            <div className="text-sm text-muted-foreground">
              Found <span className="font-medium text-foreground">
                {activeTab === "supreme" ? supremeResults.length : highAsSupreme.length}
              </span> result(s)
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="supreme" disabled={(supremeResults.length === 0 || !!supremeError) && highAsSupreme.length > 0}>
              Supreme Court ({supremeResults.length})
            </TabsTrigger>
            <TabsTrigger value="high" disabled={highAsSupreme.length === 0 && supremeResults.length > 0}>
              High Court ({highAsSupreme.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="supreme">
            {hasResults ? (
              <div className="flex gap-4 items-start">
                <div className="flex-1 space-y-3 max-h-[calc(100vh-6rem)] overflow-auto pr-2">
                  {pagedItems.map((item, idx) => {
                    const row = pagedRows[idx];
                    return (
                      <Card key={row.index}>
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
                          {row.highlights && row.highlights !== '-' && (
                            <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                              {row.highlights}
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="pt-0 flex gap-2">
                          <Button size="sm" onClick={() => setSelectedCase(item)}>Summarize this case</Button>
                          {row.pdfParams ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (!row.pdfParams) return;
                                const url = `https://main.sci.gov.in/pdf/${row.pdfParams.court_code}/${row.pdfParams.year}/${row.pdfParams.case_id}/${row.pdfParams.citation_code}/${row.pdfParams.flag}`;
                                window.open(url, "_blank");
                              }}
                            >
                              View PDF
                            </Button>
                          ) : null}
                        </CardFooter>
                      </Card>
                    );
                  })}
                  <div className="mt-4">
                    <Pagination
                      page={page}
                      pageSize={pageSize}
                      total={total}
                      onPageChange={setPage}
                      onPageSizeChange={(n: number) => {
                        setPageSize(n);
                        setPage(1);
                      }}
                      pageSizeOptions={[10, 20, 50]}
                    />
                  </div>
                </div>
                {selectedCase && (
                  <div className="w-[420px] shrink-0 sticky top-20 max-h-[calc(100vh-6rem)] overflow-auto border rounded-md p-4 bg-card">
                    <div className="text-sm font-semibold mb-1">Summary</div>
                    <div className="text-base font-medium mb-2">{selectedCase.case_title?.full_title || '-'}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                      <div><span className="font-medium text-foreground">Court:</span> {selectedCase.court || '-'}</div>
                      <div><span className="font-medium text-foreground">Date:</span> {selectedCase.case_details?.decision_date || '-'}</div>
                      <div><span className="font-medium text-foreground">Case No:</span> {selectedCase.case_details?.case_number || '-'}</div>
                      <div><span className="font-medium text-foreground">CNR:</span> {selectedCase.cnr || '-'}</div>
                      <div><span className="font-medium text-foreground">SCR Citation:</span> {selectedCase.citation?.scr_citation || '-'}</div>
                      <div><span className="font-medium text-foreground">Neutral Citation:</span> {selectedCase.citation?.neutral_citation || '-'}</div>
                      <div><span className="font-medium text-foreground">Bench Size:</span> {selectedCase.case_details?.bench_size || '-'}</div>
                      <div><span className="font-medium text-foreground">Author Judge:</span> {selectedCase.bench?.author_judge || '-'}</div>
                    </div>
                    <div className="mb-3">
                      <div className="text-sm font-medium">Judges</div>
                      <div className="text-sm text-muted-foreground mt-1">{(selectedCase.bench?.judges || []).join(', ') || '-'}</div>
                    </div>
                    <div className="mb-3">
                      <div className="text-sm font-medium">Disposal / Verdict</div>
                      <div className="text-sm text-muted-foreground mt-1">{selectedCase.case_details?.disposal_nature || '-'}</div>
                    </div>
                    {selectedCase.highlights && selectedCase.highlights.length > 0 && (
                      <div className="mb-3">
                        <div className="text-sm font-medium">Relevance</div>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{selectedCase.highlights.join("\n\n")}</div>
                      </div>
                    )}
                    {selectedCase.pdf_params && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const p = selectedCase.pdf_params;
                          if (!p) return;
                          const url = `https://main.sci.gov.in/pdf/${p.court_code}/${p.year}/${p.case_id}/${p.citation_code}/${p.flag}`;
                          window.open(url, "_blank");
                        }}
                      >
                        View PDF
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">{isLoading ? "Loading results..." : "No results yet. Try a search."}</div>
            )}
          </TabsContent>

          <TabsContent value="high">
            {hasResults ? (
              <div className="flex gap-4 items-start">
                <div className="flex-1 space-y-3 max-h-[calc(100vh-6rem)] overflow-auto pr-2">
                  {pagedItems.map((item, idx) => {
                    const row = pagedRows[idx];
                    return (
                      <Card key={row.index}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-semibold">
                            {row.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex flex-wrap gap-2">
                            {row.caseNo && row.caseNo !== '-' && (
                              <span className="text-[10px] bg-muted text-foreground px-2 py-1 rounded">Case No: {row.caseNo}</span>
                            )}
                            {row.court && row.court !== '-' && (
                              <span className="text-[10px] bg-muted text-foreground px-2 py-1 rounded">Court: {row.court}</span>
                            )}
                            {row.date && row.date !== '-' && (
                              <span className="text-[10px] bg-muted text-foreground px-2 py-1 rounded">Date: {row.date}</span>
                            )}
                            {row.cnr && row.cnr !== '-' && (
                              <span className="text-[10px] bg-muted text-foreground px-2 py-1 rounded">CNR: {row.cnr}</span>
                            )}
                            {row.disposalNature && row.disposalNature !== '-' && (
                              <span className="text-[10px] bg-muted text-foreground px-2 py-1 rounded">Disposal: {row.disposalNature}</span>
                            )}
                          </div>
                          {row.highlights && row.highlights !== '-' && (
                            <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                              {row.highlights}
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="pt-0 flex gap-2">
                          <Button size="sm" onClick={() => setSelectedCase(item)}>Summarize this case</Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                  <div className="mt-4">
                    <Pagination
                      page={page}
                      pageSize={pageSize}
                      total={total}
                      onPageChange={setPage}
                      onPageSizeChange={(n: number) => {
                        setPageSize(n);
                        setPage(1);
                      }}
                      pageSizeOptions={[10, 20, 50]}
                    />
                  </div>
                </div>
                {selectedCase && (
                  <div className="w-[420px] shrink-0 sticky top-20 max-h-[calc(100vh-6rem)] overflow-auto border rounded-md p-4 bg-card">
                    <div className="text-sm font-semibold mb-1">Summary</div>
                    <div className="text-base font-medium mb-1">{selectedCase.case_title?.full_title || '-'}</div>
                    <div className="text-xs text-muted-foreground mb-3">
                      {(selectedCase.court || '-')}{selectedCase.case_details?.decision_date ? ` • ${selectedCase.case_details.decision_date}` : ''}
                    </div>
                    {selectedCase.highlights && selectedCase.highlights.length > 0 && (
                      <div className="mb-3">
                        <div className="text-sm font-medium">Relevance</div>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">
                          {selectedCase.highlights.join("\n\n")}
                        </div>
                      </div>
                    )}
                    <div className="mb-3">
                      <div className="text-sm font-medium">Verdict</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {selectedCase.case_details?.disposal_nature || '-'}
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="text-sm font-medium">Fact</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Case No: {selectedCase.case_details?.case_number || '-'}
                        <br />Bench Size: {selectedCase.case_details?.bench_size || '-'}
                        <br />Judges: {(selectedCase.bench?.judges || []).join(', ') || '-'}
                        <br />Author Judge: {selectedCase.bench?.author_judge || '-'}
                        <br />CNR: {selectedCase.cnr || '-'}
                      </div>
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


