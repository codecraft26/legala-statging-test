"use client";

import React from "react";
import { Button } from "@/components/ui/button";

export default function FileUpload({
  files,
  setFiles,
  onNext,
}: {
  files: { file: File }[];
  setFiles: (v: { file: File }[]) => void;
  onNext: () => void;
}) {
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []).map((f) => ({ file: f }));
    setFiles([...(files || []), ...picked]);
  };
  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-6">
        <input type="file" multiple onChange={onPick} />
        <div className="mt-4 text-sm text-muted-foreground">
          {files?.length
            ? `${files.length} file(s) selected`
            : "No files selected"}
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!files?.length}>
          Next
        </Button>
      </div>
    </div>
  );
}
