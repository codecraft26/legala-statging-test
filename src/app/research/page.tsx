"use client";

import React, { useState } from "react";
import Header from "./components/Header";
import Following from "./components/Following";
import SearchParty from "./components/SearchParty";
import HighCourtPartySearch from "./components/HighCourtPartySearch";
import DistrictPartySearch from "./components/DistrictPartySearch";

type CourtId = "supreme" | "high" | "district" | "cat" | "nclt" | "consumer";

export default function LegalAiResearch() {
  const [openDropdown, setOpenDropdown] = useState<CourtId | null>(null);
  const [activePage, setActivePage] = useState<string>("following");
  const [dateInput, setDateInput] = useState("");
  const [partyNameInput, setPartyNameInput] = useState("");
  const [filingNumberInput, setFilingNumberInput] = useState("");
  const [advocateNameInput, setAdvocateNameInput] = useState("");
  const [advocateNumberInput, setAdvocateNumberInput] = useState("");
  const [caseDetailsInput, setCaseDetailsInput] = useState("");
  const [cartItems, setCartItems] = useState<Record<string, unknown>>({});
  const [following, setFollowing] = useState<
    Array<{ id: string; title: string; court: string; date: string }>
  >([
    {
      id: "f1",
      title: "ABC vs State",
      court: "Supreme Court",
      date: new Date().toISOString(),
    },
    {
      id: "f2",
      title: "XYZ vs Union",
      court: "High Court",
      date: new Date(Date.now() - 86400000).toISOString(),
    },
  ]);

  const courts = [
    { id: "supreme", name: "Supreme Court" },
    { id: "high", name: "High Court" },
    { id: "district", name: "District Court" },
  ] as const;

  const toggleDropdown = (court: CourtId) => {
    setOpenDropdown(openDropdown === court ? null : court);
  };

  const handleShowFollowingPage = () => setActivePage("following");

  const renderContent = () => {
    if (activePage === "following") {
      return (
        <div className="p-6">
          <Following
            items={following}
            onView={(id) => console.warn("view", id)}
            onUnfollow={(id) =>
              setFollowing((f) => f.filter((x) => x.id !== id))
            }
          />
        </div>
      );
    }
    const court = activePage.split("-")[0] as CourtId;
    if (activePage.endsWith("party")) {
      return (
        <div className="p-6">
          {court === "high" ? (
            <HighCourtPartySearch />
          ) : court === "district" ? (
            <DistrictPartySearch />
          ) : (
            <SearchParty court={court} />
          )}
        </div>
      );
    }
    return (
      <div className="p-6">
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          Search page: {activePage}
        </div>
      </div>
    );
  };

  const renderCourtDropdownItems = (courtId: CourtId) => {
    return (
      <div className="bg-gray-50 overflow-hidden ml-2">
        <button
          className={`w-full px-6 py-3 text-left hover:bg-gray-100 text-sm flex items-center space-x-2 transition-colors ${activePage === `${courtId}-party` ? "text-blue-600" : "text-gray-600"}`}
          onClick={() => setActivePage(`${courtId}-party`)}
        >
          <div
            className={`w-1 h-1 rounded-full ${activePage === `${courtId}-party` ? "bg-blue-600" : "bg-gray-400"}`}
          />
          <span>Search by Party Name</span>
        </button>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100svh-56px)] bg-background">
      <div className="w-52 bg-card flex flex-col border-r">
        <div className="p-6 border-b border-border"></div>
        <button
          className={`flex items-center space-x-3 px-6 py-4 transition-colors duration-200 hover:bg-accent ${activePage === "following" ? "text-foreground bg-accent" : "text-foreground"}`}
          onClick={handleShowFollowingPage}
        >
          <span className="font-medium">Following</span>
        </button>
        <div className="mx-4 my-2 border-b border-border" />
        <div className="flex-1 overflow-y-auto px-2">
          {courts.map((court) => (
            <div key={court.id} className="mb-1 overflow-hidden">
              <button
                className={`flex items-center justify-between w-full px-4 py-3 text-left transition-colors duration-200 hover:bg-accent ${openDropdown === court.id ? "bg-accent text-foreground" : "text-foreground"}`}
                onClick={() => toggleDropdown(court.id)}
              >
                <span className={`font-medium`}>{court.name}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-muted-foreground"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {openDropdown === court.id && renderCourtDropdownItems(court.id)}
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-background">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
