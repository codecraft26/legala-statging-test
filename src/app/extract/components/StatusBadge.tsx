import { Loader2 } from "lucide-react";

export default function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING: {
      label: "Pending",
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    PROCESSING: {
      label: "Processing",
      className: "bg-blue-100 text-blue-800 border-blue-200",
    },
    COMPLETED: {
      label: "Completed",
      className: "bg-green-100 text-green-800 border-green-200",
    },
    FAILED: {
      label: "Failed",
      className: "bg-red-100 text-red-800 border-red-200",
    },
  };

  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.className}`}>
      {status === "PROCESSING" && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      )}
      {config.label}
    </span>
  );
}


