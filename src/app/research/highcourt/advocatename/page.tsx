"use client";

import React from "react";
import ResearchShell from "@/components/research-shell";
import HighCourtAdvocateSearch from "../../components/HighCourtAdvocateSearch";

export default function HighCourtByAdvocatePage() {
  return (
    <ResearchShell title="High Court Research - Advocate Name">
      <HighCourtAdvocateSearch />
    </ResearchShell>
  );
}
