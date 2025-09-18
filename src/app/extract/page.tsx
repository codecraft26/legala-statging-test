"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Tag,
  Clock,
  Loader2,
  Sparkles,
  Settings,
} from "lucide-react";
import ProgressBar from "./components/ProgressBar";
import FileUpload from "./components/FileUpload";
import TagInput from "./components/TagInput";
import DataView from "./components/DataView";
import {
  useExtractions,
  useCreateExtractionFiles,
  useExtractionPolling,
} from "@/hooks/use-extraction";

type Extraction = {
  id: string;
  name: string;
  tags: string[];
  createdAt: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress?: number;
};

const DUMMY: Extraction[] = [
  {
    id: "1",
    name: "NDA_JohnsonLtd_v2",
    tags: ["NDA", "Confidentiality"],
    createdAt: "2024-01-15T10:30:00.000Z",
    status: "completed",
  },
  {
    id: "2",
    name: "Franchise_Agreement_Q3",
    tags: ["Franchise", "Agreement"],
    createdAt: "2024-01-15T09:00:00.000Z",
    status: "processing",
    progress: 62,
  },
  {
    id: "3",
    name: "Master_Service_Contract",
    tags: ["Service", "MSA"],
    createdAt: "2024-01-15T11:15:00.000Z",
    status: "queued",
  },
];

