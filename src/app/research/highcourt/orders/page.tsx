"use client";

import React from "react";
import ResearchShell from "@/components/research-shell";
import HighCourtOrdersSearch from "../../components/HighCourtOrdersSearch";

export default function HighCourtOrdersPage() {
  return (
    <ResearchShell title="High Court Research - Orders (Delhi)">
      <HighCourtOrdersSearch />
    </ResearchShell>
  );
}

