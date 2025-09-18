"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { VariableDef } from "./VariablesPanel";
import { franchiseAgreement1Variables } from "../data/franchiseAgreement1";
import { franchiseAgreement2Variables } from "../data/franchiseAgreement2";
import { franchiseAgreement3Variables } from "../data/franchiseAgreement3";
import { nonDisclosureAgreementVariables } from "../data/nonDisclosureAgreement";

type Template = {
  id: string;
  name: string;
  html: string;
  variables: VariableDef[];
  docxPath?: string; // optional path to a DOCX served from /public
};

const templates: Template[] = [
  {
    id: "nda",
    name: "Non-Disclosure Agreement",
    html: `<h1>Non-Disclosure Agreement</h1>
      <p>This Non-Disclosure Agreement is made effective as of {{variable_1}} between {{variable_2}} (the "Disclosing Party") and {{variable_4}} (the "Receiving Party").</p>
      <p><strong>Disclosing Party:</strong> {{variable_2}}<br>
      Address: {{variable_3}}</p>
      <p><strong>Receiving Party:</strong> {{variable_4}}<br>
      Address: {{variable_5}}</p>
      <p><strong>Purpose:</strong> {{variable_6}}</p>
      <p><strong>Confidential Information:</strong> {{variable_7}}</p>
      <p><strong>Term:</strong> This agreement shall remain in effect for {{variable_8}} years from the effective date.</p>
      <p><strong>Governing Law:</strong> This agreement shall be governed by the laws of {{variable_9}}.</p>
      <p><strong>Jurisdiction:</strong> Any disputes shall be resolved in {{variable_10}}.</p>`,
    variables: nonDisclosureAgreementVariables,
    docxPath: "/agreementDocs/Non-Disclosure-Agreement.docx",
  },
  {
    id: "franchise-format1",
    name: "Franchise Agreement - Format 1",
    html: `<h1>Franchise Agreement - Format 1</h1>
      <p><strong>Agreement Date:</strong> {{variable_1}}</p>
      <p><strong>Company:</strong> {{variable_2}}<br>
      Registered Office: {{variable_3}}</p>
      <p><strong>Participant:</strong> {{variable_4}}<br>
      Registered Office: {{variable_5}}</p>
      <p><strong>Territory:</strong> {{variable_6}}</p>
      <p><strong>Tournament Expense:</strong> ₹{{variable_7}} ({{variable_8}})</p>
      <p><strong>Player Fees:</strong> ₹{{variable_9}} ({{variable_10}})</p>
      <p><strong>Participation Fee:</strong> ₹{{variable_11}} ({{variable_12}})</p>
      <p><strong>Team Purse:</strong> ₹{{variable_25}} ({{variable_26}})</p>
      <p><strong>Reserved Territory:</strong> {{variable_31}}</p>`,
    variables: franchiseAgreement1Variables,
    docxPath: "/agreementDocs/FranchiseAgreement.Format1.docx",
  },
  {
    id: "franchise-format2",
    name: "Franchise Agreement - Format 2",
    html: `<h1>Franchise Agreement - Format 2</h1>
      <p><strong>Agreement Date:</strong> {{variable_1}} {{variable_2}}, {{variable_3}}</p>
      <p><strong>Company:</strong> {{variable_4}}<br>
      Registered Address: {{variable_5}}</p>
      <p><strong>Participant Company:</strong> {{variable_6}}<br>
      Registered Address: {{variable_7}}</p>
      <p><strong>Granted Territory:</strong> {{variable_8}}</p>
      <p><strong>Tournament Expense:</strong> ₹{{variable_9}} ({{variable_10}})</p>
      <p><strong>Player Fee:</strong> ₹{{variable_11}} ({{variable_12}})</p>
      <p><strong>Participation Fee:</strong> ₹{{variable_13}} ({{variable_14}})</p>
      <p><strong>Team Purse Amount:</strong> ₹{{variable_29}} ({{variable_30}})</p>
      <p><strong>Reserved Territory:</strong> {{variable_33}}</p>`,
    variables: franchiseAgreement2Variables,
    docxPath: "/agreementDocs/FranchiseAgreement.Format2.docx",
  },
  {
    id: "franchise-format3",
    name: "Franchise Agreement - Format 3",
    html: `<h1>Franchise Agreement - Format 3</h1>
      <p><strong>Agreement Date:</strong> {{variable_1}} {{variable_2}}, {{variable_3}}</p>
      <p><strong>Company:</strong> {{variable_4}}<br>
      Registered Address: {{variable_5}}</p>
      <p><strong>Participant:</strong> {{variable_6}}<br>
      Registered Address: {{variable_8}}</p>
      <p><strong>Territory Granted:</strong> {{variable_9}}</p>
      <p><strong>Tournament Expense:</strong> ₹{{variable_10}} ({{variable_11}})</p>
      <p><strong>Player Fees:</strong> ₹{{variable_12}} ({{variable_13}})</p>
      <p><strong>Participant Fees:</strong> ₹{{variable_14}} ({{variable_15}})</p>
      <p><strong>Team Purse Amount:</strong> ₹{{variable_30}} ({{variable_31}})</p>
      <p><strong>For and Behalf of Party One:</strong> {{variable_34}}</p>`,
    variables: franchiseAgreement3Variables,
    docxPath: "/agreementDocs/FranchiseAgreement.Format3.docx",
  },
];

type Props = {
  onApply: (html: string, variables: VariableDef[], docxPath?: string) => void;
};

export default function TemplateSelector({ onApply }: Props) {
  const [selectedId, setSelectedId] = useState<string>(templates[0]?.id ?? "");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedTemplate =
    templates.find((t) => t.id === selectedId) ?? templates[0];

  // Debug: Log templates on component mount
  React.useEffect(() => {
    // console.log("TemplateSelector mounted, available templates:", templates);
    // console.log("Selected template:", selectedTemplate);
  }, [selectedTemplate]);

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

  const handleTemplateSelect = (template: Template) => {
    setSelectedId(template.id);
    setIsOpen(false);
    // console.log("=== TEMPLATE APPLICATION START ===");
    // console.log("Applying template:", template.name);
    // console.log("Template HTML length:", template.html.length);
    // console.log("Template variables count:", template.variables.length);
    // console.log("DOCX path:", template.docxPath);
    // console.log("=== CALLING onApply ===");
    onApply(template.html, template.variables, template.docxPath);
  };

  return (
    <div className="p-4 border-b border-gray-200">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Choose from Templates
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
              {selectedTemplate?.name || "Choose from template"}
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
            {templates.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-center">
                No templates found
              </div>
            ) : (
              templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex flex-col">
                    <span className="text-gray-900 font-medium">
                      {template.name}
                    </span>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-gray-500">
                        {template.variables.length} variables
                      </span>
                      <span className="text-xs text-blue-600 font-medium">
                        {template.docxPath ? "DOCX Template" : "HTML Template"}
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
