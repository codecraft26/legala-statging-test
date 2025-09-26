"use client";

import React, { useState } from "react";
import { Scale, Gavel, Building2, Bookmark, BookOpen } from "lucide-react";
import SupremeCourtSearch from "./components/SupremeCourtSearch";
import SupremeCourtDiarySearch from "./components/SupremeCourtDiarySearch";
import SupremeCourtCaseDetails from "./components/SupremeCourtCaseDetails";
import HighCourtAdvocateSearch from "./components/HighCourtAdvocateSearch";
import HighCourtFilingSearch from "./components/HighCourtFilingSearch";
import DistrictCourtSearch from "./components/DistrictCourtSearch";
import KnowledgeSearch from "./components/KnowledgeSearch";

type CourtType =
  | "supreme"
  | "supreme-diary"
  | "supreme-details"
  | "high-advocate"
  | "high-filing"
  | "district"
  | "following"
  | "knowledge";

const courts = [
  { id: "supreme", name: "Supreme Court", icon: Gavel, color: "text-red-500" },
  { id: "high", name: "High Court", icon: Scale, color: "text-purple-500" },
  {
    id: "district",
    name: "District Court",
    icon: Building2,
    color: "text-green-500",
  },
];

export default function ResearchPage() {
  const [activeCourt, setActiveCourt] = useState<CourtType>("following");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (courtId: string) => {
    setOpenDropdown(openDropdown === courtId ? null : courtId);
  };

  const renderContent = () => {
    switch (activeCourt) {
      case "supreme":
        return <SupremeCourtSearch />;
      case "supreme-diary":
        return <SupremeCourtDiarySearch />;
      case "supreme-details":
        return <SupremeCourtCaseDetails />;
      case "high-advocate":
        return <HighCourtAdvocateSearch />;
      case "high-filing":
        return <HighCourtFilingSearch />;
      case "district":
        return <DistrictCourtSearch />;
      case "knowledge":
        return <KnowledgeSearch />;
      case "following":
        return (
          <div className="p-6">
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Bookmark className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Followed Cases
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Your followed cases will appear here. Start by searching for
                cases in different courts and follow them to track updates.
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-6">
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Scale className="h-12 w-12 text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Legal Research Platform
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Search and track cases across Supreme Court, High Courts, and
                District Courts. Select a court from the sidebar to begin your
                research.
              </p>
            </div>
          </div>
        );
    }
  };

  const renderCourtDropdownItems = (courtId: string) => {
    if (courtId === "supreme") {
      return (
        <div className="bg-gray-50 overflow-hidden ml-2">
          <button
            className={`w-full px-6 py-3 text-left hover:bg-gray-100 text-sm flex items-center space-x-2 transition-colors ${
              activeCourt === "supreme" ? "text-blue-600" : "text-gray-600"
            }`}
            onClick={() => setActiveCourt("supreme")}
          >
            <div
              className={`w-1 h-1 rounded-full ${
                activeCourt === "supreme" ? "bg-blue-600" : "bg-gray-400"
              }`}
            ></div>
            <span>Search by Party Name</span>
          </button>
          <button
            className={`w-full px-6 py-3 text-left hover:bg-gray-100 text-sm flex items-center space-x-2 transition-colors ${
              activeCourt === "supreme-diary"
                ? "text-blue-600"
                : "text-gray-600"
            }`}
            onClick={() => setActiveCourt("supreme-diary")}
          >
            <div
              className={`w-1 h-1 rounded-full ${
                activeCourt === "supreme-diary" ? "bg-blue-600" : "bg-gray-400"
              }`}
            ></div>
            <span>Search by Diary Number</span>
          </button>
          <button
            className={`w-full px-6 py-3 text-left hover:bg-gray-100 text-sm flex items-center space-x-2 transition-colors ${
              activeCourt === "supreme-details"
                ? "text-blue-600"
                : "text-gray-600"
            }`}
            onClick={() => setActiveCourt("supreme-details")}
          >
            <div
              className={`w-1 h-1 rounded-full ${
                activeCourt === "supreme-details"
                  ? "bg-blue-600"
                  : "bg-gray-400"
              }`}
            ></div>
            <span>Get Case Details</span>
          </button>
        </div>
      );
    }

    if (courtId === "high") {
      return (
        <div className="bg-gray-50 overflow-hidden ml-2">
          <button
            className={`w-full px-6 py-3 text-left hover:bg-gray-100 text-sm flex items-center space-x-2 transition-colors ${
              activeCourt === "high-advocate"
                ? "text-blue-600"
                : "text-gray-600"
            }`}
            onClick={() => setActiveCourt("high-advocate")}
          >
            <div
              className={`w-1 h-1 rounded-full ${
                activeCourt === "high-advocate" ? "bg-blue-600" : "bg-gray-400"
              }`}
            ></div>
            <span>Search by Advocate Name</span>
          </button>
          <button
            className={`w-full px-6 py-3 text-left hover:bg-gray-100 text-sm flex items-center space-x-2 transition-colors ${
              activeCourt === "high-filing" ? "text-blue-600" : "text-gray-600"
            }`}
            onClick={() => setActiveCourt("high-filing")}
          >
            <div
              className={`w-1 h-1 rounded-full ${
                activeCourt === "high-filing" ? "bg-blue-600" : "bg-gray-400"
              }`}
            ></div>
            <span>Search by Filing Number</span>
          </button>
        </div>
      );
    }

    if (courtId === "district") {
      return (
        <div className="bg-gray-50 overflow-hidden ml-2">
          <button
            className={`w-full px-6 py-3 text-left hover:bg-gray-100 text-sm flex items-center space-x-2 transition-colors ${
              activeCourt === "district" ? "text-blue-600" : "text-gray-600"
            }`}
            onClick={() => setActiveCourt("district")}
          >
            <div
              className={`w-1 h-1 rounded-full ${
                activeCourt === "district" ? "bg-blue-600" : "bg-gray-400"
              }`}
            ></div>
            <span>Search by Party Name</span>
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-52 bg-white flex flex-col shadow-md">
        {/* App title */}
        <div className="bg-white-600 p-9 flex items-center justify-center border-b">
          <h1 className="font-bold text-lg text-gray-800">Legal Research</h1>
        </div>

        {/* Following button */}
        <button
          className={`flex items-center space-x-3 px-6 py-4 hover:bg-gray-50 transition-colors duration-200 ${
            activeCourt === "following"
              ? "text-blue-600 bg-gray-50"
              : "text-gray-700"
          }`}
          onClick={() => setActiveCourt("following")}
        >
          <Bookmark className="h-5 w-5" />
          <span className="font-medium">Following</span>
        </button>

        {/* Knowledge Search label */}
        <div className="flex items-center space-x-3 px-6 py-4 text-gray-500 cursor-default">
          <BookOpen className="h-5 w-5" />
          <span className="font-medium">Knowledge Research</span>
        </div>

        {/* Divider */}
        <div className="mx-4 my-2 border-b border-gray-100"></div>

        {/* Court navigation */}
        <div className="flex-1 overflow-y-auto px-2">
          {courts.map((court) => {
            const IconComponent = court.icon;
            return (
              <div key={court.id} className="mb-1 overflow-hidden">
                <button
                  className={`flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 text-left transition-colors duration-200 ${
                    openDropdown === court.id
                      ? "bg-gray-50 text-blue-600"
                      : "text-gray-700"
                  }`}
                  onClick={() => toggleDropdown(court.id)}
                >
                  <div className="flex items-center space-x-3">
                    <IconComponent className={`h-5 w-5 ${court.color}`} />
                    <span
                      className={`font-medium ${
                        openDropdown === court.id ? "text-blue-600" : ""
                      }`}
                    >
                      {court.name}
                    </span>
                  </div>
                  {openDropdown === court.id ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-blue-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>

                {/* Dynamic dropdown menu based on court */}
                {openDropdown === court.id &&
                  renderCourtDropdownItems(court.id)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {activeCourt === "following"
                  ? "Followed Cases"
                  : activeCourt === "supreme"
                    ? "Supreme Court Research"
                    : activeCourt === "supreme-diary"
                      ? "Supreme Court Research"
                      : activeCourt === "supreme-details"
                        ? "Supreme Court Research"
                        : activeCourt === "high-advocate"
                          ? "High Court Research"
                          : activeCourt === "high-filing"
                            ? "High Court Research"
                            : activeCourt === "district"
                              ? "District Court Research"
                              : activeCourt === "knowledge"
                                ? "Legal Knowledge Search"
                                : "Legal Research"}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {activeCourt === "following"
                  ? "Track and manage your followed legal cases"
                  : activeCourt === "supreme"
                    ? "Search Supreme Court cases by party name"
                    : activeCourt === "supreme-diary"
                      ? "Search Supreme Court cases by diary number"
                      : activeCourt === "supreme-details"
                        ? "Get detailed information about Supreme Court cases"
                        : activeCourt === "high-advocate"
                          ? "Search High Court cases by advocate name"
                          : activeCourt === "high-filing"
                            ? "Search High Court cases by filing number"
                            : activeCourt === "district"
                              ? "Search District Court cases by party name"
                              : activeCourt === "knowledge"
                                ? "Search legal judgments, statutes, and precedents using AI"
                                : "Search and analyze legal cases across different courts"}
              </p>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
