"use client";

import React from "react";
import { AlertCircle, CheckCircle } from "lucide-react";

type Props = {
  html: string;
  isLoading: boolean;
  error?: string;
};

export default function GeneratedContentView({ html, isLoading, error }: Props) {
  return (
    <div className="p-4 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-xs font-medium text-gray-700">Generated Content</label>
        {html && !isLoading && !error && (
          <div className="flex items-center gap-1 text-gray-900">
            <CheckCircle size={14} />
            <span className="text-xs">Ready</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto border border-gray-300 bg-white rounded-lg p-3 max-h-[60vh]">
        {error ? (
          <div className="flex items-start gap-1.5 text-red-600">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium">Error</p>
              <p className="text-xs text-red-500">{error}</p>
            </div>
          </div>
        ) : html ? (
          <div className="text-xs text-gray-800 leading-relaxed">
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
            {isLoading && (
              <span className="inline-block w-1 h-3 bg-gray-900 animate-pulse ml-1"></span>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500 flex flex-col items-center justify-center h-full">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mb-2">
              <span className="text-gray-400">✦</span>
            </div>
            <p className="text-xs">Generated content will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}


