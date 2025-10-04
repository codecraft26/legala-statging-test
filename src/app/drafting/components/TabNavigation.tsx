"use client";

import React from "react";
import { Database, CloudUpload } from "lucide-react";

interface TabNavigationProps {
  activeTab: "import" | "upload";
  onTabChange: (tab: "import" | "upload") => void;
}

export default function TabNavigation({
  activeTab,
  onTabChange,
}: TabNavigationProps) {
  return (
    <div className="flex border-b border-gray-200 flex-shrink-0">
      <button
        onClick={() => onTabChange("import")}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
          activeTab === "import"
            ? "border-black text-black"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        <Database className="w-4 h-4" />
        Import from DataHub
      </button>
      <button
        onClick={() => onTabChange("upload")}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
          activeTab === "upload"
            ? "border-black text-black"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        <CloudUpload className="w-4 h-4" />
        Upload Files
      </button>
    </div>
  );
}
