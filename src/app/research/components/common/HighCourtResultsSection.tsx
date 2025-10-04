"use client";

import React from "react";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SearchBar from "./SearchBar";
import Pagination from "./Pagination";
import HighCourtAdvocateResultsTable from "./HighCourtAdvocateResultsTable";

interface HighCourtResultsSectionProps {
  results: any[];
  filteredResults: any[];
  currentPageResults: any[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  isRowFollowed: (row: any) => boolean;
  loadingDetailsId: string | null;
  onViewDetails: (row: any) => void;
  onFollow: (row: any) => void;
  followLoading: string | null;
  isLoading?: boolean;
  error?: Error | null;
  searchParams?: any;
  searchType: "advocate" | "filing" | "party";
}

export default function HighCourtResultsSection({
  results,
  filteredResults,
  currentPageResults,
  searchQuery,
  onSearchChange,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  isRowFollowed,
  loadingDetailsId,
  onViewDetails,
  onFollow,
  followLoading,
  isLoading = false,
  error = null,
  searchParams,
  searchType,
}: HighCourtResultsSectionProps) {
  // Success Message
  if (!isLoading && filteredResults.length > 0) {
    return (
      <div className="mt-6 space-y-4">
        {/* Success Message */}
        <Alert>
          <AlertDescription>
            Found {filteredResults.length} case{filteredResults.length !== 1 ? "s" : ""} matching your search criteria.
          </AlertDescription>
        </Alert>

        {/* Results Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-3 mb-3">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Search Results</h3>
                <SearchBar
                  value={searchQuery}
                  onChange={onSearchChange}
                  placeholder="Search cases..."
                  className="w-64"
                />
              </div>
            </div>

            {currentPageResults.length === 0 ? (
              <Alert>
                <Search className="h-4 w-4" />
                <AlertDescription>
                  {searchQuery
                    ? "No cases match your search filter."
                    : "No cases found for your search criteria."}
                  {searchQuery && (
                    <button
                      onClick={() => onSearchChange("")}
                      className="ml-2 text-sm underline hover:no-underline"
                    >
                      Clear search filter
                    </button>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <HighCourtAdvocateResultsTable
                  rows={currentPageResults}
                  isRowFollowed={isRowFollowed}
                  loadingDetailsId={loadingDetailsId}
                  onClickDetails={onViewDetails}
                  onClickFollow={onFollow}
                  followLoading={followLoading}
                />
                
                {/* Footer Pagination */}
                {currentPageResults.length > 0 && (
                  <div className="mt-4">
                    <Pagination
                      page={page}
                      pageSize={pageSize}
                      total={total}
                      onPageChange={onPageChange}
                      onPageSizeChange={onPageSizeChange}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // No Data Found State
  if (!isLoading && filteredResults.length === 0 && !error && searchParams) {
    const getNoDataMessage = () => {
      switch (searchType) {
        case "advocate":
          return `No cases found for advocate "${searchParams.advocate_name}". Please verify the advocate name and search criteria, or try a different search.`;
        case "filing":
          return `No cases found for case number ${searchParams.case_no} in year ${searchParams.rgyear}. Please verify the case number and year, or try a different search.`;
        case "party":
          return `No cases found for party "${searchParams.petres_name}". Please verify the party name and search criteria, or try a different search.`;
        default:
          return "No cases found for your search criteria.";
      }
    };

    return (
      <Card className="mt-6">
        <CardContent className="p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-medium mb-2">No Data Found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {getNoDataMessage()}
          </p>
        </CardContent>
      </Card>
    );
  }

  // No Search Performed State
  if (!isLoading && filteredResults.length === 0 && !error && !searchParams) {
    const getInitialMessage = () => {
      switch (searchType) {
        case "advocate":
          return {
            title: "Search High Court Cases by Advocate Name",
            description: "Enter an advocate name and select your search criteria to find High Court cases. Use the example \"Rajesh\" to test the search functionality."
          };
        case "filing":
          return {
            title: "Search High Court Cases by Filing Number",
            description: "Enter a case number and select the registration year to find High Court cases. Use the example \"5293619\" to test the search functionality."
          };
        case "party":
          return {
            title: "Search High Court Cases by Party Name",
            description: "Enter a party name and select your search criteria to find High Court cases. Use the example \"Tanishk\" to test the search functionality."
          };
        default:
          return {
            title: "Search High Court Cases",
            description: "Enter your search criteria to find High Court cases."
          };
      }
    };

    const message = getInitialMessage();

    return (
      <Card className="mt-6">
        <CardContent className="p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-black" />
          </div>
          <h3 className="text-lg font-medium mb-2">{message.title}</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {message.description}
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
}
