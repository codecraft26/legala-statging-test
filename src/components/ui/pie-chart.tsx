"use client";

import React from "react";

type PieDatum = {
  label: string;
  value: number;
  color?: string;
};

interface PieChartProps {
  data: PieDatum[];
  size?: number; // px
  innerRadius?: number; // as fraction of radius (0-0.9)
  strokeWidth?: number; // for donut style if using strokes
  className?: string;
}

const DEFAULT_COLORS = [
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#84cc16",
];

export function PieChart({
  data,
  size = 160,
  innerRadius = 0.6,
  strokeWidth = 18,
  className,
}: PieChartProps) {
  const sanitized = (Array.isArray(data) ? data : []).filter((d) => d && d.value > 0);
  const total = sanitized.reduce((acc, d) => acc + (d.value || 0), 0);
  const radius = size / 2;
  const circumference = 2 * Math.PI * (radius - strokeWidth / 2);

  let offsetAcc = 0;

  return (
    <div className={className} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${radius} ${radius})`}>
          {total === 0 ? (
            <circle
              cx={radius}
              cy={radius}
              r={radius - strokeWidth / 2}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
            />
          ) : null}
          {sanitized.map((d, idx) => {
            const value = d.value;
            const frac = value / (total || 1);
            const dash = frac * circumference;
            const dasharray = `${dash} ${circumference - dash}`;
            const strokeDashoffset = offsetAcc;
            offsetAcc += dash;
            return (
              <circle
                key={`${d.label}-${idx}`}
                cx={radius}
                cy={radius}
                r={radius - strokeWidth / 2}
                fill="none"
                stroke={d.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
                strokeWidth={strokeWidth}
                strokeDasharray={dasharray}
                strokeDashoffset={strokeDashoffset}
              />
            );
          })}
        </g>
        {innerRadius > 0 ? (
          <circle
            cx={radius}
            cy={radius}
            r={radius * innerRadius}
            fill="white"
          />
        ) : null}
      </svg>
    </div>
  );
}

export function PieLegend({ data }: { data: PieDatum[] }) {
  const items = (Array.isArray(data) ? data : []).filter((d) => d && d.value >= 0);
  return (
    <div className="flex flex-col gap-1">
      {items.map((d, idx) => (
        <div key={`${d.label}-${idx}`} className="flex items-center gap-2 text-xs">
          <span
            className="inline-block h-2.5 w-2.5 rounded"
            style={{ background: d.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length] }}
          />
          <span className="text-muted-foreground">{d.label}</span>
          <span className="ml-auto tabular-nums">{d.value}</span>
        </div>
      ))}
    </div>
  );
}


