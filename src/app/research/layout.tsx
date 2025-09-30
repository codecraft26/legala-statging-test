"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Scale, Gavel, Building2, Bookmark } from "lucide-react";

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const courts = [
    { id: "supreme", name: "Supreme Court", icon: Gavel, color: "text-red-500" },
    { id: "high", name: "High Court", icon: Scale, color: "text-purple-500" },
    { id: "district", name: "District Court", icon: Building2, color: "text-green-500" },
  ];

  const toggleDropdown = (courtId: string) => {
    setOpenDropdown(openDropdown === courtId ? null : courtId);
  };

  const renderCourtDropdownItems = (courtId: string) => {
    if (courtId === "supreme") {
      return (
        <div className="bg-gray-50 dark:bg-zinc-900 overflow-hidden ml-2">
          <Link href="/research/supremecourt/partyname" className="block w-full px-6 py-3 text-left hover:bg-gray-100 dark:hover:bg-zinc-800 text-sm">Search by Party Name</Link>
        </div>
      );
    }
    if (courtId === "high") {
      return (
        <div className="bg-gray-50 dark:bg-zinc-900 overflow-hidden ml-2">
          <Link href="/research/highcourt/advocatename" className="block w-full px-6 py-3 text-left hover:bg-gray-100 dark:hover:bg-zinc-800 text-sm">Search by Advocate Name</Link>
          <Link href="/research/highcourt/filingnumber" className="block w-full px-6 py-3 text-left hover:bg-gray-100 dark:hover:bg-zinc-800 text-sm">Search by Filing Number</Link>
        </div>
      );
    }
    if (courtId === "district") {
      return (
        <div className="bg-gray-50 dark:bg-zinc-900 overflow-hidden ml-2">
          <Link href="/research/district/partyname" className="block w-full px-6 py-3 text-left hover:bg-gray-100 dark:hover:bg-zinc-800 text-sm">Search by Party Name</Link>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-52 bg-card text-card-foreground flex flex-col shadow-md">
        <div className="p-9 flex items-center justify-center border-b border-border">
          <h1 className="font-bold text-lg">Legal Research</h1>
        </div>

        <Link
          href="/research/following"
          className="flex items-center space-x-3 px-6 py-4 hover:bg-accent transition-colors duration-200"
        >
          <Bookmark className="h-5 w-5" />
          <span className="font-medium">Following</span>
        </Link>

        <div className="mx-4 my-2 border-b border-border"></div>

        <div className="flex-1 overflow-y-auto px-2">
          {courts.map((court) => {
            const IconComponent = court.icon;
            return (
              <div key={court.id} className="mb-1 overflow-hidden">
                <button
                  className={`flex items-center justify-between w-full px-4 py-3 hover:bg-accent text-left transition-colors duration-200 ${
                    openDropdown === court.id ? "bg-accent text-accent-foreground" : ""
                  }`}
                  onClick={() => toggleDropdown(court.id)}
                >
                  <div className="flex items-center space-x-3">
                    <IconComponent className={`h-5 w-5 ${court.color}`} />
                    <span className="font-medium">{court.name}</span>
                  </div>
                  {openDropdown === court.id ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                {openDropdown === court.id && renderCourtDropdownItems(court.id)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}


