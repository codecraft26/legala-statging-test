"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { VariableDef } from "./VariablesPanel";

type Draft = {
  id: number;
  file: string;
  content: string;
  variables: VariableDef[];
  user_role: string;
  user_email: string;
  created_at: string;
};

type Props = {
  onApply: (html: string, variables: VariableDef[], title: string) => void;
};

// Mock data for drafts (in real app, this would come from API)
const mockDrafts: Draft[] = [
  {
    id: 1,
    file: "Employment Contract Draft",
    content:
      "<h1>Employment Agreement</h1>" +
      "<p>This Employment Agreement is entered into between {{company_name}} and {{employee_name}}.</p>" +
      "<p><strong>Position:</strong> {{position}}</p>" +
      "<p><strong>Start Date:</strong> {{start_date}}</p>" +
      "<p><strong>Salary:</strong> ${{salary}} per year</p>" +
      "<p><strong>Benefits:</strong> {{benefits}}</p>",
    variables: [
      { unique_id: "company_name", label: "Company Name", type: "text" },
      { unique_id: "employee_name", label: "Employee Name", type: "text" },
      { unique_id: "position", label: "Position", type: "text" },
      { unique_id: "start_date", label: "Start Date", type: "date" },
      { unique_id: "salary", label: "Annual Salary", type: "decimal" },
      { unique_id: "benefits", label: "Benefits Description", type: "text" },
    ],
    user_role: "Legal",
    user_email: "legal@company.com",
    created_at: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    file: "Service Agreement Draft",
    content:
      "<h1>Service Agreement</h1>" +
      "<p>This Service Agreement is made between {{client_name}} and {{service_provider}}.</p>" +
      "<p><strong>Service Description:</strong> {{service_description}}</p>" +
      "<p><strong>Duration:</strong> {{duration}} months</p>" +
      "<p><strong>Fee:</strong> ${{fee}}</p>",
    variables: [
      { unique_id: "client_name", label: "Client Name", type: "text" },
      {
        unique_id: "service_provider",
        label: "Service Provider",
        type: "text",
      },
      {
        unique_id: "service_description",
        label: "Service Description",
        type: "text",
      },
      { unique_id: "duration", label: "Duration (months)", type: "decimal" },
      { unique_id: "fee", label: "Service Fee", type: "decimal" },
    ],
    user_role: "Manager",
    user_email: "manager@company.com",
    created_at: "2024-01-10T14:20:00Z",
  },
  {
    id: 3,
    file: "Partnership Agreement Draft",
    content:
      "<h1>Partnership Agreement</h1>" +
      "<p>Partnership between {{partner_1}} and {{partner_2}}.</p>" +
      "<p><strong>Business Purpose:</strong> {{business_purpose}}</p>" +
      "<p><strong>Capital Contribution:</strong></p>" +
      "<ul>" +
      "<li>{{partner_1}}: ${{contribution_1}}</li>" +
      "<li>{{partner_2}}: ${{contribution_2}}</li>" +
      "</ul>",
    variables: [
      { unique_id: "partner_1", label: "First Partner", type: "text" },
      { unique_id: "partner_2", label: "Second Partner", type: "text" },
      {
        unique_id: "business_purpose",
        label: "Business Purpose",
        type: "text",
      },
      {
        unique_id: "contribution_1",
        label: "Partner 1 Contribution",
        type: "decimal",
      },
      {
        unique_id: "contribution_2",
        label: "Partner 2 Contribution",
        type: "decimal",
      },
    ],
    user_role: "Partner",
    user_email: "partner@company.com",
    created_at: "2024-01-05T09:15:00Z",
  },
];

const getNameFromEmail = (email: string): string => {
  if (!email) return "Unknown";
  return email.split("@")[0];
};

export default function DraftsSelector({ onApply }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [drafts] = useState<Draft[]>(mockDrafts); // In real app, this would be fetched from API
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedDraft = drafts.find((d) => d.id === selectedId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDraftSelect = (draft: Draft) => {
    setSelectedId(draft.id);
    setIsOpen(false);
    // console.log("=== DRAFT APPLICATION START ===");
    // console.log("Applying draft:", draft.file);
    // console.log("Draft content length:", draft.content.length);
    // console.log("Draft variables count:", draft.variables.length);
    // console.log("=== CALLING onApply ===");
    onApply(draft.content, draft.variables, draft.file);
  };

  return (
    <div className="p-4 border-b border-gray-200">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Choose from Drafts
      </label>

      {/* Custom Select Component */}
      <div className="relative" ref={dropdownRef}>
        {/* Select Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-left shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-900">
              {selectedDraft?.file || "Choose from drafts"}
            </span>
            <ChevronDown
              className={`h-5 w-5 text-gray-400 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {/* Dropdown Options */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
            {drafts.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-center">
                No drafts found
              </div>
            ) : (
              drafts.map((draft) => (
                <button
                  key={draft.id}
                  onClick={() => handleDraftSelect(draft)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex flex-col">
                    <span className="text-gray-900 font-medium">
                      {draft.file}
                    </span>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-gray-500">
                        {draft.user_role}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(draft.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </span>
                      <span className="text-xs text-blue-600 font-medium">
                        {getNameFromEmail(draft.user_email)}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
