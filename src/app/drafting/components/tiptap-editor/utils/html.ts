export function normalizeToHtml(input: string): string {
  const trimmed = (input || "").trim();
  if (!trimmed) return "<p></p>";
  // Heuristic: if it looks like HTML already, return as-is
  if (/[<][a-zA-Z!/]/.test(trimmed)) return trimmed;
  // Convert plaintext to paragraphs; double newlines split paragraphs, single newlines become <br/>
  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, "<br/>")}</p>`)
    .join("");
  return paragraphs || "<p></p>";
}


