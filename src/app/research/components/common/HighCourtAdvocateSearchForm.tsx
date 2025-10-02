"use client";

import React from "react";

export default function HighCourtAdvocateSearchForm({
  courtCode,
  setCourtCode,
  stateCode,
  setStateCode,
  courtComplexCode,
  setCourtComplexCode,
  advocateName,
  setAdvocateName,
  filterType,
  setFilterType,
  courtCodeMapping,
  stateCodeMapping,
  courtComplexMapping,
  onSubmit,
  isSearching,
}: {
  courtCode: string;
  setCourtCode: (v: string) => void;
  stateCode: string;
  setStateCode: (v: string) => void;
  courtComplexCode: string;
  setCourtComplexCode: (v: string) => void;
  advocateName: string;
  setAdvocateName: (v: string) => void;
  filterType: "P" | "R" | "Both";
  setFilterType: (v: "P" | "R" | "Both") => void;
  courtCodeMapping: Array<{ code: string; name: string }>;
  stateCodeMapping: Array<{ code: string; name: string }>;
  courtComplexMapping: Array<{ code: string; name: string }>;
  onSubmit: (e: React.FormEvent) => void;
  isSearching: boolean;
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-zinc-300">
            Court Type
          </label>
          <select
            value={courtCode}
            onChange={(e) => setCourtCode(e.target.value)}
            className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-black"
          >
            {courtCodeMapping.map((court) => (
              <option key={court.code} value={court.code}>
                {court.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-zinc-300">
            State
          </label>
          <select
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value)}
            className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-black"
          >
            {stateCodeMapping.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-zinc-300">
            Court Complex
          </label>
          <select
            value={courtComplexCode}
            onChange={(e) => setCourtComplexCode(e.target.value)}
            className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-black"
          >
            {courtComplexMapping.map((complex) => (
              <option key={complex.code} value={complex.code}>
                {complex.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-zinc-300">
            Advocate Name *
          </label>
          <input
            type="text"
            value={advocateName}
            onChange={(e) => setAdvocateName(e.target.value)}
            className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-black"
            placeholder="Enter advocate name"
            required
          />
          <div className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Example: John Doe
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Filter Type
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="Both">Both</option>
            <option value="P">Petitioner</option>
            <option value="R">Respondent</option>
          </select>
        </div>

        <div className="md:col-span-2 md:flex md:justify-end">
          <button
            type="submit"
            className="w-full md:w-auto bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
            disabled={isSearching}
          >
            {isSearching ? (
              <div className="flex items-center space-x-2">
                <span className="inline-block h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                <span>Searching...</span>
              </div>
            ) : (
              <span>Search</span>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
