"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, FileText, BarChart3, Search } from "lucide-react";
import { AnalysisMode } from "../page";

interface ModeSelectorProps {
  selectedMode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
  descriptions: Record<AnalysisMode, string>;
}

const modeConfig = {
  general: {
    icon: MessageSquare,
    label: "General",
    color: "bg-blue-500",
    description: "Interact with documents by asking questions and getting answers with source citations",
    features: ["Q&A with documents", "Source citations", "PDF highlighting", "Multi-document support"]
  },
  summarize: {
    icon: FileText,
    label: "Summarize",
    color: "bg-green-500",
    description: "Get section-by-section summaries of your documents",
    features: ["Section-by-section summary", "Single or multi-document", "Export to CSV/PDF", "Structured output"]
  },
  analyze: {
    icon: BarChart3,
    label: "Analyze",
    color: "bg-purple-500",
    description: "Compare and analyze multiple documents in a tabular format",
    features: ["Tabular comparison", "Custom prompts", "Spot inconsistencies", "Interactive grid"]
  },
  extract: {
    icon: Search,
    label: "Extract",
    color: "bg-orange-500",
    description: "Extract key terms and data points from documents for due diligence",
    features: ["Automated extraction", "Due diligence support", "Key terms identification", "Batch processing"]
  }
} as const;

export function ModeSelector({ selectedMode, onModeChange, descriptions }: ModeSelectorProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold mb-1">Analysis Mode</h3>
        <p className="text-xs text-muted-foreground">
          Choose how you want to interact with your documents
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {Object.entries(modeConfig).map(([mode, config]) => {
          const IconComponent = config.icon;
          const isSelected = selectedMode === mode;
          
          return (
            <Card 
              key={mode}
              className={`cursor-pointer transition-all hover:shadow-sm ${
                isSelected 
                  ? "ring-1 ring-primary border-primary/50 bg-primary/5" 
                  : "hover:border-muted-foreground/50"
              }`}
              onClick={() => onModeChange(mode as AnalysisMode)}
            >
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-md ${config.color} flex items-center justify-center`}>
                      <IconComponent className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xs font-medium">{config.label}</CardTitle>
                      {isSelected && (
                        <Badge variant="secondary" className="text-[10px] mt-0.5">
                          Selected
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-[10px] leading-tight">
                    {config.description}
                  </CardDescription>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

    </div>
  );
}
