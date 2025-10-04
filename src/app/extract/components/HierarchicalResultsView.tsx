"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, FileText, Copy, Eye } from "lucide-react";
import type { Extraction, ExtractionResult } from "./types";
import { useRouter } from "next/navigation";

interface HierarchicalResultsViewProps {
  extractions: Extraction[];
  onViewDetails: (extractionId: string) => void;
  onCopy: (data: unknown) => void;
}

interface ExpandedState {
  [agentId: string]:
    | boolean
    | {
        [documentId: string]: boolean;
      };
}

export default function HierarchicalResultsView({
  extractions,
  onViewDetails,
  onCopy,
}: HierarchicalResultsViewProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const toggleAgent = (agentId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [agentId]: !prev[agentId],
    }));
  };

  const toggleDocument = (agentId: string, documentId: string) => {
    setExpanded((prev) => {
      const currentAgentState = prev[agentId];
      const isAgentExpanded =
        typeof currentAgentState === "boolean" ? currentAgentState : false;
      const documentStates =
        typeof currentAgentState === "object" ? currentAgentState : {};

      return {
        ...prev,
        [agentId]: {
          ...documentStates,
          [documentId]: !documentStates[documentId],
        },
      };
    });
  };

  const getDocumentCount = (extraction: Extraction) => {
    return extraction.extraction_result?.length || 0;
  };

  const getAgentStatus = (extraction: Extraction) => {
    if (extraction.status === "COMPLETED") return "completed";
    if (extraction.status === "PROCESSING") return "processing";
    if (extraction.status === "FAILED") return "failed";
    return "pending";
  };

  const handlePDFClick = (
    extraction: Extraction,
    pdfResult: ExtractionResult
  ) => {
    router.push(`/extract/${extraction.id}/pdf/${pdfResult.id}`);
  };

  if (!extractions || extractions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
          <FileText className="w-5 h-5 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold mb-1">No extractions found</h3>
        <p className="text-muted-foreground text-sm">
          Start by creating your first extraction.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {extractions.map((extraction) => {
        const isAgentExpanded =
          typeof expanded[extraction.id] === "boolean"
            ? expanded[extraction.id]
            : false;
        const documentCount = getDocumentCount(extraction);
        const agentStatus = getAgentStatus(extraction);

        return (
          <Card key={extraction.id} className="overflow-hidden">
            {/* Agent Header */}
            <CardHeader className="pb-2 pt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAgent(extraction.id)}
                    className="flex items-center gap-1.5 p-1 h-auto"
                  >
                    {isAgentExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                    <div className="flex items-center gap-2">
                      <div>
                        <span className="font-semibold text-base">
                          {extraction.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className="ml-1.5 text-xs px-1.5 py-0.5"
                        >
                          {documentCount}
                        </Badge>
                      </div>
                    </div>
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      agentStatus === "completed"
                        ? "default"
                        : agentStatus === "processing"
                          ? "secondary"
                          : agentStatus === "failed"
                            ? "destructive"
                            : "outline"
                    }
                    className="text-xs px-1.5 py-0.5"
                  >
                    {agentStatus}
                  </Badge>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(extraction.id)}
                    className="h-7 px-2"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Documents List */}
            {isAgentExpanded && (
              <CardContent className="pt-0 pb-2">
                {extraction.extraction_result &&
                extraction.extraction_result.length > 0 ? (
                  <div className="space-y-1 ml-4 border-l-2 border-muted/30 pl-3">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-2 items-center px-2 py-1 text-xs font-medium text-muted-foreground border-b">
                      <div className="col-span-5">Name</div>
                      <div className="col-span-3">Runtime</div>
                      <div className="col-span-2"></div>
                      <div className="col-span-2 text-right">Actions</div>
                    </div>
                    {extraction.extraction_result.map((result) => {
                      const dataEntries = result.data
                        ? Object.entries(result.data)
                        : [];
                      const hasData = dataEntries.length > 0;

                      return (
                        <div
                          key={result.id}
                          className="border rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <div className="p-2">
                            <div className="grid grid-cols-12 gap-2 items-center">
                              {/* Name Column */}
                              <div className="col-span-5">
                                <Button
                                  variant="ghost"
                                  onClick={() =>
                                    handlePDFClick(extraction, result)
                                  }
                                  className="flex items-center gap-2 p-1 h-auto w-full text-left justify-start"
                                >
                                  <div
                                    className={`w-5 h-5 rounded flex items-center justify-center ${
                                      hasData ? "bg-primary/10" : "bg-muted"
                                    }`}
                                  >
                                    <FileText
                                      className={`w-3 h-3 ${
                                        hasData
                                          ? "text-primary"
                                          : "text-muted-foreground"
                                      }`}
                                    />
                                  </div>
                                  <div className="flex-1 text-left">
                                    <div className="font-medium text-xs truncate">
                                      {result.file}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {hasData
                                        ? `${dataEntries.length} fields`
                                        : ""}
                                    </div>
                                  </div>
                                </Button>
                              </div>

                              {/* Runtime Column */}
                              <div className="col-span-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <span className="truncate">
                                    {new Date(
                                      extraction.createdAt
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>

                              {/* Status Column */}
                              <div className="col-span-2"></div>

                              {/* Actions Column */}
                              <div className="col-span-2 flex items-center gap-1 justify-end">
                                {hasData && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onCopy(result.data);
                                    }}
                                    title="Copy data"
                                    className="h-5 w-5 p-0"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePDFClick(extraction, result);
                                  }}
                                  className="h-5 px-1.5 text-xs"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 ml-4 border-l-2 border-muted/30 pl-3">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <h4 className="font-medium text-sm mb-1">
                      No documents processed yet
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Documents will appear here once processing begins.
                    </p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
