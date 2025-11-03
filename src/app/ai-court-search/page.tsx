"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  const highAsSupreme: SupremeCourtItem[] = (highRaw ?? []).map((h, i) => {
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
            placeholder="e.g. Find me court cases having phrase 'release on probation under Section 4 of the Probation of Offenders Act' from 2023"
          />
          <Button onClick={handleSearch} disabled={isLoading || !query.trim()}>
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>
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
        <div className="p-4 overflow-auto">
        {/* Only show tables when we actually have results */}
        {(supremeResults.length > 0 || highAsSupreme.length > 0) ? (
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
            <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead className="min-w-[250px]">Case Title</TableHead>
              <TableHead className="min-w-[180px]">Court</TableHead>
              <TableHead className="min-w-[180px]">SCR Citation</TableHead>
              <TableHead className="min-w-[180px]">Neutral Citation</TableHead>
              <TableHead className="min-w-[120px]">Decision Date</TableHead>
              <TableHead className="min-w-[180px]">Case Number</TableHead>
              <TableHead className="min-w-[100px]">Bench Size</TableHead>
              <TableHead className="min-w-[160px]">Disposal Nature</TableHead>
              <TableHead className="min-w-[250px]">Judges</TableHead>
              <TableHead className="min-w-[180px]">Author Judge</TableHead>
              <TableHead className="min-w-[160px]">CNR</TableHead>
              <TableHead className="min-w-[350px]">Highlights</TableHead>
              <TableHead className="w-32">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hasResults ? (
              pagedRows.map((row) => (
                <TableRow key={row.index}>
                  <TableCell className="align-top">{row.index}</TableCell>
                  <TableCell className="font-medium max-w-[300px] whitespace-normal break-words align-top">
                    {row.title}
                  </TableCell>
                  <TableCell className="whitespace-normal break-words align-top">
                    {row.court}
                  </TableCell>
                  <TableCell className="whitespace-normal break-words align-top">
                    {row.scr}
                  </TableCell>
                  <TableCell className="whitespace-normal break-words align-top">
                    {row.neutral}
                  </TableCell>
                  <TableCell className="whitespace-nowrap align-top">{row.date}</TableCell>
                  <TableCell className="text-sm max-w-[200px] whitespace-normal break-words align-top">
                    {row.caseNo}
                  </TableCell>
                  <TableCell className="align-top">{row.bench}</TableCell>
                  <TableCell className="align-top">{row.disposalNature}</TableCell>
                  <TableCell className="text-xs max-w-[300px] whitespace-normal break-words align-top">
                    {row.judges}
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] whitespace-normal break-words align-top">
                    {row.author}
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] whitespace-normal break-words align-top">
                    {row.cnr}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[400px] whitespace-normal break-words align-top">
                    {row.highlights}
                  </TableCell>
                  <TableCell className="align-top">
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
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="py-10 text-center" colSpan={14}>
                  {isLoading ? "Loading results..." : "No results yet. Try a search."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableCaption>
            {hasResults ? `${results.length} result(s) from Supreme Court` : ""}
          </TableCaption>
        </Table>
        {hasResults && (
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
        )}
          </TabsContent>

          <TabsContent value="high">
            <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead className="min-w-[250px]">Case Title</TableHead>
              <TableHead className="min-w-[180px]">Court</TableHead>
              <TableHead className="min-w-[180px]">SCR Citation</TableHead>
              <TableHead className="min-w-[180px]">Neutral Citation</TableHead>
              <TableHead className="min-w-[120px]">Decision Date</TableHead>
              <TableHead className="min-w-[180px]">Case Number</TableHead>
              <TableHead className="min-w-[100px]">Bench Size</TableHead>
              <TableHead className="min-w-[160px]">Disposal Nature</TableHead>
              <TableHead className="min-w-[250px]">Judges</TableHead>
              <TableHead className="min-w-[180px]">Author Judge</TableHead>
              <TableHead className="min-w-[160px]">CNR</TableHead>
              <TableHead className="min-w-[350px]">Highlights</TableHead>
              <TableHead className="w-32">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hasResults ? (
              pagedRows.map((row) => (
                <TableRow key={row.index}>
                  <TableCell className="align-top">{row.index}</TableCell>
                  <TableCell className="font-medium max-w-[300px] whitespace-normal break-words align-top">
                    {row.title}
                  </TableCell>
                  <TableCell className="whitespace-normal break-words align-top">
                    {row.court}
                  </TableCell>
                  <TableCell className="whitespace-normal break-words align-top">
                    {row.scr}
                  </TableCell>
                  <TableCell className="whitespace-normal break-words align-top">
                    {row.neutral}
                  </TableCell>
                  <TableCell className="whitespace-nowrap align-top">{row.date}</TableCell>
                  <TableCell className="text-sm max-w-[200px] whitespace-normal break-words align-top">
                    {row.caseNo}
                  </TableCell>
                  <TableCell className="align-top">{row.bench}</TableCell>
                  <TableCell className="align-top">{row.disposalNature}</TableCell>
                  <TableCell className="text-xs max-w-[300px] whitespace-normal break-words align-top">
                    {row.judges}
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] whitespace-normal break-words align-top">
                    {row.author}
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] whitespace-normal break-words align-top">
                    {row.cnr}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[400px] whitespace-normal break-words align-top">
                    {row.highlights}
                  </TableCell>
                  <TableCell className="align-top">-</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="py-10 text-center" colSpan={14}>
                  {isLoading ? "Loading results..." : "No results yet. Try a search."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableCaption>
            {hasResults ? `${results.length} result(s) from High Court` : ""}
          </TableCaption>
        </Table>
        {hasResults && (
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
        )}
          </TabsContent>
          </Tabs>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Image src="/logo.png" alt="Infrahive" width={72} height={72} />
            {submittedQuery ? (
              <div className="text-sm text-muted-foreground">No results found for your query.</div>
            ) : (
              <div className="text-sm text-muted-foreground">Discover legal insights with Infrahive</div>
            )}
          </div>
        )}
        </div>
      )}
    </div>
  );
}


