"use client";

import React from "react";

export default function ProgressBar({ currentStep }: { currentStep: number }) {
  const steps = [
    { id: 1, label: "Upload" },
    { id: 2, label: "Configure" },
    { id: 3, label: "Review" },
  ];
  return (
    <div className="flex items-center gap-3">
      {steps.map((s, i) => {
        const active = currentStep >= s.id;
        return (
          <React.Fragment key={s.id}>
            <div className="flex items-center gap-2">
              <div
                className={`size-6 rounded-full border text-xs flex items-center justify-center ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}
              >
                {s.id}
              </div>
              <div
                className={`text-sm ${active ? "" : "text-muted-foreground"}`}
              >
                {s.label}
              </div>
            </div>
            {i < steps.length - 1 ? (
              <div
                className={`h-px w-10 ${currentStep > s.id ? "bg-primary" : "bg-border"}`}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}
