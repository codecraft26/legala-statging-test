"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

export default function TagInput({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: (args: {
    tags: string[];
    instructions: string;
    agent?: string;
  }) => void;
}) {
  const [tags, setTags] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [instructions, setInstructions] = useState("");
  const [agent, setAgent] = useState("");

  const addTag = () => {
    const v = input.trim();
    if (!v) return;
    setTags((t) => Array.from(new Set([...t, v])));
    setInput("");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-6 space-y-4">
        <div>
          <label className="block text-sm mb-1">Tags</label>
          <div className="flex gap-2">
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <Button type="button" onClick={addTag}>
              Add
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t} className="rounded-md border px-2 py-1 text-xs">
                {t}
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Instruction</label>
          <textarea
            className="w-full min-h-24 rounded-md border px-3 py-2 text-sm"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Agent (optional)</label>
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={agent}
            onChange={(e) => setAgent(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={() => onNext({ tags, instructions, agent })}>
          Run Extraction
        </Button>
      </div>
    </div>
  );
}
