"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Highlighter,
  MapPin,
  Quote
} from "lucide-react";
import { Citation, Document } from "../page";

interface CitationViewerProps {
  citations: Citation[];
  documents: Document[];
  onHighlightSection?: (documentId: string, pageNumber: number, section: string) => void;
}

export function CitationViewer({ citations, documents, onHighlightSection }: CitationViewerProps) {
  const [expandedCitations, setExpandedCitations] = useState<Set<string>>(new Set());
  const [highlightedCitation, setHighlightedCitation] = useState<string | null>(null);

  const toggleCitation = (citationId: string) => {
    const newExpanded = new Set(expandedCitations);
    if (newExpanded.has(citationId)) {
      newExpanded.delete(citationId);
    } else {
      newExpanded.add(citationId);
    }
    setExpandedCitations(newExpanded);
  };

  const handleHighlight = (citation: Citation) => {
    const citationId = `${citation.documentId}-${citation.pageNumber}`;
    setHighlightedCitation(citationId);
    
    if (onHighlightSection) {
      onHighlightSection(citation.documentId, citation.pageNumber, citation.section);
    }
  };

  const getDocumentName = (documentId: string) => {
    const doc = documents.find(d => d.id === documentId);
    return doc ? doc.name : `Document ${documentId}`;
  };

  const groupCitationsByDocument = () => {
    const grouped: Record<string, Citation[]> = {};
    citations.forEach(citation => {
      if (!grouped[citation.documentId]) {
        grouped[citation.documentId] = [];
      }
      grouped[citation.documentId].push(citation);
    });
    return grouped;
  };

  const groupedCitations = groupCitationsByDocument();

  if (citations.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No citations available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold">Source Citations</h3>
          <p className="text-[10px] text-muted-foreground">
            {citations.length} citation{citations.length !== 1 ? 's' : ''} from {Object.keys(groupedCitations).length} document{Object.keys(groupedCitations).length !== 1 ? 's' : ''}
          </p>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          <Highlighter className="w-2.5 h-2.5 mr-1" />
          Interactive
        </Badge>
      </div>

      <ScrollArea className="h-48">
        <div className="space-y-2">
          {Object.entries(groupedCitations).map(([documentId, docCitations]) => (
            <Card key={documentId}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-3 h-3 text-primary" />
                  <CardTitle className="text-xs">{getDocumentName(documentId)}</CardTitle>
                  <Badge variant="outline" className="text-[10px]">
                    {docCitations.length} citation{docCitations.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {docCitations.map((citation, index) => {
                    const citationId = `${citation.documentId}-${citation.pageNumber}-${index}`;
                    const isExpanded = expandedCitations.has(citationId);
                    const isHighlighted = highlightedCitation === citationId;

                    return (
                      <div key={citationId} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-[10px]">
                              <MapPin className="w-2.5 h-2.5 mr-1" />
                              Page {citation.pageNumber}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px]">
                              {citation.section}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 px-1"
                              onClick={() => handleHighlight(citation)}
                            >
                              {isHighlighted ? (
                                <EyeOff className="w-2.5 h-2.5" />
                              ) : (
                                <Eye className="w-2.5 h-2.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 px-1"
                              onClick={() => toggleCitation(citationId)}
                            >
                              {isExpanded ? (
                                <EyeOff className="w-2.5 h-2.5" />
                              ) : (
                                <Eye className="w-2.5 h-2.5" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {isExpanded && (
                          <Card className={`border-l-2 ${
                            isHighlighted 
                              ? "border-l-primary bg-primary/5" 
                              : "border-l-muted"
                          }`}>
                            <CardContent className="p-2">
                              <div className="flex items-start gap-1">
                                <Quote className="w-3 h-3 text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-xs italic text-muted-foreground">
                                    &ldquo;{citation.text}&rdquo;
                                  </p>
                                  <div className="flex items-center gap-1 mt-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-5 px-1 text-[10px]"
                                      onClick={() => handleHighlight(citation)}
                                    >
                                      <ExternalLink className="w-2.5 h-2.5 mr-1" />
                                      View in PDF
                                    </Button>
                                    <span className="text-[10px] text-muted-foreground">
                                      Section: {citation.section}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Citation Summary */}
      <Card className="bg-muted/50">
        <CardContent className="p-2">
          <div className="flex items-center gap-1 mb-1">
            <Highlighter className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium">Citation Summary</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
            <div>
              <p>Total Citations: {citations.length}</p>
              <p>Documents Referenced: {Object.keys(groupedCitations).length}</p>
            </div>
            <div>
              <p>Pages Covered: {new Set(citations.map(c => c.pageNumber)).size}</p>
              <p>Sections: {new Set(citations.map(c => c.section)).size}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
