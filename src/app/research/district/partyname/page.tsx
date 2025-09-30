"use client";

import React from "react";
import ResearchShell from "@/components/research-shell";
import DistrictCourtSearch from "../../components/DistrictCourtSearch";

export default function DistrictByPartyPage() {
  return (
    <ResearchShell title="District Court Research - Party Name">
      <DistrictCourtSearch />
    </ResearchShell>
  );
}



