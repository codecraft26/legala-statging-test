"use client";

import React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Loader2, Search } from "lucide-react";

interface DistrictSearchFormProps {
  stateName: string;
  setStateName: (v: string) => void;
  states: string[];
  districtsQueryLoading: boolean;
  districtsQueryError: any;
  districtName: string;
  setDistrictName: (v: string) => void;
  apiDistricts: string[];
  uniqueDistricts: string[];
  litigantName: string;
  setLitigantName: (v: string) => void;
  regYear: string;
  setRegYear: (v: string) => void;
  years: string[];
  caseStatus: string;
  setCaseStatus: (v: string) => void;
  estMenuOpen: boolean;
  setEstMenuOpen: (v: boolean) => void;
  estLoading: boolean;
  estError: any;
  estCodeOptions: { code: string; description: string }[];
  selectedEstCodes: string[];
  onToggleEstCode: (code: string) => void;
  onSelectAllEstCodes: () => void;
  onClearAllEstCodes: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSearching: boolean;
}

export default function DistrictSearchForm(props: DistrictSearchFormProps) {
  const {
    stateName, setStateName, states,
    districtsQueryLoading, districtsQueryError,
    districtName, setDistrictName, apiDistricts, uniqueDistricts,
    litigantName, setLitigantName,
    regYear, setRegYear, years,
    caseStatus, setCaseStatus,
    estMenuOpen, setEstMenuOpen,
    estLoading, estError, estCodeOptions, selectedEstCodes,
    onToggleEstCode, onSelectAllEstCodes, onClearAllEstCodes,
    onSubmit, isSearching
  } = props;

  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-md border border-gray-200 dark:border-zinc-800 max-w-2xl">
      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-zinc-300">State</label>
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full text-left border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md px-3 py-2">
                {stateName || "Select state"}
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 max-h-72 overflow-y-auto">
                {districtsQueryLoading ? (
                  <DropdownMenuItem>Loading…</DropdownMenuItem>
                ) : districtsQueryError ? (
                  <DropdownMenuItem>Error loading</DropdownMenuItem>
                ) : (
                  states.map((s) => (
                    <DropdownMenuItem key={s} onClick={() => setStateName(s)}>
                      {s}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-zinc-300">District Name *</label>
            <select
              value={districtName}
              onChange={(e) => setDistrictName(e.target.value)}
              className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-black"
              required
              disabled={districtsQueryLoading || (!!stateName && apiDistricts.length === 0)}
            >
              {(stateName && apiDistricts.length > 0 ? apiDistricts : uniqueDistricts).map((district) => (
                <option key={district} value={district}>
                  {district.charAt(0).toUpperCase() + district.slice(1)}
                </option>
              ))}
            </select>
            <div className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
              {stateName ? `From ${stateName}` : "Example: srinagar"}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-zinc-300">Litigant Name *</label>
            <input
              type="text"
              value={litigantName}
              onChange={(e) => setLitigantName(e.target.value)}
              className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="Enter litigant name"
              required
            />
            <div className="text-sm text-gray-500 mt-1">Example: Ashok</div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-zinc-300">Registration Year</label>
            <select
              value={regYear}
              onChange={(e) => setRegYear(e.target.value)}
              className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-black"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-zinc-300">Case Status</label>
            <select
              value={caseStatus}
              onChange={(e) => setCaseStatus(e.target.value)}
              className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option value="P">P (Pending)</option>
              <option value="D">D (Disposed)</option>
              <option value="A">A (All)</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-zinc-300">Establishment Code *</label>
            <div className="flex gap-2 mb-2">
              <DropdownMenu open={estMenuOpen} onOpenChange={setEstMenuOpen}>
                <DropdownMenuTrigger className="px-3 py-2 text-sm border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 rounded-md">
                  {selectedEstCodes.length > 0 ? `${selectedEstCodes.length} selected` : "Select EST codes"}
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-96 max-h-72 overflow-y-auto">
                  {estLoading ? (
                    <div className="flex items-center justify-center py-2 px-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading EST codes...
                    </div>
                  ) : estError ? (
                    <div className="py-2 px-2 text-sm text-red-600">Error loading EST codes: {String(estError)}</div>
                  ) : estCodeOptions.length > 0 ? (
                    <>
                      <DropdownMenuItem onSelect={(e)=>e.preventDefault()} onClick={onSelectAllEstCodes} className="text-xs">Select All</DropdownMenuItem>
                      <DropdownMenuItem onSelect={(e)=>e.preventDefault()} onClick={onClearAllEstCodes} className="text-xs">Clear All</DropdownMenuItem>
                      <div className="h-px my-1 bg-gray-200" />
                      {estCodeOptions.map((option, index) => (
                        <DropdownMenuCheckboxItem
                          key={index}
                          checked={selectedEstCodes.includes(option.code)}
                          onSelect={(e)=>e.preventDefault()}
                          onCheckedChange={() => onToggleEstCode(option.code)}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{option.code}</span>
                            <span className="text-xs text-gray-500">{option.description}</span>
                          </div>
                        </DropdownMenuCheckboxItem>
                      ))}
                    </>
                  ) : (
                    <div className="py-2 px-2 text-sm text-gray-500">No EST codes available for {districtName}</div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <span className="text-xs text-gray-500 dark:text-zinc-400 self-center">{selectedEstCodes.length} selected</span>
            </div>
          </div>

          <div className="md:col-span-2 md:flex md:justify-end">
            <button
              type="submit"
              className="w-full md:w-auto bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
              disabled={isSearching}
            >
              {isSearching ? (
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


