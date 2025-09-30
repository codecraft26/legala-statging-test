"use client";

import React from "react";
import ResearchShell from "@/components/research-shell";
import SupremeCourtSearch from "../../components/SupremeCourtSearch";

export default function SupremeByPartyPage() {
  return (
    <ResearchShell title="Supreme Court Research - Party Name">
      <SupremeCourtSearch />
    </ResearchShell>
  );
}



