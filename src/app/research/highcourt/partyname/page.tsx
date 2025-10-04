"use client";

import React from "react";
import ResearchShell from "@/components/research-shell";
import HighCourtPartySearch from "../../components/HighCourtPartySearch";

export default function HighCourtByPartyNamePage() {
  return (
    <ResearchShell title="High Court Research - Party Name">
      <HighCourtPartySearch />
    </ResearchShell>
  );
}
