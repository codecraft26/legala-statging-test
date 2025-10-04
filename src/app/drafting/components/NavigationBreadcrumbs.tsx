"use client";

import React from "react";
import { Home, ChevronRight } from "lucide-react";

interface FolderPath {
  id: string;
  name: string;
}

interface NavigationBreadcrumbsProps {
  folderPath: FolderPath[];
  onHome: () => void;
  onCrumbClick: (index: number) => void;
  className?: string;
}

export default function NavigationBreadcrumbs({
  folderPath,
  onHome,
  onCrumbClick,
  className = "",
}: NavigationBreadcrumbsProps) {
  return (
    <div
      className={`flex items-center space-x-2 text-sm text-gray-600 flex-shrink-0 ${className}`}
    >
      <button
        onClick={onHome}
        className="flex items-center space-x-1 hover:text-gray-800"
      >
        <Home className="w-4 h-4" />
        <span>Home</span>
      </button>
      {folderPath.map((folder, index) => (
        <React.Fragment key={`${folder.id}-${index}`}>
          <ChevronRight className="w-4 h-4" />
          <button
            onClick={() => onCrumbClick(index)}
            className="hover:text-gray-800"
          >
            {folder.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
