"use client";

import React from "react";
import { Bookmark, BookmarkX, Calendar, Eye, FileText, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";

type CourtType = "Supreme_Court" | "High_Court" | "District_Court";

export interface FollowedCase {
  id: string;
  court: CourtType;
  followed: any;
  createdAt: string;
  updatedAt: string;
  userId: string;
  workspaceId: string;
}

export function FollowedCaseCard({
  caseItem,
  onUnfollow,
  onView,
  unfollowPending,
  detailsLoadingId,
}: {
  caseItem: FollowedCase;
  onUnfollow: (id: string) => void;
  onView: (item: FollowedCase) => void;
  unfollowPending: boolean;
  detailsLoadingId: string | null;
}) {
  const { followed, court, createdAt, id } = caseItem;

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800 dark:border-gray-700">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-black" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {court.replace("_", " ")}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onUnfollow(id)}
          disabled={unfollowPending}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <BookmarkX className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {court === "Supreme_Court" && (
          <>
            {(followed["Case Number"] || followed["case_number"] || followed["diary_number"]) && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Case Number:</strong> {followed["Case Number"] || followed["case_number"] || `Diary No: ${followed["diary_number"]}`}
                </span>
              </div>
            )}
            {(followed["Petitioner versus Respondent"] || followed["petitioner_name"] || followed["respondent_name"]) && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-gray-500 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Parties:</strong> {followed["Petitioner versus Respondent"] || `${followed["petitioner_name"] || ""} vs ${followed["respondent_name"] || ""}`}
                </span>
              </div>
            )}
            {followed["status"] && (
              <div className="flex items-center gap-2">
                <span className={`text-sm px-2 py-1 rounded-full ${
                  followed["status"] === "PENDING" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
                }`}>
                  {followed["status"]}
                </span>
              </div>
            )}
          </>
        )}

        {court === "High_Court" && (
          <>
            {(followed["Case Number"] || followed["case_no2"] || followed["type_name"]) && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Case Number:</strong> {followed["Case Number"] || `${followed["type_name"] || ""}${followed["case_no2"] ? `/${followed["case_no2"]}` : ""}${followed["case_year"] ? `/${followed["case_year"]}` : ""}`}
                </span>
              </div>
            )}
            {(followed["Petitioner/Appellant versus Respondent"] || followed["pet_name"] || followed["res_name"]) && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-gray-500 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Parties:</strong> {followed["Petitioner/Appellant versus Respondent"] || `${followed["pet_name"] || ""} vs ${followed["res_name"] || ""}`}
                </span>
              </div>
            )}
            {(followed["adv_name1"] || followed["adv_name2"]) && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-gray-500 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Advocates:</strong> {[followed["adv_name1"], followed["adv_name2"]].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
            {(followed["Status"] || followed["date_of_decision"]) && (
              <div className="flex items-center gap-2">
                <span className={`text-sm px-2 py-1 rounded-full ${
                  followed["Status"] === "PENDING" || !followed["date_of_decision"] ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
                }`}>
                  {followed["Status"] || (followed["date_of_decision"] ? "Decided" : "Pending")}
                </span>
                {followed["date_of_decision"] && (
                  <span className="text-xs text-gray-500">
                    Decision: {new Date(followed["date_of_decision"]).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </>
        )}

        {court === "District_Court" && (
          <>
            {followed["Case Type/Case Number/Case Year"] && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Case:</strong> {followed["Case Type/Case Number/Case Year"]}
                </span>
              </div>
            )}
            {followed["Petitioner versus Respondent"] && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-gray-500 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Parties:</strong> {followed["Petitioner versus Respondent"]}
                </span>
              </div>
            )}
            {followed["Serial Number"] && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Serial Number:</strong> {followed["Serial Number"]}
                </span>
              </div>
            )}
          </>
        )}

        {(followed["View"] || (court === "High_Court" && followed["case_no2"]) || (court === "Supreme_Court" && followed["diary_no"]) || (court === "District_Court" && followed["View"])) && (
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => onView(caseItem)}
              disabled={detailsLoadingId === id}
            >
              {detailsLoadingId === id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              View Details
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-top border-gray-100 dark:border-gray-700">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-500">Followed on {new Date(createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}


