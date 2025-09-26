"use client";

import React, { useState } from "react";
import {
  Search,
  Download,
  ExternalLink,
  FileText,
  Scale,
  Gavel,
  BookOpen,
  Loader2,
} from "lucide-react";

interface SearchResults {
  indakanoon?: any[];
  perplexity?: string;
}

export default function KnowledgeSearch() {
  // Search state
  const [keyword, setKeyword] = useState("");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResults | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("indakanoon");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!keyword.trim() || !query.trim()) {
      setError("Please enter both keyword and query");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchResults(null);

    try {
      const requestBody = {
        keyword: keyword,
        query: query,
      };

      const response = await fetch(
        "https://infrahive-ai-legal-research-gyfsavdfd0c9ehh5.centralindia-01.azurewebsites.net/legal-infrahive/indiakanoon/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "ECIAPI-XXaRks8npWTVUXpFpYc6nGj88cwPMq25",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      if (!data) {
        throw new Error("Empty response from server");
      }

      if (!data.indakanoon || !Array.isArray(data.indakanoon)) {
        throw new Error("Invalid IndiaKanoon data format");
      }

      if (!data.perplexity) {
        throw new Error("No valid perplexity results found in response");
      }

      setSearchResults(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch results";
      setError(errorMessage);
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const processStyledText = (text: string) => {
    if (!text || typeof text !== "string") return text;

    // Handle HTML <b> tags and markdown-style formatting
    const parts = [];
    let lastIndex = 0;

    // Handle <b> tags
    const boldTagRegex = /<b>(.*?)<\/b>/g;
    let match;

    while ((match = boldTagRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      parts.push(<strong key={`bold-tag-${match.index}`}>{match[1]}</strong>);
      lastIndex = boldTagRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);

      // Handle markdown-style **bold** and *semi-bold*
      const styleRegex = /(\*\*([^*]+?)\*\*|\*([^*]+?)\*)/g;
      let styleMatch;
      let styleLastIndex = 0;
      const styleParts = [];

      while ((styleMatch = styleRegex.exec(remainingText)) !== null) {
        if (styleMatch.index > styleLastIndex) {
          styleParts.push(
            remainingText.substring(styleLastIndex, styleMatch.index)
          );
        }

        if (styleMatch[0].startsWith("**")) {
          styleParts.push(
            <strong key={`bold-md-${styleMatch.index}`}>{styleMatch[2]}</strong>
          );
        } else {
          styleParts.push(
            <span
              key={`semi-bold-md-${styleMatch.index}`}
              style={{ fontWeight: 600 }}
            >
              {styleMatch[3]}
            </span>
          );
        }

        styleLastIndex = styleRegex.lastIndex;
      }

      if (styleLastIndex < remainingText.length) {
        styleParts.push(remainingText.substring(styleLastIndex));
      }

      parts.push(styleParts.length > 1 ? styleParts : styleParts[0]);
    }

    return parts.length > 0 ? parts : text;
  };

  const formatPerplexityResults = (text: string) => {
    if (!text) {
      return (
        <p className="text-gray-600">
          No analysis available for this query. Please try a different search.
        </p>
      );
    }

    const normalizedText = text
      .replace(/__BOLD_START__/g, "**")
      .replace(/__BOLD_END__/g, "**")
      .replace(/\*\*(.*?)\*\*/g, "**$1**")
      .replace(/\*(.*?)\*/g, "*$1*");

    const paragraphs = normalizedText
      .split("\n\n")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (paragraphs.length === 0) {
      return <div className="p-4">{processStyledText(normalizedText)}</div>;
    }

    const sections = [];
    let currentSection = {
      heading: "Results",
      content: [] as string[],
    };

    paragraphs.forEach((para) => {
      if (para.startsWith("##")) {
        if (currentSection.content.length > 0) {
          sections.push(currentSection);
        }
        currentSection = {
          heading: para.replace(/^##\s*/, ""),
          content: [],
        };
      } else {
        currentSection.content.push(para);
      }
    });

    if (currentSection.content.length > 0) {
      sections.push(currentSection);
    }

    if (sections.length === 0) {
      sections.push({
        heading: "Results",
        content: paragraphs,
      });
    }

    return (
      <div className="space-y-6">
        {sections.map((section, sectionIndex) => (
          <div
            key={`section-${sectionIndex}`}
            className="bg-white rounded-lg shadow-sm overflow-hidden"
          >
            <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
              <h3 className="text-lg font-semibold text-blue-600">
                {processStyledText(section.heading)}
              </h3>
            </div>

            <div className="p-4">
              {section.content.map((para, paraIndex) => (
                <div key={`para-${sectionIndex}-${paraIndex}`} className="my-3">
                  {para.split("\n").map((line, lineIdx) => {
                    if (!line.trim()) return null;

                    if (/^\s*[\*\-]\s/.test(line)) {
                      return (
                        <div key={`line-${lineIdx}`} className="flex ml-4 my-1">
                          <span className="mr-2">•</span>
                          <span>
                            {processStyledText(line.replace(/^[\*\-]\s*/, ""))}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <p
                        key={`line-${lineIdx}`}
                        className={lineIdx > 0 ? "mt-1" : ""}
                      >
                        {processStyledText(line)}
                      </p>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getCourtIcon = (courtName: string) => {
    if (!courtName) return <Scale className="h-5 w-5 text-blue-500" />;

    if (courtName.toLowerCase().includes("supreme")) {
      return <Gavel className="h-5 w-5 text-red-500" />;
    } else if (courtName.toLowerCase().includes("high")) {
      return <Scale className="h-5 w-5 text-purple-500" />;
    } else {
      return <BookOpen className="h-5 w-5 text-green-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatIndiaKanoonResults = (results: any[]) => {
    if (!results || !Array.isArray(results)) {
      return (
        <div className="bg-blue-50 rounded-lg p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No case law found
          </h3>
          <p className="text-gray-600">
            Please try a different query or modify your search terms
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {results.map((caseItem, index) => (
          <div
            key={`case-${index}`}
            className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md"
          >
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-blue-100 p-3 rounded-lg">
                  {getCourtIcon(caseItem.docsource)}
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {index + 1}. {processStyledText(caseItem.title)}
                    </h3>
                  </div>

                  {caseItem.citation && (
                    <p className="mt-1 text-sm text-gray-500">
                      {caseItem.citation}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Case ID
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {caseItem.tid || "N/A"}
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDate(caseItem.publishdate)}
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Court
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {caseItem.docsource || "N/A"}
                  </p>
                </div>

                {caseItem.author && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {caseItem.author}
                    </p>
                  </div>
                )}

                {caseItem.bench && caseItem.bench.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bench
                    </p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {caseItem.bench.join(", ")}
                    </p>
                  </div>
                )}

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Citations
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {caseItem.numcites || "0"}
                  </p>
                </div>
              </div>

              {caseItem.headline && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Summary
                  </h4>
                  <div className="prose prose-sm max-w-none text-gray-700 bg-blue-50 rounded-lg p-4">
                    {caseItem.headline
                      .split("\n")
                      .map((line: string, lineIndex: number) => (
                        <p
                          key={`headline-${lineIndex}`}
                          className={lineIndex > 0 ? "mt-2" : ""}
                        >
                          {processStyledText(line)}
                        </p>
                      ))}
                  </div>
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {caseItem.document && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors duration-150">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-200 p-2 rounded-md">
                        <ExternalLink className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-blue-800">
                          Case Document
                        </h4>
                        <p className="text-xs text-blue-600">
                          View full case details
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <a
                        href={caseItem.document}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Document
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-2">
            <span className="text-2xl text-blue-600 font-medium">
              Legal Knowledge Search
            </span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Legal Research Assistant
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find relevant legal judgments, statutes, and precedents with our
            advanced legal search capabilities
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <form onSubmit={handleSearch} className="p-6">
            <div className="flex flex-col gap-4">
              <div className="w-full">
                <label
                  htmlFor="query"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Legal Query
                </label>
                <input
                  id="query"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter your legal query"
                  className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>

              <div className="flex flex-row gap-4">
                <div className="flex-grow">
                  <label
                    htmlFor="keyword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Keyword
                  </label>
                  <input
                    id="keyword"
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Enter keyword (e.g., Supreme Court of India)"
                    className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                        Searching...
                      </div>
                    ) : (
                      <>
                        <Search className="mr-2 h-5 w-5" />
                        Search
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-2 text-sm text-gray-500">
              Example: Keyword &quot;Supreme Court of India&quot;, Query
              &quot;what are the major judgements on merger and disputes.&quot;
            </div>
          </form>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 rounded-md border border-red-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">
              Searching for legal information...
            </p>
          </div>
        )}

        {searchResults && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Search Results
                </h2>
              </div>

              <div className="border-b border-gray-200 mb-6">
                <div className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab("indakanoon")}
                    className={`px-4 py-2 font-medium text-sm ${
                      activeTab === "indakanoon"
                        ? "border-b-2 border-blue-600 text-blue-600"
                        : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    IndiaKanoon
                  </button>
                  <button
                    onClick={() => setActiveTab("perplexity")}
                    className={`px-4 py-2 font-medium text-sm ${
                      activeTab === "perplexity"
                        ? "border-b-2 border-blue-600 text-blue-600"
                        : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Web Search
                  </button>
                </div>
              </div>

              <div className="prose max-w-none">
                {searchResults && (
                  <>
                    {activeTab === "indakanoon" &&
                      formatIndiaKanoonResults(searchResults.indakanoon || [])}
                    {activeTab === "perplexity" &&
                      formatPerplexityResults(searchResults.perplexity || "")}
                  </>
                )}
              </div>

              <div className="mt-8 border-t border-gray-200 pt-6">
                <p className="text-sm text-gray-500 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Results based on legal precedents and case law from Indian
                  courts and legal databases.
                </p>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !searchResults && !error && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <div className="text-center py-8">
                <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Start Your Legal Research
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Enter a keyword and query about legal topics to get AI-powered
                  insights from legal databases.
                </p>
              </div>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Example Keywords
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>&quot;Supreme Court of India&quot;</li>
                    <li>&quot;High Court&quot;</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Example Queries
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>&quot;Major judgments on merger and disputes&quot;</li>
                    <li>&quot;Recent cases on privacy law&quot;</li>
                    <li>
                      &quot;Landmark decisions on environmental protection&quot;
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
