"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Tag, ChevronRight, ChevronLeft, Plus } from "lucide-react";

export default function TagInput({
  onBack,
  onNext,
  initialName = "",
}: {
  onBack: () => void;
  onNext: (args: {
    tags: string[];
    instructions: string;
    agent?: string;
    name: string;
  }) => void;
  initialName?: string;
}) {
  const [tags, setTags] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [instructions, setInstructions] = useState("");
  const [agent, setAgent] = useState(initialName); // Set agent name to match initial name
  const [name, setName] = useState(initialName); // Set extraction name to initial name

  // Suggested tags (reference from old React flow)
  const suggestedTags = [
    "agreement date",
    "parties involved",
    "address",
    "organization involved",
    "important dates",
    "amount",
    "partner capital contribution %",
    "amount contributed for all partners",
  ];

  const addTag = () => {
    const v = input.trim();
    if (!v || tags.includes(v)) return;
    setTags((t) => [...t, v]);
    setInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      alert("Please enter a name for the extraction");
      return;
    }
    onNext({ tags, instructions, agent, name: name.trim() });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Configure Extraction
        </h2>
        <p className="text-gray-500">
          Set up your extraction parameters and instructions
        </p>
      </div>

      <div className="space-y-6">
        {/* Extraction Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Extraction Name *
          </Label>
          <Input
            id="name"
            type="text"
            placeholder={
              initialName
                ? `Currently: ${initialName}`
                : "Enter a name for this extraction (e.g., Contract Analysis)"
            }
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setName(e.target.value)
            }
            className="w-full"
            required
          />
          <p className="text-xs text-gray-500">
            Give your extraction a descriptive name (2-100 characters)
          </p>
        </div>

        {/* Tags Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">
            <Tag className="w-4 h-4 inline mr-1" />
            Tags for Categorization
          </Label>

          <div className="flex gap-2">
            <Input
              placeholder="Add tags (e.g., contract, legal, analysis)"
              value={input}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setInput(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={addTag}
              variant="outline"
              size="sm"
              disabled={!input.trim()}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          {/* Suggested Tags */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Suggested tags</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                click to add
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {suggestedTags.map((t) => {
                const isAdded = tags.includes(t);
                return (
                  <Button
                    key={t}
                    type="button"
                    variant={isAdded ? "secondary" : "outline"}
                    size="sm"
                    className={`justify-between ${isAdded ? "opacity-70" : ""}`}
                    disabled={isAdded}
                    onClick={() => {
                      if (!isAdded) setTags((prev) => [...prev, t]);
                    }}
                  >
                    <span className="truncate text-left">{t}</span>
                    {!isAdded && <Plus className="w-3 h-3 ml-2 opacity-60" />}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Selected Tags */}
          {tags.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Selected Tags</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                  {tags.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-blue-600 hover:text-blue-800"
                      aria-label={`Remove ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-muted/20 rounded-lg border border-dashed">
              <Tag className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No tags added yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add custom tags or select from suggestions above
              </p>
            </div>
          )}

          <p className="text-xs text-gray-500">
            Add tags to help categorize and organize your extractions
          </p>
        </div>

        {/* Instructions Section */}
        <div className="space-y-2">
          <Label
            htmlFor="instructions"
            className="text-sm font-medium text-gray-700"
          >
            Custom Extraction Instructions (Optional)
          </Label>
          <Textarea
            id="instructions"
            placeholder="Provide specific instructions for the AI extraction process. For example: 'Extract key terms, parties involved, dates, and financial information from the contracts.'"
            value={instructions}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setInstructions(e.target.value)
            }
            className="min-h-[120px] resize-none"
          />
          <p className="text-xs text-gray-500">
            Provide specific guidance on what information to extract from your
            documents
          </p>
        </div>

        {/* Agent Name Section */}
        <div className="space-y-2">
          <Label htmlFor="agent" className="text-sm font-medium text-gray-700">
            Agent Name (Optional)
          </Label>
          <Input
            id="agent"
            type="text"
            placeholder={
              initialName
                ? `Currently: ${initialName}`
                : "Custom agent name for this extraction"
            }
            value={agent}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setAgent(e.target.value)
            }
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            Assign a custom name to identify this extraction agent
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Upload
        </Button>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            {tags.length > 0 &&
              `${tags.length} tag${tags.length !== 1 ? "s" : ""} added`}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="flex items-center"
          >
            Run Extraction
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
