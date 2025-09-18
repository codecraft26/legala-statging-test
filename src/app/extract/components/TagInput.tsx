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

          {/* Tags Display */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
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
