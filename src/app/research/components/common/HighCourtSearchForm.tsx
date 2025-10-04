"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useHighCourts, useHighCourtInfo } from "@/hooks/use-research";

interface Court {
  name: string;
  benches: string[];
}

interface HighCourtSearchFormProps {
  title: string;
  onSubmit: (params: {
    courtCode: number;
    stateCode: number;
    courtComplexCode: number;
    selectedCourt: string;
    selectedBench: string;
  }) => void;
  isLoading?: boolean;
  children: React.ReactNode;
}

export default function HighCourtSearchForm({
  title,
  onSubmit,
  isLoading = false,
  children,
}: HighCourtSearchFormProps) {
  const [selectedCourt, setSelectedCourt] = useState("");
  const [courtSearch, setCourtSearch] = useState("");
  const [showCourtDropdown, setShowCourtDropdown] = useState(false);
  const [benches, setBenches] = useState<string[]>([]);
  const [selectedBench, setSelectedBench] = useState("");
  const [courtCode, setCourtCode] = useState<number | null>(null);
  const [stateCode, setStateCode] = useState<number | null>(null);
  const [courtComplexCode, setCourtComplexCode] = useState<number | null>(null);

  const courtInputRef = useRef<HTMLDivElement>(null);

  // Use the courts hook
  const courtsQuery = useHighCourts();
  const courts = useMemo(() => courtsQuery.data?.courts || [], [courtsQuery.data?.courts]);

  // Use the court info hook
  const courtInfoQuery = useHighCourtInfo(selectedCourt, selectedBench);

  // Handle click outside to close court dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (courtInputRef.current && !courtInputRef.current.contains(event.target as Node)) {
        setShowCourtDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update benches when selectedCourt changes
  useEffect(() => {
    if (selectedCourt) {
      const court = courts.find((c: any) => c.name === selectedCourt);
      setBenches(court ? court.benches : []);
      setSelectedBench(""); // Reset bench selection when court changes
      setCourtCode(null); // Reset court code
      setStateCode(null); // Reset state code
    } else {
      setBenches([]);
      setSelectedBench("");
      setCourtCode(null);
      setStateCode(null);
    }
  }, [selectedCourt, courts]);

  // Update court codes when court info is fetched
  useEffect(() => {
    if (courtInfoQuery.data) {
      const courtInfo = courtInfoQuery.data;
      setCourtCode(courtInfo.court_code || null);
      setStateCode(courtInfo.state_cd || null);
      setCourtComplexCode(courtInfo.court_code || null);
    } else if (courtInfoQuery.error) {
      setCourtCode(null);
      setStateCode(null);
      setCourtComplexCode(null);
    }
  }, [courtInfoQuery.data, courtInfoQuery.error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCourt || !selectedBench) {
      alert("Please select both court and bench");
      return;
    }
    if (!courtCode || !stateCode || !courtComplexCode) {
      alert("Court details are still loading. Please wait a moment and try again.");
      return;
    }

    onSubmit({
      courtCode,
      stateCode,
      courtComplexCode,
      selectedCourt,
      selectedBench,
    });
  };

  const filteredCourts = courts.filter((court: any) =>
    court.name.toLowerCase().includes(courtSearch.toLowerCase())
  );

  const isFormValid = selectedCourt && selectedBench && courtCode && stateCode && courtComplexCode;
  const isSubmitting = isLoading || courtInfoQuery.isLoading;

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Court Selection */}
          <div className="space-y-2">
            <Label htmlFor="court-select">Court</Label>
            <div className="relative" ref={courtInputRef}>
              <Input
                type="text"
                value={courtSearch}
                onChange={(e) => {
                  setCourtSearch(e.target.value);
                  setShowCourtDropdown(true);
                }}
                onFocus={() => setShowCourtDropdown(true)}
                placeholder="Search for a court..."
              />
              {showCourtDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredCourts.map((court: any) => (
                    <div
                      key={court.name}
                      className="px-3 py-2 hover:bg-accent cursor-pointer"
                      onClick={() => {
                        setSelectedCourt(court.name);
                        setCourtSearch(court.name);
                        setShowCourtDropdown(false);
                      }}
                    >
                      {court.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bench Selection */}
          {selectedCourt && benches.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="bench-select">Bench</Label>
              <select
                id="bench-select"
                value={selectedBench}
                onChange={(e) => setSelectedBench(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a bench</option>
                {benches.map((bench) => (
                  <option key={bench} value={bench}>
                    {bench}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Custom Form Fields */}
          {children}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {courtInfoQuery.isLoading ? "Loading Court Details..." : "Searching..."}
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search Cases
              </>
            )}
          </Button>
        </form>

        {/* Court Info Status */}
        {selectedCourt && selectedBench && (
          <div className="mt-4">
            {courtInfoQuery.isLoading && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-blue-700 flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading court information...</span>
              </div>
            )}
            {courtInfoQuery.error && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-700">
                <span className="text-sm">
                  Warning: Could not load court information. Search may not work properly.
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
