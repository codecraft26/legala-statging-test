// Simple debounce utility
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null;
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

// Utility function to sanitize HTML content
export const sanitizeHtmlContent = (content: string) =>
  content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Preprocess HTML content to ensure proper variable placeholders
export const preprocessHtmlContent = (
  html: string, 
  variables: any[], 
  setPlaceholderStatus: (status: Record<string, string>) => void
) => {
  let processedHtml = html;
  const foundPlaceholders = new Set(
    (html.match(/\{\{[^}]+\}\}/g) || []).map((p) => p.slice(2, -2).trim())
  );
  const variableIds = new Set(variables.map((v) => v.unique_id));
  const status: Record<string, string> = {};

  variables.forEach((v) => {
    status[v.unique_id] = foundPlaceholders.has(v.unique_id)
      ? "Found"
      : "Missing";
  });
  setPlaceholderStatus(status);

  variables.forEach((variable) => {
    const placeholder = `{{${variable.unique_id}}}`;
    const regex = new RegExp(
      `\\{\\{\\s*${variable.unique_id}\\s*\\}\\}`,
      "gi"
    );
    processedHtml = processedHtml.replace(regex, placeholder);
  });

  const unmatchedVariables = variables.filter(
    (v) => !foundPlaceholders.has(v.unique_id)
  );
  if (unmatchedVariables.length > 0) {
    console.warn(
      "Variables with no placeholders in content:",
      unmatchedVariables.map((v) => v.unique_id)
    );
  }

  return processedHtml;
};

// Extract variables from content
export const extractVariablesFromContent = (html: string) => {
  const curlyMatches = html.match(/\{\{([^}]+)\}\}/g) || [];
  const bracketMatches = html.match(/\[[^\]]+\]/g) || [];

  // Convert legacy bracket placeholders like [Company Name] => {{company_name}}
  const bracketToCurly: Record<string, string> = {};
  bracketMatches.forEach((m) => {
    const label = m.slice(1, -1).trim();
    if (!label) return;
    const id = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    if (!id) return;
    bracketToCurly[m] = `{{${id}}}`;
  });

  return { curlyMatches, bracketMatches, bracketToCurly };
};

// Normalize bracket placeholders to curly syntax
export const normalizeBracketPlaceholders = (
  html: string, 
  bracketToCurly: Record<string, string>
) => {
  if (Object.keys(bracketToCurly).length === 0) return html;

  let updated = html;
  Object.entries(bracketToCurly).forEach(([from, to]) => {
    const escaped = from.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const re = new RegExp(escaped, "g");
    updated = updated.replace(re, to);
  });
  
  return updated;
};

// Get workspace ID from cookie
export const getWorkspaceIdFromCookie = (): string | null => {
  if (typeof window === "undefined") return null;
  
  try {
    const cookieMatch = document.cookie.match(/(?:^|; )workspaceId=([^;]*)/);
    return cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
  } catch {
    return null;
  }
};
