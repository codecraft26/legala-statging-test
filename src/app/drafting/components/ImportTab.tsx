"use client";

import React from "react";
import { Search, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DocumentItem } from "@/hooks/use-documents";
import DocumentListItem from "./DocumentListItem";
import NavigationBreadcrumbs from "./NavigationBreadcrumbs";

interface FolderPath {
  id: string;
  name: string;
}

interface ImportTabProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  loadingDocumentId: string | null;
  documentsLoading: boolean;
  filteredDocuments: DocumentItem[];
  folderPath: FolderPath[];
  onHomeClick: () => void;
  onCrumbClick: (index: number) => void;
  onFolderClick: (folder: DocumentItem) => void;
  onDocumentSelect: (document: DocumentItem) => void;
}

export default function ImportTab({
  searchTerm,
  onSearchChange,
  loadingDocumentId,
  documentsLoading,
  filteredDocuments,
  folderPath,
  onHomeClick,
  onCrumbClick,
  onFolderClick,
  onDocumentSelect,
}: ImportTabProps) {
  return (
    <>
      {/* Search */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <NavigationBreadcrumbs
        folderPath={folderPath}
        onHome={onHomeClick}
        onCrumbClick={onCrumbClick}
      />

      {/* Documents List */}
      <ScrollArea className="flex-1 border rounded-md min-h-0 w-full">
        <div className="p-4">
          {documentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading documents...</span>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm
                ? "No documents found matching your search."
                : "No documents in this folder."}
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredDocuments.map((document) => (
                <DocumentListItem
                  key={document.id}
                  document={document}
                  isLoading={loadingDocumentId === document.id}
                  onSelect={onFolderClick}
                  onImport={onDocumentSelect}
                  showImportButton={true}
                  showSelection={false}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
}
