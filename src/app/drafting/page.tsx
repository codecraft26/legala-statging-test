"use client";

import React, { useCallback, useEffect, Suspense } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { getCookie as getCookieUtil } from "@/lib/utils";
import TiptapEditor from "./components/tiptap-editor/TiptapEditor";
import { useCreateEmptyDraft, useUpdateDraft } from "@/hooks/use-drafting";
import { useToast } from "@/components/ui/toast";
import { TemplateService, TemplateItem } from "@/lib/template-service";
import { useTemplate } from "@/hooks/use-template";

export default function DraftingPage() {
  return (
    <Suspense fallback={<main className="h-screen flex items-center justify-center">Loading…</main>}>
      <DraftingPageClient />
    </Suspense>
  );
}

function DraftingPageClient() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [workspaceId, setWorkspaceId] = React.useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = React.useState<string>("");
  const [currentDraftId, setCurrentDraftId] = React.useState<string | null>(
    null
  );
  const [documentTitle, setDocumentTitle] = React.useState<string>("New Draft");
  const [editorContentRef, setEditorContentRef] = React.useState<
    (() => string) | null
  >(null);
  const [initialTemplateContent, setInitialTemplateContent] = React.useState<string | null>(null);

  const createEmptyDraft = useCreateEmptyDraft(workspaceId);
  const updateDraft = useUpdateDraft(workspaceId);
  const { loadTemplateContent } = useTemplate();
  const { showToast } = useToast();

  React.useEffect(() => {
    const id =
      typeof window !== "undefined" ? getCookieUtil("workspaceId") : null;
    setWorkspaceId(id);
    setWorkspaceName("");
  }, []);

  // Handle template loading from URL parameters
  useEffect(() => {
    const templateId = searchParams.get('template');
    if (templateId && workspaceId) {
      const loadTemplate = async () => {
        try {
          const template = await TemplateService.getTemplateById(templateId);
          if (template) {
            const templateContent = await loadTemplateContent(template);
            if (templateContent) {
              setDocumentTitle(template.name);
              setInitialTemplateContent(templateContent.html);
              showToast(`Loaded template: ${template.name}`, "success");
            }
          }
        } catch (error) {
          console.error("Error loading template:", error);
          showToast("Failed to load template", "error");
        }
      };
      loadTemplate();
    }
  }, [searchParams, workspaceId, loadTemplateContent, showToast]);

  const currentWorkspace = workspaceId
    ? ({ id: workspaceId, name: workspaceName || "" } as any)
    : null;

  const handleSave = async () => {
    if (!workspaceId) {
      showToast("No workspace selected", "error");
      return;
    }

    try {
      if (currentDraftId) {
        // Update existing draft
        const content = editorContentRef ? editorContentRef() : "";
        await updateDraft.mutateAsync({
          id: currentDraftId,
          name: documentTitle,
          content: content,
        });
        // Ensure list refreshes
        if (workspaceId) {
          queryClient.invalidateQueries({
            queryKey: ["drafting", workspaceId],
          });
        }
        showToast("Draft updated successfully!", "success");
      } else {
        // Create new empty draft
        const result = await createEmptyDraft.mutateAsync({
          name: documentTitle,
          workspaceId: workspaceId,
        });
        setCurrentDraftId(result.id);
        // Ensure list shows new draft immediately
        if (workspaceId) {
          queryClient.invalidateQueries({
            queryKey: ["drafting", workspaceId],
          });
        }
        showToast("Draft created successfully!", "success");

        // If there's content in the editor, update the draft with it
        const content = editorContentRef ? editorContentRef() : "";
        if (content && content.trim() !== "" && content !== "<p></p>") {
          await updateDraft.mutateAsync({
            id: result.id,
            content: content,
          });
          if (workspaceId) {
            queryClient.invalidateQueries({
              queryKey: ["drafting", workspaceId],
            });
          }
        }
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      showToast("Failed to save draft", "error");
    }
  };

  const handleDocumentTitleChange = useCallback((title: string) => {
    setDocumentTitle(title);
  }, []);

  const handleEditorContentChange = useCallback(
    (getContentFn: () => string) => {
      setEditorContentRef(() => getContentFn);
    },
    []
  );

  return (
    <main className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <TiptapEditor
          onDocumentTitleChange={handleDocumentTitleChange}
          onEditorContentChange={handleEditorContentChange}
          currentDraftId={currentDraftId}
          onDraftIdChange={(id) => setCurrentDraftId(id)}
          onNewDraft={() => {
            setCurrentDraftId(null);
            setDocumentTitle("New Draft");
            setInitialTemplateContent(null);
          }}
          onSave={handleSave}
          isSaving={createEmptyDraft.isPending || updateDraft.isPending}
          initialContent={initialTemplateContent}
        />
      </div>
    </main>
  );
}
