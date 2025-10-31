"use client";

import React, { memo, useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import 'highlight.js/styles/github.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
});

function MarkdownRendererBase({ content, className = "" }: MarkdownRendererProps) {
  const sanitizedHtml = useMemo(() => {
    const rawHtml = marked.parse(content || "");
    return DOMPurify.sanitize(rawHtml as string);
  }, [content]);

  return (
    <div className={`prose prose-sm max-w-none ${className}`} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
  );
}

export const MarkdownRenderer = memo(MarkdownRendererBase);
