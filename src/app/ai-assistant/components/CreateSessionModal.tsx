"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, X, CheckCircle } from "lucide-react";
import { Document } from "../page";

interface CreateSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSession: (data: { name: string; documents: Document[] }) => void;
}

export function CreateSessionModal({ open, onOpenChange, onCreateSession }: CreateSessionModalProps) {
  const [sessionName, setSessionName] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = useCallback(async (files: FileList) => {
    setIsUploading(true);
    const newDocuments: Document[] = [];

    for (const file of Array.from(files)) {
      // Simulate file processing
      const document: Document = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        uploadDate: new Date().toISOString(),
        summary: `Summary for ${file.name} will be generated after processing...`,
      };
      newDocuments.push(document);
    }

    setDocuments(prev => [...prev, ...newDocuments]);
    setIsUploading(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const removeDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const handleCreate = () => {
    if (sessionName.trim() && documents.length > 0) {
      onCreateSession({
        name: sessionName.trim(),
        documents,
      });
      // Reset form
      setSessionName("");
      setDocuments([]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New AI Assistant Session</DialogTitle>
          <DialogDescription>
            Upload documents and create a session to start analyzing them with AI
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Session Name */}
          <div className="space-y-2">
            <Label htmlFor="session-name">Session Name</Label>
            <Input
              id="session-name"
              placeholder="Enter a name for your session"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
            />
          </div>

          {/* File Upload Area */}
          <div className="space-y-2">
            <Label>Documents</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop your documents here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Supports PDF, DOC, DOCX, TXT files
              </p>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("file-upload")?.click()}
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Choose Files"}
              </Button>
            </div>
          </div>

          {/* Uploaded Documents */}
          {documents.length > 0 && (
            <div className="space-y-2">
              <Label>Uploaded Documents ({documents.length})</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {documents.map((doc) => (
                  <Card key={doc.id} className="p-3">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(doc.size)} • {doc.type}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDocument(doc.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={!sessionName.trim() || documents.length === 0}
          >
            Create Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
