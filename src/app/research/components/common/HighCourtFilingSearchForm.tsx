"use client";

import React from "react";
import { Search, Loader2 } from "lucide-react";
import {
  stateCodeMapping,
  courtComplexMapping,
  courtCodeMapping,
} from "../../utils/courtMappings";

export default function HighCourtFilingSearchForm({
  courtCode,
  setCourtCode,
  stateCode,
  setStateCode,
  courtComplexCode,
  setCourtComplexCode,
  caseNo,
  setCaseNo,
  rgYear,
  setRgYear,
  years,
  onSubmit,
  isLoading,
}: {
  courtCode: string;
  setCourtCode: (v: string) => void;
  stateCode: string;
  setStateCode: (v: string) => void;
  courtComplexCode: string;
  setCourtComplexCode: (v: string) => void;
  caseNo: string;
  setCaseNo: (v: string) => void;
  rgYear: string;
  setRgYear: (v: string) => void;
  years: string[];
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-md border border-gray-200 dark:border-zinc-800 max-w-2xl">
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
              Case Number *
            </label>
            <input
              type="number"
              value={caseNo}
              onChange={(e) => setCaseNo(e.target.value)}
              className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="5293619"
              required
            />
            <div className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
              Example: 5293619
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-zinc-300">
              Registration Year
            </label>
            <select
              value={rgYear}
              onChange={(e) => setRgYear(e.target.value)}
              className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-black"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 md:flex md:justify-end">
            <button
              type="submit"
              className="w-full md:w-auto bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Searching...</span>
                </div>
              ) : (
                <>
                  <Search size={16} />
                  <span>Search</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