export default function ExtractPage() {
  const { currentWorkspace } = useSelector((s: RootState) => s.auth);
  const [currentStep, setCurrentStep] = useState(1);
  const [files, setFiles] = useState<{ file: File }[]>([]);
  const [extractedData, setExtractedData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showWizard, setShowWizard] = useState(false);
  const [currentExtractionId, setCurrentExtractionId] = useState<string | null>(
    null
  );

  // Use TanStack Query hooks
  const {
    data: extractionsData,
    isLoading: extractionsLoading,
    error: extractionsError,
  } = useExtractions(currentWorkspace?.id);

  const { mutate: createExtraction, isPending: isExtracting } =
    useCreateExtractionFiles();

  const { data: pollingData } = useExtractionPolling(
    currentExtractionId || undefined,
    !!currentExtractionId
  );

  // Convert API data to display format
  const items =
    extractionsData?.map((extraction) => ({
      id: extraction.id,
      name: extraction.name,
      tags: extraction.tags || [],
      createdAt: extraction.createdAt,
      status: extraction.status.toLowerCase() as Extraction["status"],
      progress: extraction.status === "PROCESSING" ? 50 : undefined,
    })) || [];

  // Handle polling updates
  useEffect(() => {
    if (pollingData) {
      if (pollingData.status === "COMPLETED") {
        // Extraction completed, show results
        setCurrentStep(3);
        setIsLoading(false);
        setCurrentExtractionId(null);

        // Transform the extraction results into the expected format
        const results =
          pollingData.extraction_result?.map((result) => ({
            fileName: result.file,
            extractedData: result.data,
            usage: pollingData.usage,
          })) || [];

        setExtractedData(results);
      } else if (pollingData.status === "FAILED") {
        // Extraction failed
        setIsLoading(false);
        setCurrentExtractionId(null);
        console.error("Extraction failed");
      }
    }
  }, [pollingData]);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            {currentStep === 1 ? (
              <FileText className="text-white" size={18} />
            ) : currentStep === 2 ? (
              <Settings className="text-white" size={18} />
            ) : (
              <Sparkles className="text-white" size={18} />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">
              {showWizard
                ? currentStep === 1
                  ? "Upload Documents"
                  : currentStep === 2
                    ? "Configure Extraction"
                    : "Review Results"
                : "Recent Extractions"}
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {showWizard
                  ? currentStep === 1
                    ? "Select your files for processing"
                    : currentStep === 2
                      ? "Define keywords and parameters"
                      : "Analyze extracted data"
                  : "Browse your latest extraction jobs"}
              </p>
              {currentWorkspace && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {currentWorkspace.name}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showWizard ? (
            <Button
              variant="outline"
              onClick={() => {
                setShowWizard(false);
                setCurrentStep(1);
                setFiles([]);
                setExtractedData([]);
              }}
            >
              Back to list
            </Button>
          ) : (
            <Button onClick={() => setShowWizard(true)}>New extraction</Button>
          )}
        </div>
      </div>

      {showWizard ? (
        <div className="space-y-4">
          <div className="rounded-lg border p-4 bg-muted/30">
            <ProgressBar currentStep={currentStep} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {isLoading || isExtracting ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative mb-8">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                  <div className="text-center max-w-sm">
                    <h3 className="text-lg font-medium mb-2">
                      Processing Documents
                    </h3>
                    <p className="text-muted-foreground mb-3">
                      Document{" "}
                      {Math.round((progress / 100) * (files?.length || 1))} of{" "}
                      {files?.length || 1}
                    </p>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      {Math.round(progress)}% Complete
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  {currentStep === 1 && (
                    <FileUpload
                      files={files}
                      setFiles={setFiles}
                      onNext={() => setCurrentStep(2)}
                    />
                  )}
                  {currentStep === 2 && (
                    <TagInput
                      initialName={
                        files.length > 0
                          ? files.length === 1
                            ? files[0].file.name.replace(/\.[^/.]+$/, "")
                            : `${files[0].file.name.replace(/\.[^/.]+$/, "")} + ${files.length - 1} more`
                          : ""
                      }
                      onBack={() => setCurrentStep(1)}
                      onNext={async ({ tags, instructions, agent, name }) => {
                        if (!currentWorkspace?.id) {
                          console.error("No workspace selected");
                          return;
                        }

                        setIsLoading(true);
                        setProgress(10);

                        try {
                          createExtraction(
                            {
                              files: files.map((f) => f.file),
                              name,
                              tags: tags,
                              instruction: instructions,
                              workspaceId: currentWorkspace.id,
                            },
                            {
                              onSuccess: (data) => {
                                setCurrentExtractionId(data.data.id);
                                setProgress(30);
                                // Polling will handle the rest
                              },
                              onError: (error) => {
                                console.error("Extraction failed:", error);
                                setIsLoading(false);
                                setProgress(0);
                              },
                            }
                          );
                        } catch (error) {
                          console.error("Error starting extraction:", error);
                          setIsLoading(false);
                          setProgress(0);
                        }
                      }}
                    />
                  )}
                  {currentStep === 3 && (
                    <DataView
                      extractedData={extractedData}
                      uploadedFiles={files}
                      onBack={() => setCurrentStep(2)}
                    />
                  )}
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="text-sm font-medium mb-2">
                  Recent extractions
                </div>
                <div className="space-y-3">
                  {items.map((x) => (
                    <div key={x.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="rounded p-1 bg-accent">
                            <FileText size={14} />
                          </div>
                          <div className="text-sm font-medium">{x.name}</div>
                        </div>
                        <StatusBadge status={x.status} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock size={12} />{" "}
                        {new Date(x.createdAt).toLocaleString()}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {x.tags.length > 0 ? (
                          x.tags.map((t) => (
                            <span
                              key={t}
                              className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] text-muted-foreground"
                            >
                              <Tag size={10} /> {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-muted-foreground">
                            No tags
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((x) => (
            <div key={x.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-md p-2 bg-accent text-foreground/90">
                    <FileText size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{x.name}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock size={12} />{" "}
                      {new Date(x.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <StatusBadge status={x.status} />
              </div>
              <div className="flex flex-wrap gap-2">
                {x.tags.length > 0 ? (
                  x.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground"
                    >
                      <Tag size={12} /> {t}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No tags</span>
                )}
              </div>
              {x.status === "processing" ? (
                <div className="flex items-center gap-2 text-xs">
                  <Loader2 className="animate-spin" size={14} /> Processing…{" "}
                  {x.progress}%
                </div>
              ) : null}
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="outline" size="sm">
                  Details
                </Button>
                <Button size="sm">Open</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function StatusBadge({ status }: { status: Extraction["status"] }) {
  const map: Record<Extraction["status"], { text: string; cls: string }> = {
    completed: {
      text: "Completed",
      cls: "text-green-700 bg-green-50 border-green-200",
    },
    processing: {
      text: "Processing",
      cls: "text-amber-700 bg-amber-50 border-amber-200",
    },
    queued: { text: "Queued", cls: "text-blue-700 bg-blue-50 border-blue-200" },
    failed: { text: "Failed", cls: "text-red-700 bg-red-50 border-red-200" },
  };
  const cfg = map[status];
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.cls}`}
    >
      {cfg.text}
    </span>
  );
}
