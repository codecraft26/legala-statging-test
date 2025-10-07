"use client";

import React, { useState } from "react";
import { X, ExternalLink } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import FollowButton from "./FollowButton";
import StatusPill from "./StatusPill";
import ResultsTable, { ColumnDef } from "./ResultsTable";
import { ParsedHighCourtDetails } from "../../utils/highCourtParser";

interface HighCourtResult {
  orderurlpath?: string;
  cino: string;
  case_no: string;
  case_type: number;
  case_year: number;
  case_no2: number;
  pet_name?: string;
  res_name?: string;
  lpet_name?: string;
  lres_name?: string;
  party_name1?: string;
  party_name2?: string;
  adv_name1?: string;
  adv_name2?: string;
  ladv_name1?: string;
  ladv_name2?: string;
  date_of_decision?: string;
  type_name?: string;
  state_cd?: string;
  court_code?: string;
  details?: ParsedHighCourtDetails | any;
}

export default function HighCourtCaseDetailsModal({
  caseData,
  onClose,
  followedCases,
  handleFollowCase,
  followMutation,
  unfollowMutation,
}: {
  caseData: HighCourtResult | null;
  onClose: () => void;
  followedCases: Set<string>;
  handleFollowCase: (caseData: HighCourtResult) => void;
  followMutation: any;
  unfollowMutation: any;
}) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!caseData) return null;

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString || dateString.includes("1970-01-01"))
      return "Not Available";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Not Available";
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (err) {
      return "Not Available";
    }
  };

  const renderTabContent = () => {
    const details = caseData.details as ParsedHighCourtDetails | undefined;

    if (!details) {
      return (
        <div className="p-6 text-center">
          <div className="text-gray-400 mb-2">No data available</div>
          <div className="text-sm text-gray-500">
            No {activeTab.replace(/_/g, " ")} information found for this case.
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  label: "CNR Number",
                  value:
                    details.case_details?.cnr_number || caseData.cino || "N/A",
                },
                {
                  label: "Filing Number",
                  value: details.case_details?.filing_number || "N/A",
                },
                {
                  label: "Filing Date",
                  value: formatDate(details.case_details?.filing_date) || "N/A",
                },
                {
                  label: "Registration Number",
                  value: details.case_details?.registration_number || "N/A",
                },
                {
                  label: "Registration Date",
                  value:
                    formatDate(details.case_details?.registration_date) ||
                    "N/A",
                },
              ].map((item, index) => (
                <div key={index}>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    {item.label}
                  </h3>
                  <p className="text-sm">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "parties":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Petitioners</h3>
              <ul className="bg-gray-50 p-4 rounded-md space-y-2">
                {details.petitioner_and_advocate?.map(
                  (petitioner: string, index: number) => (
                    <li key={index} className="text-sm">
                      {petitioner.split("    ")[0] || "N/A"}
                    </li>
                  )
                ) || <li className="text-sm">N/A</li>}
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Respondents</h3>
              <ul className="bg-gray-50 p-4 rounded-md space-y-2">
                {details.respondent_and_advocate?.map(
                  (respondent: string, index: number) => (
                    <li key={index} className="text-sm">
                      {respondent || "N/A"}
                    </li>
                  )
                ) || <li className="text-sm">N/A</li>}
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Petitioner Advocates</h3>
              <ul className="bg-gray-50 p-4 rounded-md space-y-2">
                {details.petitioner_and_advocate?.map(
                  (petitioner: string, index: number) => (
                    <li key={index} className="text-sm">
                      {petitioner.split("    ")[1] || "N/A"}
                    </li>
                  )
                ) || <li className="text-sm">N/A</li>}
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Respondent Advocates</h3>
              <ul className="bg-gray-50 p-4 rounded-md space-y-2">
                <li className="text-sm">N/A</li>
              </ul>
            </div>
          </div>
        );

      case "status":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  label: "Case Stage",
                  value: details.case_status?.stage_of_case || "N/A",
                },
                {
                  label: "First Hearing Date",
                  value:
                    formatDate(details.case_status?.first_hearing_date) ||
                    "N/A",
                },
                {
                  label: "Next Hearing Date",
                  value:
                    formatDate(details.case_status?.next_hearing_date) || "N/A",
                },
                {
                  label: "Coram",
                  value: details.case_status?.coram || "N/A",
                },
                {
                  label: "Judicial Branch",
                  value: details.case_status?.judicial_branch || "N/A",
                },
                {
                  label: "Not Before Me",
                  value: details.case_status?.not_before_me || "N/A",
                },
              ].map((item, index) => (
                <div key={index}>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    {item.label}
                  </h3>
                  <p className="text-sm">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "orders":
        return (
          <div className="space-y-4">
            <h3 className="font-medium mb-2">Orders</h3>
            {details.orders && details.orders.length > 0 ? (
              <div className="w-full overflow-x-auto border border-border rounded-md bg-card text-card-foreground">
                {(() => {
                  const columns: ColumnDef<any>[] = [
                    {
                      key: "order_number",
                      header: "ORDER #",
                      width: 100,
                      render: (r) => r.order_number || "N/A",
                    },
                    {
                      key: "order_date",
                      header: "DATE",
                      width: 120,
                      render: (r) => formatDate(r.order_date),
                    },
                    {
                      key: "judge",
                      header: "JUDGE",
                      width: 220,
                      render: (r) => r.judge || "N/A",
                    },
                    {
                      key: "order_details",
                      header: "LINK",
                      width: 140,
                      render: (r) =>
                        r.order_details ? (
                          <a
                            href={r.order_details}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-black hover:text-gray-700 text-sm"
                          >
                            <span>View Order</span>
                            <ExternalLink size={14} />
                          </a>
                        ) : (
                          <span className="text-sm">N/A</span>
                        ),
                    },
                  ];
                  return (
                    <ResultsTable
                      columns={columns}
                      rows={details.orders}
                      rowKey={(row) =>
                        row.order_details ||
                        `${row.order_number}-${row.order_date}`
                      }
                      tableClassName="min-w-full"
                      headerRowClassName="bg-muted"
                    />
                  );
                })()}
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700">
                No orders available for this case.
              </div>
            )}
          </div>
        );

      case "ia":
        return (
          <div className="space-y-6">
            <h3 className="font-medium mb-2">
              Interlocutory Applications (IA)
            </h3>
            {details.ia_details && details.ia_details.length > 0 ? (
              <div className="w-full overflow-x-auto border border-border rounded-md bg-card text-card-foreground">
                {(() => {
                  const columns: ColumnDef<any>[] = [
                    {
                      key: "ia_number",
                      header: "IA NUMBER",
                      width: 160,
                      render: (r) => r.ia_number || "N/A",
                    },
                    {
                      key: "party",
                      header: "PARTY",
                      width: 220,
                      render: (r) => r.party || "N/A",
                    },
                    {
                      key: "date_of_filing",
                      header: "FILING DATE",
                      width: 140,
                      render: (r) => formatDate(r.date_of_filing),
                    },
                    {
                      key: "next_date",
                      header: "NEXT DATE",
                      width: 140,
                      render: (r) => formatDate(r.next_date),
                    },
                    {
                      key: "ia_status",
                      header: "STATUS",
                      width: 160,
                      render: (r) => r.ia_status || "N/A",
                    },
                  ];
                  return (
                    <ResultsTable
                      columns={columns}
                      rows={details.ia_details}
                      rowKey={(row) => `${row.ia_number}-${row.date_of_filing}`}
                      tableClassName="min-w-full"
                      headerRowClassName="bg-muted"
                    />
                  );
                })()}
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700">
                No IA details available for this case.
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="p-6 text-center">
            <div className="text-gray-400 mb-2">No data available</div>
            <div className="text-sm text-gray-500">
              No {activeTab.replace(/_/g, " ")} information found for this case.
            </div>
          </div>
        );
    }
  };

  const availableTabs = ["overview", "parties", "status", "orders", "ia"];

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <Card className="w-full max-w-[1200px] h-[88vh] overflow-hidden flex flex-col">
        <CardHeader className="sticky top-0 bg-card z-10 border-b">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle id="modal-title" className="text-lg">
                Case Details
              </CardTitle>
              <CardDescription className="mt-1">
                {caseData.details?.case_details?.registration_number ||
                  caseData.case_no ||
                  "N/A"}
              </CardDescription>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6 flex-1 overflow-y-auto">
          <div className="mb-6">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold mb-2">
                {`${caseData.details?.petitioner_and_advocate?.[0]?.split("    ")[0] || "Unknown"} vs. ${caseData.details?.respondent_and_advocate?.[0] || "Unknown"}`}
              </h2>
              <FollowButton
                isFollowing={followedCases.has(
                  caseData.cino || caseData.case_no
                )}
                loading={followMutation.isPending || unfollowMutation.isPending}
                onClick={() => handleFollowCase(caseData)}
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium">
                CNR:{" "}
                {caseData.details?.case_details?.cnr_number ||
                  caseData.cino ||
                  "N/A"}
              </span>
              <span className="text-sm mx-2 font-medium text-muted-foreground">
                |
              </span>
              <span className="text-sm font-medium">
                Filed:{" "}
                {formatDate(caseData.details?.case_details?.filing_date) ||
                  "N/A"}
              </span>
              <span className="text-sm mx-2 font-medium text-muted-foreground">
                |
              </span>
              <StatusPill
                status={
                  caseData.details?.case_status?.stage_of_case || "PENDING"
                }
              />
            </div>
          </div>

          <div className="border-b">
            <div className="flex overflow-x-auto">
              {availableTabs.map((tab) => (
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

          <div className="mt-4">{renderTabContent()}</div>
        </CardContent>

        <CardFooter className="border-t p-4 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="bg-muted text-foreground hover:bg-muted/80 px-4 py-2 rounded-md text-sm"
          >
            Close
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
