"use client";

import React from "react";
import ResearchShell from "@/components/research-shell";
import HighCourtFilingSearch from "../../components/HighCourtFilingSearch";

export default function HighCourtByFilingPage() {
  return (
    <ResearchShell title="High Court Research - Filing Number">
      <HighCourtFilingSearch />
    </ResearchShell>
  );
}



