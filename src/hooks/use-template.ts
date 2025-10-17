import { useState, useCallback } from "react";
import { TemplateItem, TemplateService } from "@/lib/template-service";
import { useToast } from "@/components/ui/toast";

export interface TemplateContent {
  html: string;
  text: string;
  variables: string[];
}

export function useTemplate() {
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const loadTemplateContent = useCallback(async (template: TemplateItem): Promise<TemplateContent | null> => {
    setIsLoading(true);
    try {
      // Load actual template content from the file
      const htmlContent = await TemplateService.loadTemplateContent(template);
      
      const templateContent: TemplateContent = {
        html: htmlContent,
        text: htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
        variables: [
          '{{company_name}}',
          '{{client_name}}',
          '{{date}}',
          '{{address}}',
          '{{amount}}',
          '{{terms}}'
        ]
      };

      return templateContent;
    } catch (error) {
      console.error("Error loading template content:", error);
      showToast("Failed to load template content", "error");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const downloadTemplate = useCallback(async (template: TemplateItem) => {
    try {
      const url = TemplateService.getTemplateFileUrl(template.filename);
      const link = document.createElement('a');
      link.href = url;
      link.download = template.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Downloaded ${template.name}`, "success");
    } catch (error) {
      console.error("Error downloading template:", error);
      showToast("Failed to download template", "error");
    }
  }, [showToast]);

  return {
    loadTemplateContent,
    downloadTemplate,
    isLoading,
  };
}
