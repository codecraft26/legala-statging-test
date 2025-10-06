export function normalizeToHtml(input: string): string {
  const trimmed = (input || "").trim();
  if (!trimmed) return "<p></p>";
  // If it already looks like HTML, use as-is
  if (/[<][a-zA-Z!/]/.test(trimmed)) return trimmed;

  // If it looks like Markdown, convert a minimal subset to HTML without external deps
  // This is intentionally simple: headings, bold/italic, inline code, code fences, lists, blockquote, links, paragraphs
  const isLikelyMarkdown = /(^|\n)\s{0,3}(#{1,6}\s)|\*\*|__|`|\n\n|^\s*[-*+]\s|^\s*\d+\.\s|^>\s|\[(.*?)\]\((.*?)\)/m.test(
    trimmed
  );

  if (isLikelyMarkdown) {
    try {
      const lines = trimmed.split(/\n/);
      const htmlParts: string[] = [];
      let inCodeBlock = false;
      let listBuffer: { type: 'ul' | 'ol'; items: string[] } | null = null;

      const flushList = () => {
        if (!listBuffer) return;
        const tag = listBuffer.type;
        htmlParts.push(`<${tag}>` + listBuffer.items.map((it) => `<li>${it}</li>`).join("") + `</${tag}>`);
        listBuffer = null;
      };

      for (const rawLine of lines) {
        const line = rawLine;
        if (/^```/.test(line)) {
          if (!inCodeBlock) {
            flushList();
            htmlParts.push('<pre><code>');
            inCodeBlock = true;
          } else {
            htmlParts.push('</code></pre>');
            inCodeBlock = false;
          }
          continue;
        }

        if (inCodeBlock) {
          htmlParts.push(
            line
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
          );
          continue;
        }

        // Ordered list
        const olMatch = line.match(/^\s*(\d+)\.\s+(.*)$/);
        if (olMatch) {
          const itemText = olMatch[2];
          if (!listBuffer || listBuffer.type !== 'ol') {
            flushList();
            listBuffer = { type: 'ol', items: [] };
          }
          listBuffer.items.push(applyInlineMd(itemText));
          continue;
        }

        // Unordered list
        const ulMatch = line.match(/^\s*[-*+]\s+(.*)$/);
        if (ulMatch) {
          const itemText = ulMatch[1];
          if (!listBuffer || listBuffer.type !== 'ul') {
            flushList();
            listBuffer = { type: 'ul', items: [] };
          }
          listBuffer.items.push(applyInlineMd(itemText));
          continue;
        }

        // Blank line -> paragraph break
        if (!line.trim()) {
          flushList();
          htmlParts.push('');
          continue;
        }

        // Headings
        const heading = line.match(/^\s{0,3}(#{1,6})\s+(.*)$/);
        if (heading) {
          flushList();
          const level = Math.min(6, heading[1].length);
          htmlParts.push(`<h${level}>${applyInlineMd(heading[2])}</h${level}>`);
          continue;
        }

        // Blockquote
        const bq = line.match(/^\s{0,3}>\s?(.*)$/);
        if (bq) {
          flushList();
          htmlParts.push(`<blockquote>${applyInlineMd(bq[1])}</blockquote>`);
          continue;
        }

        // Fallback paragraph
        flushList();
        htmlParts.push(`<p>${applyInlineMd(line)}</p>`);
      }

      flushList();
      const html = htmlParts.filter((p) => p !== '').join('');
      return html || '<p></p>';
    } catch {
      // Fallback to plaintext to paragraphs if anything goes wrong
    }
  }

  // Plain text -> paragraphs with <br/>
  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, "<br/>")}</p>`)
    .join("");
  return paragraphs || "<p></p>";
}

function applyInlineMd(text: string): string {
  // Escape basic HTML first
  let t = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold and italic
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1<\/strong>');
  t = t.replace(/__(.+?)__/g, '<strong>$1<\/strong>');
  t = t.replace(/\*(.+?)\*/g, '<em>$1<\/em>');
  t = t.replace(/_(.+?)_/g, '<em>$1<\/em>');
  // Inline code
  t = t.replace(/`([^`]+)`/g, '<code>$1<\/code>');
  // Links [text](url)
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+\"([^\"]+)\")?\)/g, (_m, label, url) => {
    const safeUrl = String(url).replace(/"/g, '%22');
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  return t;
}


