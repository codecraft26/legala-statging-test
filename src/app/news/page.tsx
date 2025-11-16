"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
// Removed ScrollArea for results to ensure pagination remains visible below the list
import { Input } from "@/components/ui/input";
import { Newspaper, ExternalLink, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import Pagination from "@/app/research/components/common/Pagination";
import UpdatesPanel from "@/components/news/updates-panel";
import { useRBIRepo, useRBIUpdates, type RBICategory } from "@/hooks/use-rbi";

// Dummy news removed

export default function NewsPage() {
  const [activeSection, setActiveSection] = React.useState<string>("RBI");
  const [rbiOpen, setRbiOpen] = React.useState<boolean>(true);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(true);
  const [updatesOpen, setUpdatesOpen] = React.useState<boolean>(false);

  // Only RBI remains in sidebar; other regulators selectable from RBI dropdown
  const sectionOptions = ["RBI"] as const;

  React.useEffect(() => {
    setLoading(false);
  }, []);

  // RBI categories tabs
  const rbiCategories: RBICategory[] = [
    "Financial Market",
    "Foreign Exchange Management",
    "Commercial Banking",
    "Financial Inclusion and Development",
    "Banker and Debt Manager to Government",
    "Co-operative Banking",
    "Consumer Education and Protection",
    "Issuer of Currency",
    "Non-banking",
    "Payment and Settlement System",
    "ALL",
  ];
  const [rbiCategory, setRbiCategory] = React.useState<RBICategory>(
    "Banker and Debt Manager to Government"
  );
  const rbiQuery = useRBIRepo(rbiCategory);
  const updatesQuery = useRBIUpdates();
  React.useEffect(() => {
    setPage(1);
  }, [rbiCategory]);

  const filteredItems: any[] = [];

  // pagination state
  const [page, setPage] = React.useState<number>(1);
  const [pageSize, setPageSize] = React.useState<number>(10);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  React.useEffect(() => {
    // reset page to 1 when section or search changes
    setPage(1);
  }, [activeSection, searchQuery]);

  const pageItems: any[] = [];

  // RBI filtered + paginated items (search-aware)
  const rbiItems = React.useMemo(() => {
    const raw = Array.isArray((rbiQuery as any)?.data?.data)
      ? ((rbiQuery as any).data.data as any[])
      : [];
    if (!searchQuery) return raw;
    const q = searchQuery.toLowerCase();
    return raw.filter((n) => String(n.title || "").toLowerCase().includes(q));
  }, [rbiQuery, searchQuery]);

  const rbiPageItems = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return rbiItems.slice(start, end);
  }, [rbiItems, page, pageSize]);

  // Clamp current page when total changes (switching categories/sections)
  const effectiveTotal = rbiItems.length;
  const effectiveTotalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize));
  React.useEffect(() => {
    if (page > effectiveTotalPages) {
      setPage(1);
    }
  }, [page, effectiveTotal, effectiveTotalPages, pageSize, activeSection, rbiCategory]);

  return (
    <main className="py-6">
      <div className="flex gap-4">
        {/* Page-level news sidebar mimicking old UI */}
        <aside className="hidden lg:block w-44 bg-white border rounded-md shrink-0 sticky top-0 h-svh flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <span className="font-semibold">News Hub</span>
          </div>

          {/* Home button removed as requested */}

          <div className="py-2 flex-1 overflow-y-auto">
            {sectionOptions.map((s) => (
              <div key={s}>
                <button
                  onClick={() => {
                    if (s === "RBI") {
                      if (activeSection === "RBI") {
                        setRbiOpen((v) => !v);
                      } else {
                        setActiveSection("RBI");
                        setRbiOpen(true);
                      }
                    } else {
                      setActiveSection(s);
                    }
                  }}
                  className={`w-full text-left py-3 px-4 text-sm font-medium transition-colors flex items-center justify-between ${
                    activeSection === s
                      ? "bg-zinc-100 border-l-4 border-blue-900"
                      : "hover:bg-zinc-100"
                  }`}
                >
                  <span>{s}</span>
                  {s === "RBI" && (
                    rbiOpen ? (
                      <ChevronDown className="h-4 w-4 opacity-70" />
                    ) : (
                      <ChevronRight className="h-4 w-4 opacity-70" />
                    )
                  )}
                </button>

                {/* RBI categories rendered hierarchically under RBI */}
                {s === "RBI" && activeSection === "RBI" && rbiOpen && (
                  <div className="pl-3 pr-2 pb-2">
                    <div className="space-y-1">
                      {rbiCategories.map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setRbiCategory(c);
                            setPage(1);
                          }}
                          className={`w-full text-left rounded-md px-3 py-2 text-xs transition-colors ${
                            rbiCategory === c
                              ? "bg-zinc-100 text-foreground"
                              : "hover:bg-zinc-100 text-muted-foreground"
                          }`}
                          title={c}
                        >
                          {c === "ALL" ? "ALL (All in one)" : c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-muted-foreground" /> Legal News
            </h1>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-black text-white hover:bg-black/90 border border-black"
                onClick={() => {
                  setUpdatesOpen(true);
                  updatesQuery.refetch();
                }}
              >
                Updates
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => rbiQuery.refetch()}
              >
                Refresh
              </Button>
            </div>
          </div>

          <UpdatesPanel open={updatesOpen} onClose={() => setUpdatesOpen(false)} isLoading={updatesQuery.isLoading} data={updatesQuery.data} />

          {/* Search bar */}
          <div>
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category dropdown removed as requested */}

          <Card className="border">
            <CardHeader>
              <CardTitle>{activeSection} Notifications</CardTitle>
              <CardDescription>Curated updates and circulars</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              {rbiQuery.isLoading ? (
                <div className="p-8 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Loading notifications…</span>
                  </div>
                </div>
              ) : rbiItems.length > 0 ? (
                <div>
                  <ul className="divide-y">
                    {rbiPageItems.map((n: any, idx: number) => (
                      <li key={idx} className="p-4">
                        <div className="p-4 bg-accent/30 rounded-lg border-l-4 border-black">
                          <h3 className="text-base font-semibold mb-2">{n.title}</h3>
                          <div className="flex flex-wrap gap-3 mb-3">
                            {n.pdf_link && (
                              <a
                                href={n.pdf_link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary underline inline-flex items-center gap-1"
                              >
                                PDF <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground text-xs">{n.date}</span>
                            <span className="text-white text-xs px-2 py-1 rounded bg-black">
                              {n.category || "RBI"}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="p-6 text-sm text-muted-foreground">No notifications available.</div>
              )}
            </CardContent>
          </Card>

          {/* pagination controls */}
          <Pagination
            page={page}
            pageSize={pageSize}
            total={rbiItems.length}
            onPageChange={setPage}
            onPageSizeChange={(n: number) => {
              setPageSize(n);
              setPage(1);
            }}
            pageSizeOptions={[10, 20, 50]}
          />
        </div>
      </div>
    </main>
  );
}


