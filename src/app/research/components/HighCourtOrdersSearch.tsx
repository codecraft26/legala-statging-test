"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useHCDelhiJudgements } from "@/hooks/use-research";
import type { HCDelhiJudgementRequest } from "@/lib/research-client";

export default function HighCourtOrdersSearch() {
  const [form, setForm] = useState({
    party_name: "",
    year: "",
    from_date: "",
    to_date: "",
  });
  const [searchParams, setSearchParams] =
    useState<HCDelhiJudgementRequest | null>(null);
  const query = useHCDelhiJudgements(searchParams);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.party_name.trim()) return;

    setSearchParams({
      party_name: form.party_name.trim(),
      from_date: form.from_date || "",
      to_date: form.to_date || "",
      year: form.year ? Number(form.year) : undefined,
    });
  };

  const results = query.data?.judgements ?? [];

  return (
    <div className="space-y-6">
      <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
        <AlertDescription className="font-medium">
          Only for Delhi High Court - Beta
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Search Delhi High Court Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="grid gap-4 md:grid-cols-2"
            autoComplete="off"
          >
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="party_name">Party Name</Label>
              <Input
                id="party_name"
                placeholder="e.g. Arjun"
                value={form.party_name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, party_name: event.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="year">Year (optional)</Label>
              <Input
                id="year"
                type="number"
                min="1900"
                max="2100"
                placeholder="2025"
                value={form.year}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, year: event.target.value }))
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="from_date">From Date (optional)</Label>
              <Input
                id="from_date"
                type="date"
                value={form.from_date}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, from_date: event.target.value }))
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="to_date">To Date (optional)</Label>
              <Input
                id="to_date"
                type="date"
                value={form.to_date}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, to_date: event.target.value }))
                }
              />
            </div>

            <div className="md:col-span-2">
              <Button
                type="submit"
                disabled={query.isFetching}
                className="w-full md:w-auto"
              >
                {query.isFetching ? "Searching…" : "Search Orders"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          {searchParams == null ? (
            <p className="text-sm text-muted-foreground">
              Enter a party name and click search to view Delhi High Court
              orders.
            </p>
          ) : query.isLoading ? (
            <p className="text-sm text-muted-foreground">Fetching orders…</p>
          ) : query.error ? (
            <p className="text-sm text-red-600 dark:text-red-400">
              {(query.error as Error).message || "Unable to fetch orders."}
            </p>
          ) : results.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No orders found for the provided criteria.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-zinc-800">
                <thead className="bg-gray-50 dark:bg-zinc-900">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">
                      Case No.
                    </th>
                    <th className="px-3 py-2 text-left font-semibold">
                      Citation
                    </th>
                    <th className="px-3 py-2 text-left font-semibold">Date</th>
                    <th className="px-3 py-2 text-left font-semibold">
                      Parties
                    </th>
                    <th className="px-3 py-2 text-left font-semibold">
                      Links
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {results.map((item) => (
                    <tr key={`${item.case_no}-${item.judgement_date}`}>
                      <td className="px-3 py-2 font-medium">{item.case_no}</td>
                      <td className="px-3 py-2">
                        {item.neutral_citation || "-"}
                      </td>
                      <td className="px-3 py-2">
                        {item.judgement_date || "-"}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col">
                          <span className="font-semibold">
                            {item.petitioner}
                          </span>
                          <span className="text-muted-foreground">
                            vs {item.respondent}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 space-x-3">
                        <a
                          href={item.pdf_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          PDF
                        </a>
                        <a
                          href={item.txt_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          TXT
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

