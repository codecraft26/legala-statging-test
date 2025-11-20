"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useHCDelhiJudgements } from "@/hooks/use-research";
import type {
  HCDelhiJudgement,
  HCDelhiJudgementRequest,
} from "@/lib/research-client";
import { getCookie } from "@/lib/utils";
import {
  useCreateAssistantChat,
  useUploadAssistantFiles,
  type AssistantChat,
  useFindChatByFileName,
} from "@/hooks/use-assistant";
import { useToast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";
import { SidebarChatPanel } from "./SidebarChatPanel";

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
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const uploadMutation = useUploadAssistantFiles();
  const createChatMutation = useCreateAssistantChat();
  const findChatByFileName = useFindChatByFileName(workspaceId);
  const [chattingCaseKey, setChattingCaseKey] = useState<string | null>(null);
  const { showToast } = useToast();
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);
  const [sidebarChat, setSidebarChat] = useState<AssistantChat | null>(null);
  const [sidebarCaseMeta, setSidebarCaseMeta] = useState<{
    title: string;
    parties?: string;
    date?: string;
  } | null>(null);
  const [sidebarError, setSidebarError] = useState<string | null>(null);
  const [isPreparingSidebarChat, setIsPreparingSidebarChat] = useState(false);

  useEffect(() => {
    setWorkspaceId(getCookie("workspaceId"));
  }, []);

  const closeSidebar = () => {
    setIsChatSidebarOpen(false);
    setSidebarChat(null);
    setSidebarCaseMeta(null);
    setSidebarError(null);
  };

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

  const isGlobalChatting = useMemo(
    () =>
      uploadMutation.isPending ||
      createChatMutation.isPending ||
      isPreparingSidebarChat,
    [uploadMutation.isPending, createChatMutation.isPending, isPreparingSidebarChat]
  );

  const getRowKey = (item: HCDelhiJudgement) =>
    `${item.case_no || item.s_no}-${item.judgement_date || ""}`;

  const normalizeChatResponse = (response: unknown): AssistantChat | null => {
    if (!response || typeof response !== "object") return null;
    if ("data" in response && response.data && typeof response.data === "object") {
      const data = (response as { data: unknown }).data as AssistantChat;
      if (data?.id) return data;
    }
    if ("id" in response) {
      return response as AssistantChat;
    }
    return null;
  };

  const handleChatWithAI = async (item: HCDelhiJudgement) => {
    if (!workspaceId) {
      showToast("Select a workspace before chatting with AI.", "error");
      return;
    }

    const rowKey = getRowKey(item);
    const caseTitle =
      item.case_no ||
      item.neutral_citation ||
      [item.petitioner, item.respondent].filter(Boolean).join(" vs ") ||
      "Delhi HC Order";
    const partiesLabel =
      item.petitioner && item.respondent
        ? `${item.petitioner} vs ${item.respondent}`
        : item.petitioner || item.respondent || undefined;

    try {
      const sanitizedName =
        (item.case_no || item.neutral_citation || "delhi-hc-order").replace(/[^\w.-]+/g, "_").slice(0, 80) + ".txt";

      const { chat: existingChat, fileId: existingFileId } = await findChatByFileName(sanitizedName);

      if (existingChat) {
        setSidebarChat(existingChat);
        setIsChatSidebarOpen(true);
        setSidebarCaseMeta({
          title: caseTitle,
          parties: partiesLabel || undefined,
          date: item.judgement_date || undefined,
        });
        setSidebarError(null);
        setIsPreparingSidebarChat(false);
        showToast("Reopened existing chat.", "success");
        return;
      }

      setChattingCaseKey(rowKey);
      setIsChatSidebarOpen(true);
      setSidebarChat(null);
      setSidebarError(null);
      setSidebarCaseMeta({
        title: caseTitle,
        parties: partiesLabel || undefined,
        date: item.judgement_date || undefined,
      });
      setIsPreparingSidebarChat(true);

      let fileIdToUse = existingFileId;

      if (!fileIdToUse) {
        const proxyResponse = await fetch("/api/proxy-txt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: item.txt_link }),
        });

        if (!proxyResponse.ok) {
          const errorJson = await proxyResponse.json().catch(() => null);
          throw new Error(errorJson?.error || "Unable to download judgment text file. Please try again.");
        }

        const payload = (await proxyResponse.json()) as { text?: string };
        const normalizedText = payload?.text || "No content found in judgment TXT.";

        const file = new File([normalizedText], sanitizedName, {
          type: "text/plain",
        });

        const uploaded = await uploadMutation.mutateAsync({
          files: [file],
          workspaceId,
        });
        fileIdToUse = uploaded?.[0]?.fileId ?? null;
        if (!fileIdToUse) {
          throw new Error("File upload failed.");
        }
      }

      const chatPayload = {
        name: item.case_no ? `Delhi HC – ${item.case_no}` : `Delhi HC Order (${item.petitioner ?? "Case"})`,
        type: "general" as const,
        workspaceId,
        fileIds: fileIdToUse ? [fileIdToUse] : [],
      };

      const created = await createChatMutation.mutateAsync(chatPayload);
      const newChat = normalizeChatResponse(created);
      if (!newChat?.id) {
        throw new Error("Unable to create AI chat.");
      }

      setSidebarChat(newChat);
      setIsChatSidebarOpen(true);
      showToast("Chat ready in the sidebar.", "success");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Unable to open AI chat.";
      setSidebarError(message);
      showToast(message, "error");
    } finally {
      setChattingCaseKey(null);
      setIsPreparingSidebarChat(false);
    }
  };

  return (
    <div className="relative">
      <div
        className={`space-y-6 transition-[padding] ${
          isChatSidebarOpen ? "lg:pr-[420px]" : ""
        }`}
      >
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
                    setForm((prev) => ({
                      ...prev,
                      party_name: event.target.value,
                    }))
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
                    setForm((prev) => ({
                      ...prev,
                      from_date: event.target.value,
                    }))
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
                      <th className="px-3 py-2 text-left font-semibold">
                        Actions
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
                        <td className="px-3 py-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChatWithAI(item)}
                            disabled={
                              chattingCaseKey === getRowKey(item) ||
                              isGlobalChatting
                            }
                          >
                            {chattingCaseKey === getRowKey(item)
                              ? "Opening…"
                              : "Chat with AI"}
                          </Button>
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

      <div
        className={`fixed inset-y-0 right-0 z-40 w-full max-w-md transition-opacity duration-300 ${
          isChatSidebarOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {sidebarChat && workspaceId ? (
          <SidebarChatPanel
            workspaceId={workspaceId}
            chat={sidebarChat}
            isOpen={isChatSidebarOpen}
            onClose={closeSidebar}
            caseMeta={sidebarCaseMeta}
          />
        ) : (
          <div
            className={`flex h-full flex-col bg-card border-l shadow-xl transition-transform duration-300 ${
              isChatSidebarOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">AI Assistant</p>
                {sidebarCaseMeta ? (
                  <p className="text-xs text-muted-foreground truncate">
                    {sidebarCaseMeta.title}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Select an order to start chatting
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeSidebar}
                disabled={isPreparingSidebarChat}
              >
                Close
              </Button>
            </div>
            <div className="flex-1 flex items-center justify-center">
              {isPreparingSidebarChat ? (
                <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Preparing chat…</span>
                </div>
              ) : sidebarError ? (
                <div className="px-4 text-sm text-red-600 dark:text-red-400 text-center">
                  {sidebarError}
                </div>
              ) : (
                <div className="px-4 text-sm text-muted-foreground text-center">
                  Chat will appear here once ready.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isChatSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={closeSidebar}
        />
      )}
    </div>
  );
}

