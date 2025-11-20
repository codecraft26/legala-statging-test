"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Scale, Gavel, Building2, Bookmark } from "lucide-react";

export default function ResearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const courts = [
    { id: "supreme", name: "Supreme Court", icon: Gavel, color: "text-black" },
    { id: "high", name: "High Court", icon: Scale, color: "text-black" },
    {
      id: "district",
      name: "District Court",
      icon: Building2,
      color: "text-black",
    },
  ];

  const toggleDropdown = (courtId: string) => {
    setOpenDropdown(openDropdown === courtId ? null : courtId);
  };

  const renderCourtDropdownItems = (courtId: string) => {
    if (courtId === "supreme") {
      return (
        <div className="bg-muted/50 overflow-hidden ml-2 rounded-lg">
          <Link
            href="/research/supremecourt/partyname"
            className="block w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground text-sm transition-colors"
          >
            Search by Party Name
          </Link>
        </div>
      );
    }
    if (courtId === "high") {
      return (
        <div className="bg-muted/50 overflow-hidden ml-2 rounded-lg">
          <Link
            href="/research/highcourt/partyname"
            className="block w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground text-sm transition-colors"
          >
            Search by Party Name
          </Link>
          <Link
            href="/research/highcourt/advocatename"
            className="block w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground text-sm transition-colors"
          >
            Search by Advocate Name
          </Link>
          <Link
            href="/research/highcourt/filingnumber"
            className="block w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground text-sm transition-colors"
          >
            Search by Filing Number
          </Link>
          <Link
            href="/research/highcourt/orders"
            className="block w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground text-sm transition-colors"
          >
            Orders (Delhi HC - Beta)
          </Link>
        </div>
      );
    }
    if (courtId === "district") {
      return (
        <div className="bg-muted/50 overflow-hidden ml-2 rounded-lg">
          <Link
            href="/research/district/partyname"
            className="block w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground text-sm transition-colors"
          >
            Search by Party Name
          </Link>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-52 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 text-foreground flex flex-col shadow-lg border-r border-border p-3">
        <div className="p-3 flex items-center justify-center border-b border-border">
          <h1 className="font-bold text-lg text-foreground">Legal Research</h1>
        </div>

        <Link
          href="/research/following"
          className="flex items-center space-x-3 px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors duration-200 rounded-lg"
        >
          <Bookmark className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">Following</span>
        </Link>

        <div className="my-2 border-b border-border"></div>

        <div className="flex-1 overflow-y-auto">
          {courts.map((court) => {
            const IconComponent = court.icon;
            return (
              <div key={court.id} className="mb-1 overflow-hidden">
                <button
                  className={`flex items-center justify-between w-full px-3 py-2 hover:bg-accent hover:text-accent-foreground text-left transition-colors duration-200 rounded-lg ${
                    openDropdown === court.id
                      ? "bg-accent text-accent-foreground"
                      : ""
                  }`}
                  onClick={() => toggleDropdown(court.id)}
                >
                  <div className="flex items-center space-x-3">
                    <IconComponent className={`h-5 w-5 ${court.color}`} />
                    <span className="font-medium">{court.name}</span>
                  </div>
                  {openDropdown === court.id ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
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
                      className="h-4 w-4"
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
                {openDropdown === court.id &&
                  renderCourtDropdownItems(court.id)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
    </div>
  );
}
