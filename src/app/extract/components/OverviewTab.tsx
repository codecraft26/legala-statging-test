import { memo } from "react";
import { Tag, Loader2 } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import type { Extraction } from "./types";

const OverviewTab = memo(function OverviewTab({ extraction }: { extraction: Extraction }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-muted rounded-lg p-4">
          <div className="text-sm font-medium text-gray-500 mb-1">Status</div>
          <div><StatusBadge status={extraction.status} /></div>
        </div>
        <div className="bg-muted rounded-lg p-4">
          <div className="text-sm font-medium text-gray-500 mb-1">Documents</div>
          <div className="text-lg font-semibold">
            {extraction.extraction_result?.length}
          </div>
        </div>
        <div className="bg-muted rounded-lg p-4">
          <div className="text-sm font-medium text-gray-500 mb-1">Usage</div>
          <div className="text-lg font-semibold">{String(extraction.usage)} tokens</div>
        </div>
      </div>

      {extraction.tags && extraction.tags.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {extraction.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full border border-blue-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {extraction.instruction && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Loader2 className="w-5 h-5" />
            Instructions
          </h3>
          <div className="bg-muted rounded-lg p-4">
            <p className="whitespace-pre-wrap text-gray-700">{extraction.instruction}</p>
          </div>
        </div>
      )}

      {extraction.status === "PROCESSING" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <Loader2 className="w-5 h-5 animate-spin" />
            <h3 className="font-medium">Processing in Progress</h3>
          </div>
          <p className="mt-2 text-sm text-blue-700">
            Your documents are currently being processed. This page will
            automatically update when complete.
          </p>
        </div>
      )}
    </div>
  );
});

export default OverviewTab;


