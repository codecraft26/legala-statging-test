"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCookie as getCookieUtil } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FileText, Settings, Sparkles, ChevronLeft } from "lucide-react";
import ProgressBar from "../components/ProgressBar";
import FileUpload from "../components/FileUpload";
import TagInput from "../components/TagInput";
import {
  useCreateExtractionFiles,
  useCreateExtractionDocuments,
  useExtractionPolling,
} from "@/hooks/use-extraction";
import { useToast } from "@/components/ui/toast";

export default function NewExtractionPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string>("");

  useEffect(() => {
    const id =
      typeof window !== "undefined" ? getCookieUtil("workspaceId") : null;
    setWorkspaceId(id);
    setWorkspaceName("");
  }, []);

  const currentWorkspace = workspaceId
    ? ({ id: workspaceId, name: workspaceName } as any)
    : null;
  const [currentStep, setCurrentStep] = useState(1);
  const [files, setFiles] = useState<{ file: File }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentExtractionId, setCurrentExtractionId] = useState<string | null>(
    null
  );
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [suggestedName, setSuggestedName] = useState<string>("");

  const { mutate: createExtractionFiles, isPending: isExtractingFiles } =
    useCreateExtractionFiles();
  const { mutate: createExtractionDocs, isPending: isExtractingDocs } =
    useCreateExtractionDocuments();

  const { data: pollingData } = useExtractionPolling(
    currentExtractionId || undefined,
    !!currentExtractionId
  );

  // Handle polling updates
  useEffect(() => {
    if (pollingData) {
      if (pollingData.status === "COMPLETED") {
        // Extraction completed, redirect to details page
        setIsLoading(false);
        setCurrentExtractionId(null);
        showToast("Extraction completed successfully!", "success");

        // Redirect to the extraction details page
        router.push(`/extract/${pollingData.id}`);
      } else if (pollingData.status === "FAILED") {
        // Extraction failed
        setIsLoading(false);
        setCurrentExtractionId(null);
        console.error("Extraction failed:", pollingData);
        showToast(
          `Extraction failed: ${(pollingData as any).error || "Unknown error occurred"}`,
          "error"
        );
      }
    }
  }, [pollingData, router, showToast]);

  const handleBackToList = () => {
    router.push("/extract");
  };

  const handleStepBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      handleBackToList();
    }
  };

  const handleStepNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleExtractionSubmit = async ({
    tags,
    instructions,
    agent,
    name,
  }: any) => {
    if (!currentWorkspace?.id) {
      console.error("No workspace selected");
      return;
    }

    setIsLoading(true);
    setProgress(10);

    try {
      if (selectedDocumentIds.length > 0 && files.length === 0) {
        createExtractionDocs(
          {
            documentId: selectedDocumentIds,
            name,
            tags,
            instruction: instructions,
            workspaceId: currentWorkspace.id,
          },
          {
            onSuccess: (data) => {
              setCurrentExtractionId(data.data.id);
              setProgress(30);
            },
            onError: (error) => {
              console.error("Extraction failed:", error);
              setIsLoading(false);
              setProgress(0);
              showToast(
                `Failed to start extraction: ${error?.message || "Unknown error occurred"}`,
                "error"
              );
            },
          }
        );
      } else {
        createExtractionFiles(
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
            },
            onError: (error) => {
              console.error("Extraction failed:", error);
              setIsLoading(false);
              setProgress(0);
              showToast(
                `Failed to start extraction: ${error?.message || "Unknown error occurred"}`,
                "error"
              );
            },
          }
        );
      }
    } catch (error) {
      console.error("Error starting extraction:", error);
      setIsLoading(false);
      setProgress(0);
      showToast(
        `Error starting extraction: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
        "error"
      );
    }
  };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={handleBackToList}
            className="flex items-center p-2 h-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
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
              {currentStep === 1 ? "Upload Documents" : "Configure Extraction"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {currentStep === 1
                ? "Select your files for processing"
                : "Define keywords and parameters"}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="rounded-lg border p-4 bg-muted/30">
        <ProgressBar currentStep={currentStep} />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {isLoading || isExtractingFiles || isExtractingDocs ? (
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
                  Document {Math.round((progress / 100) * (files?.length || 1))}{" "}
                  of {files?.length || 1}
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
                  onNext={handleStepNext}
                  selectedDocumentIds={selectedDocumentIds}
                  onSelectedDocumentsChange={setSelectedDocumentIds}
                  onSuggestedNameChange={setSuggestedName}
                />
              )}
              {currentStep === 2 && (
                <TagInput
                  initialName={
                    suggestedName ||
                    (files.length > 0
                      ? files.length === 1
                        ? files[0].file.name.replace(/\.[^/.]+$/, "")
                        : `${files[0].file.name.replace(/\.[^/.]+$/, "")} + ${files.length - 1} more`
                      : selectedDocumentIds.length > 0
                        ? `Selected ${selectedDocumentIds.length} document${selectedDocumentIds.length !== 1 ? "s" : ""}`
                        : "")
                  }
                  onBack={handleStepBack}
                  onNext={handleExtractionSubmit}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
