"use client";

import type { WeatherKind } from "@/lib/status";

export type { WeatherKind };

export function WeatherLayer({
  kind,
  className = "",
}: {
  kind: WeatherKind;
  className?: string;
}) {
  if (kind === "none") return null;
  const cls =
    kind === "RAIN"
      ? "wx-rain"
      : kind === "DRY"
        ? "wx-dry"
        : kind === "HEAT"
          ? "wx-heat"
          : kind === "mixed"
            ? "wx-mixed"
            : "wx-off";
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${cls} ${className}`}
      aria-hidden
    />
  );
}
