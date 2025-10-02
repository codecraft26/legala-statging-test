"use client";

import React from "react";
import { X, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { parseHtmlContent, SupremeCaseData } from "../utils/supreme-parser";

function renderCellContent(cell: any, cellIndex: number) {
  if (typeof cell === "object" && cell?.type === "links") {
    return (
      <div key={cellIndex}>
        {cell.data.map((link: any, linkIndex: number) => (
          <a
            key={linkIndex}
            href={link.href}
            target={link.target || "_blank"}
            rel="noopener noreferrer"
            className="text-foreground hover:underline inline-flex items-center max-w-full break-all"
          >
            {link.text}
            <ExternalLink size={14} className="ml-1" />
          </a>
        ))}
      </div>
    );
  }
  if (typeof cell === "string") {
    return (
      <span
        className="block whitespace-pre-wrap break-words break-all leading-5"
        style={{ overflowWrap: "anywhere", wordBreak: "break-word", whiteSpace: "pre-wrap" }}
      >
        {cell}
      </span>
    );
  }
  return cell;
}

export default function SupremeCaseDetailsDialog({
  open,
  onOpenChange,
  caseData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseData: SupremeCaseData | null;
}) {
  const [activeTab, setActiveTab] = React.useState("case_details");

  React.useEffect(() => {
    if (!open) setActiveTab("case_details");
  }, [open]);

  if (!caseData) return null;

  const availableTabs = Object.keys(caseData).filter((key) => (caseData as any)[key]?.success);
  console.log("Available tabs:", availableTabs);
  console.log("Case data structure:", caseData);
  if (availableTabs.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl p-0">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle className="text-base">Supreme Court Case</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-sm text-muted-foreground">No content available.</div>
        </DialogContent>
      </Dialog>
    );
  }
  const safeActive = availableTabs.includes(activeTab) ? activeTab : availableTabs[0];
  const tabPayload = (caseData as any)[safeActive]?.data?.data as string | undefined;

  const content: React.ReactNode = React.useMemo(() => {
    if (!tabPayload) {
      return (
        <div className="p-4 text-sm text-muted-foreground">
          No content available for this section.
        </div>
      );
    }

    if (typeof tabPayload === "string") {
      // Handle JSON responses
      if (tabPayload.startsWith("{") || tabPayload.startsWith("[")) {
        try {
          const json = JSON.parse(tabPayload);
          if (json.message === "No records found") {
            return (
              <div className="p-4 text-sm text-muted-foreground">
                No records found for this section.
              </div>
            );
          }
          return (
            <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">{JSON.stringify(json, null, 2)}</pre>
          );
        } catch {
          // If JSON parsing fails, treat as regular text
        }
      }

      // Handle HTML content
      const tables = parseHtmlContent(tabPayload);
      if (tables.length === 0 || (tables.length === 1 && tables[0].length === 0)) {
        return (
          <div className="p-4 text-sm text-muted-foreground">
            No structured content available for this section.
          </div>
        );
      }

      return (
        <div className="space-y-6">
          {tables.map((table, tableIndex) => (
            <div key={tableIndex} className="rounded-lg border border-border overflow-hidden">
              <div className="bg-muted/40 px-4 py-2 border-b border-border">
                <h3 className="font-medium text-sm">{safeActive.replace(/_/g, " ").toUpperCase()} - Table {tableIndex + 1}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-full border-collapse table-fixed">
                  {table[0] && (
                    <thead>
                      <tr className="bg-muted/50">
                        {table[0].map((header: any, headerIndex: number) => (
                          <th
                            key={headerIndex}
                            className={`border border-border p-2 text-left text-xs font-medium text-muted-foreground align-top ${headerIndex === 0 ? "w-56 md:w-64" : "w-auto"}`}
                          >
                            {typeof header === "string" ? header : "Links"}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {table.slice(table[0] ? 1 : 0).map((row: any, rowIndex: number) => (
                      <tr key={rowIndex} className="odd:bg-background even:bg-muted/20">
                        {row.map((cell: any, cellIndex: number) => (
                          <td
                            key={cellIndex}
                            className={`border border-border p-2 text-xs align-top whitespace-pre-wrap break-words break-all leading-5 ${cellIndex === 0 ? "w-56 md:w-64 text-muted-foreground" : "w-auto"}`}
                            style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
                          >
                            {renderCellContent(cell, cellIndex)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Unexpected content format for this section.
      </div>
    );
  }, [tabPayload, safeActive]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen max-w-[90vw] sm:max-w-[80vw] md:max-w-[70vw] lg:max-w-[1200px] p-0">
        <div className="flex flex-col h-[90vh] md:h-[85vh]">
          <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
            <DialogTitle className="text-base">Supreme Court Case</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <div className="flex h-full">
              <aside className="w-56 md:w-64 shrink-0 border-r bg-muted/20">
                <div className="h-full overflow-auto py-2">
                  {availableTabs.map((tab) => (
                    <button
                      key={tab}
                      className={`w-full text-left px-4 py-2 text-sm font-medium block ${
                        safeActive === tab
                          ? "bg-background text-foreground border-l-2 border-l-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab.replace(/_/g, " ").toUpperCase()}
                    </button>
                  ))}
                </div>
              </aside>
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full p-4">{content}</ScrollArea>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


