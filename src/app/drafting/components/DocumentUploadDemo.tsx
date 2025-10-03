"use client";

import React from "react";
import DocumentSelector from "./DocumentSelector";
import { useDocuments } from "@/hooks/use-documents";
import { getCookie as getCookieUtil } from "@/lib/utils";

/**
 * Demo component to test the DocumentSelector functionality
 * This can be used to verify that the document upload flow works correctly
 */
export default function DocumentUploadDemo() {
  const [workspaceId, setWorkspaceId] = React.useState<string | null>(null);
  const [importedFiles, setImportedFiles] = React.useState<Array<{ file: File; info: any }>>([]);

  // Get workspace ID from cookie
  React.useEffect(() => {
    const id = typeof window !== "undefined" ? getCookieUtil("workspaceId") : null;
    setWorkspaceId(id);
  }, []);

  const { data: documents, isLoading } = useDocuments(workspaceId);

  const handleDocumentSelect = (file: File, documentInfo: any) => {
    setImportedFiles(prev => [...prev, { file, info: documentInfo }]);
    // Document imported successfully
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Document Upload Demo</h1>
      
      <div className="space-y-6">
        {/* Document Selector */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Import Documents from DataHub</h2>
          <DocumentSelector
            onDocumentSelect={handleDocumentSelect}
            trigger={
              <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                Open Document Selector
              </button>
            }
          />
        </div>

        {/* Workspace Info */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Workspace Information</h2>
          <p><strong>Workspace ID:</strong> {workspaceId || "Not found"}</p>
          <p><strong>Documents Available:</strong> {documents?.length || 0}</p>
          {isLoading && <p className="text-gray-500">Loading documents...</p>}
        </div>

        {/* Available Documents List */}
        {documents && documents.length > 0 && (
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Available Documents</h2>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <span className="font-medium">{doc.filename}</span>
                    <span className="ml-2 text-sm text-gray-500">({doc.type})</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {doc.filePath && <span>Path: {doc.filePath}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Imported Files */}
        {importedFiles.length > 0 && (
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Imported Files</h2>
            <div className="space-y-2">
              {importedFiles.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                  <div>
                    <span className="font-medium">{item.file.name}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      ({Math.round(item.file.size / 1024)} KB)
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Type: {item.file.type || "Unknown"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API Test Section */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">API Test</h2>
          <p className="text-sm text-gray-600 mb-4">
            This demo shows how the DocumentSelector integrates with:
          </p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <code>useDocuments</code> hook to fetch documents from the API</li>
            <li>• <code>useFetchFileContent</code> hook to get signed URLs and download files</li>
            <li>• Document content extraction (TXT and DOCX files)</li>
            <li>• Integration with the TiptapEditor for content insertion</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
