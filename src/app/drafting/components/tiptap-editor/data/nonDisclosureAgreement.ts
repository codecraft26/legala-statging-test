import { VariableDef } from "../components/VariablesPanel";

export const nonDisclosureAgreementVariables: VariableDef[] = [
  { unique_id: "variable_1", label: "Effective Date", type: "date" },
  { unique_id: "variable_2", label: "Disclosing Party Name", type: "text" },
  { unique_id: "variable_3", label: "Disclosing Party Address", type: "text" },
  { unique_id: "variable_4", label: "Receiving Party Name", type: "text" },
  { unique_id: "variable_5", label: "Receiving Party Address", type: "text" },
  { unique_id: "variable_6", label: "Purpose of Disclosure", type: "text" },
  {
    unique_id: "variable_7",
    label: "Confidential Information Description",
    type: "text",
  },
  { unique_id: "variable_8", label: "Term Duration (Years)", type: "decimal" },
  { unique_id: "variable_9", label: "Governing Law", type: "text" },
  { unique_id: "variable_10", label: "Jurisdiction", type: "text" },
];
