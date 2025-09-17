"use client";

import React, { useMemo } from "react";

export default function NewsPage() {
  const items = useMemo(
    () => [
      {
        id: "n1",
        title: "Supreme Court clarifies scope of arbitration clauses",
        summary:
          "The Court reiterated that arbitration agreements must be construed broadly, reinforcing party autonomy while outlining exceptions.",
        source: "Supreme Court Observer",
        date: new Date().toISOString(),
        tags: ["Arbitration", "Contract", "Procedure"],
        url: "#",
      },
      {
        id: "n2",
        title: "SEBI issues new disclosure norms for listed entities",
        summary:
          "SEBI tightened timelines and expanded material event categories to improve transparency and investor protection.",
        source: "SEBI Bulletin",
        date: new Date(Date.now() - 86400000).toISOString(),
        tags: ["Securities", "Compliance"],
        url: "#",
      },
      {
        id: "n3",
        title: "High Court on enforceability of non-compete clauses",
        summary:
          "The Court emphasized reasonableness and public policy, striking down overly broad post-employment restraints.",
        source: "Bar & Bench",
        date: new Date(Date.now() - 2 * 86400000).toISOString(),
        tags: ["Employment", "Contracts"],
        url: "#",
      },
      {
        id: "n4",
        title: "DPDP Rules draft released for consultation",
        summary:
          "The government published draft rules under the Digital Personal Data Protection Act focusing on consent and cross-border flows.",
        source: "MeitY",
        date: new Date(Date.now() - 3 * 86400000).toISOString(),
        tags: ["Privacy", "Technology", "Regulatory"],
        url: "#",
      },
      {
        id: "n5",
        title: "IBC amendment bill proposes fast-track approvals",
        summary:
          "Proposed changes aim to streamline resolution timelines and introduce clarity on treatment of operational creditors.",
        source: "MCA Update",
        date: new Date(Date.now() - 4 * 86400000).toISOString(),
        tags: ["Insolvency", "Bankruptcy"],
        url: "#",
      },
      {
        id: "n6",
        title: "Competition Commission issues guidance on dark patterns",
        summary:
          "Advisory highlights manipulative UI practices and sets expectations for consumer-facing digital platforms.",
        source: "CCI Advisory",
        date: new Date(Date.now() - 5 * 86400000).toISOString(),
        tags: ["Antitrust", "Consumer", "Digital Markets"],
        url: "#",
      },
    ],
    []
  );

  return (
    <main className="max-w-5xl mx-auto p-8 space-y-6">
      <header className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Legal News</h1>
        <div className="text-xs text-muted-foreground">Mock feed for demo</div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((n) => (
          <article
            key={n.id}
            className="relative overflow-hidden rounded-lg border p-5"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <h2
                  className="text-base font-semibold truncate"
                  title={n.title}
                >
                  {n.title}
                </h2>
                <div className="text-xs text-muted-foreground mt-0.5">
                  <span>{n.source}</span>
                  <span className="mx-1">•</span>
                  <time dateTime={n.date}>
                    {new Date(n.date).toLocaleDateString()}
                  </time>
                </div>
              </div>
              <a
                href={n.url}
                className="text-xs rounded-md border px-2 py-1 hover:bg-accent whitespace-nowrap"
              >
                Read
              </a>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {n.summary}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {n.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900/40 text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
