"use client";

import React, { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import StatusPill from "./StatusPill";
import { ParsedCaseDetails } from "../../utils/district-parsers";

export default function CaseDetailsModal({ caseData, onClose }: { caseData: ParsedCaseDetails | null; onClose: () => void; }) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!caseData) return null;

  // Prevent background scroll while modal is open, but keep background visible
  useEffect(() => {
    const originalOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = originalOverflow;
    };
  }, []);

  const getAvailableTabs = () => {
    if (!caseData) return ["overview"];
    const tabs = ["overview", "parties"] as string[];
    if (caseData.acts.length > 0) tabs.push("acts");
    if (caseData.caseHistory.length > 0) tabs.push("history");
    return tabs;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-screen max-w-[90vw] sm:max-w-[80vw] md:max-w-[70vw] lg:max-w-[1200px] max-h-[90vh] overflow-hidden">
        <CardHeader className="sticky top-0 bg-card z-10 border-b">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Case Details</CardTitle>
              <CardDescription className="mt-1">
                {caseData.caseInfo.cnrNumber || "N/A"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const dataStr = JSON.stringify(caseData, null, 2);
                  const dataBlob = new Blob([dataStr], { type: "application/json" });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `case-details-${caseData.caseInfo.cnrNumber || "unknown"}.json`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                className="inline-flex items-center gap-2 bg-black text-white px-3 py-2 rounded-md hover:bg-gray-800 text-xs"
              >
                <Download size={16} />
                <span>Download</span>
              </button>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6 overflow-auto max-h-[calc(90vh-120px)]">
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium">CNR: {caseData.caseInfo.cnrNumber || "N/A"}</span>
              <span className="text-sm mx-2 font-medium text-muted-foreground">|</span>
              <span className="text-sm font-medium">Filed: {caseData.caseInfo.filingDate || "N/A"}</span>
              <span className="text-sm mx-2 font-medium text-muted-foreground">|</span>
              <StatusPill status={caseData.caseStatus.caseStatus || "PENDING"} />
            </div>
          </div>

          <div className="border-b mb-4">
            <div className="w-full overflow-x-auto">
              <div className="flex whitespace-nowrap min-w-max">
              {getAvailableTabs().map((tab) => (
                <button
                  key={tab}
                  className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${activeTab === tab ? "text-foreground border-b-2 border-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
              </div>
            </div>
          </div>

          <div className="mb-4">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h3 className="font-medium mb-4">Case Information</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full w-full border-collapse table-fixed">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="border border-border p-2 text-left text-xs font-medium text-muted-foreground align-top w-56 md:w-64">Field</th>
                          <th className="border border-border p-2 text-left text-xs font-medium text-muted-foreground align-top">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-muted/30">
                          <td className="border border-border p-2 text-sm font-medium w-56 md:w-64">Case Type</td>
                          <td className="border border-border p-2 text-sm whitespace-pre-wrap break-words break-all" style={{overflowWrap:"anywhere",wordBreak:"break-word"}}>{caseData.caseInfo.caseType || "N/A"}</td>
                        </tr>
                        <tr className="hover:bg-muted/30">
                          <td className="border border-border p-2 text-sm font-medium w-56 md:w-64">Filing Number</td>
                          <td className="border border-border p-2 text-sm whitespace-pre-wrap break-words break-all" style={{overflowWrap:"anywhere",wordBreak:"break-word"}}>{caseData.caseInfo.filingNumber || "N/A"}</td>
                        </tr>
                        <tr className="hover:bg-muted/30">
                          <td className="border border-border p-2 text-sm font-medium w-56 md:w-64">Filing Date</td>
                          <td className="border border-border p-2 text-sm whitespace-pre-wrap break-words break-all" style={{overflowWrap:"anywhere",wordBreak:"break-word"}}>{caseData.caseInfo.filingDate || "N/A"}</td>
                        </tr>
                        <tr className="hover:bg-muted/30">
                          <td className="border border-border p-2 text-sm font-medium w-56 md:w-64">Registration Number</td>
                          <td className="border border-border p-2 text-sm whitespace-pre-wrap break-words break-all" style={{overflowWrap:"anywhere",wordBreak:"break-word"}}>{caseData.caseInfo.registrationNumber || "N/A"}</td>
                        </tr>
                        <tr className="hover:bg-muted/30">
                          <td className="border border-border p-2 text-sm font-medium w-56 md:w-64">Registration Date</td>
                          <td className="border border-border p-2 text-sm whitespace-pre-wrap break-words break-all" style={{overflowWrap:"anywhere",wordBreak:"break-word"}}>{caseData.caseInfo.registrationDate || "N/A"}</td>
                        </tr>
                        <tr className="hover:bg-muted/30">
                          <td className="border border-border p-2 text-sm font-medium w-56 md:w-64">CNR Number</td>
                          <td className="border border-border p-2 text-sm font-mono whitespace-pre-wrap break-words break-all" style={{overflowWrap:"anywhere",wordBreak:"break-word"}}>{caseData.caseInfo.cnrNumber || "N/A"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-medium mb-4">Status Information</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full w-full border-collapse table-fixed">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="border border-border p-2 text-left text-xs font-medium text-muted-foreground align-top w-56 md:w-64">Field</th>
                          <th className="border border-border p-2 text-left text-xs font-medium text-muted-foreground align-top">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-muted/30">
                          <td className="border border-border p-2 text-sm font-medium w-56 md:w-64">Case Status</td>
                          <td className="border border-border p-2 text-sm whitespace-pre-wrap break-words break-all" style={{overflowWrap:"anywhere",wordBreak:"break-word"}}>
                            <StatusPill status={caseData.caseStatus.caseStatus || "N/A"} />
                          </td>
                        </tr>
                        <tr className="hover:bg-muted/30">
                          <td className="border border-border p-2 text-sm font-medium w-56 md:w-64">Stage of Case</td>
                          <td className="border border-border p-2 text-sm whitespace-pre-wrap break-words break-all" style={{overflowWrap:"anywhere",wordBreak:"break-word"}}>{caseData.caseStatus.stageOfCase || "N/A"}</td>
                        </tr>
                        <tr className="hover:bg-muted/30">
                          <td className="border border-border p-2 text-sm font-medium w-56 md:w-64">First Hearing Date</td>
                          <td className="border border-border p-2 text-sm whitespace-pre-wrap break-words break-all" style={{overflowWrap:"anywhere",wordBreak:"break-word"}}>{caseData.caseStatus.firstHearingDate || "N/A"}</td>
                        </tr>
                        <tr className="hover:bg-muted/30">
                          <td className="border border-border p-2 text-sm font-medium w-56 md:w-64">Next Hearing Date</td>
                          <td className="border border-border p-2 text-sm whitespace-pre-wrap break-words break-all" style={{overflowWrap:"anywhere",wordBreak:"break-word"}}>{caseData.caseStatus.nextHearingDate || "N/A"}</td>
                        </tr>
                        <tr className="hover:bg-muted/30">
                          <td className="border border-border p-2 text-sm font-medium w-56 md:w-64">Court Number and Judge</td>
                          <td className="border border-border p-2 text-sm whitespace-pre-wrap break-words break-all" style={{overflowWrap:"anywhere",wordBreak:"break-word"}}>{caseData.caseStatus.courtNumberAndJudge || "N/A"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "parties" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Petitioners</h3>
                  <ul className="bg-muted/30 p-4 rounded-md space-y-2">
                    {caseData.parties.petitioners.length > 0 ? (
                      caseData.parties.petitioners.map((petitioner, index) => (
                        <li key={index} className="text-sm">
                          {petitioner.name}
                          {petitioner.advocate && (
                            <span className="text-gray-600"> (Adv: {petitioner.advocate})</span>
                          )}
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-gray-500">No petitioner information available</li>
                    )}
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Respondents</h3>
                  <ul className="bg-muted/30 p-4 rounded-md space-y-2">
                    {caseData.parties.respondents.length > 0 ? (
                      caseData.parties.respondents.map((respondent, index) => (
                        <li key={index} className="text-sm">
                          {respondent.name}
                          {respondent.advocate && (
                            <span className="text-gray-600"> (Adv: {respondent.advocate})</span>
                          )}
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-gray-500">No respondent information available</li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "acts" && (
              <div>
                <h3 className="font-medium mb-4">Acts and Sections</h3>
                <div className="bg-muted/30 p-4 rounded-md">
                  {caseData.acts.length > 0 ? (
                    <div className="space-y-3">
                      <div className="border-b pb-3">
                        <p className="text-sm text-gray-500">Acts</p>
                        <p className="text-sm font-medium">{caseData.acts.map((act) => act.act).join(", ") || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Sections</p>
                        <p className="text-sm font-medium">{caseData.acts.map((act) => act.sections).join(", ") || "N/A"}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No acts and sections information available</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div>
                <h3 className="font-medium mb-4">Case History</h3>
                {caseData.caseHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="border border-border p-2 text-left text-xs font-medium text-muted-foreground">Business Date</th>
                          <th className="border border-border p-2 text-left text-xs font-medium text-muted-foreground">Hearing Date</th>
                          <th className="border border-border p-2 text-left text-xs font-medium text-muted-foreground">Purpose</th>
                          <th className="border border-border p-2 text-left text-xs font-medium text-muted-foreground">Judge</th>
                        </tr>
                      </thead>
                      <tbody>
                        {caseData.caseHistory.map((history, index) => (
                          <tr key={index} className="hover:bg-muted/30">
                            <td className="border border-border p-2 text-sm">{history.businessOnDate}</td>
                            <td className="border border-border p-2 text-sm">{history.hearingDate}</td>
                            <td className="border border-border p-2 text-sm">{history.purposeOfHearing || "N/A"}</td>
                            <td className="border border-border p-2 text-sm">{history.judge || "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-800">No history records available for this case.</div>
                )}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="border-t p-4 flex justify-end">
          <button onClick={onClose} className="bg-muted text-foreground hover:bg-muted/80 px-4 py-2 rounded-md text-sm">
            Close
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}


