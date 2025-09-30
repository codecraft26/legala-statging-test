"use client";

import React from "react";

export default function StatusPill({ status }: { status: string }) {
  const isCompleted = status === "COMPLETED" || status === "DISPOSED";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isCompleted ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
      {status}
    </span>
  );
}


