import type { Cover, CoverState } from "./contract";
import { TEMPLATES } from "./templates";

export type DisplayCover = Cover & {
  demo: boolean;
  place: string;
};

/**
 * Sample rows from the existing scaffold. Labeled DEMO.
 * IDs use a demo- prefix so they cannot collide with live cover-{n}.
 * Observed millimetres are only the three settlement-path examples
 * already in the repo. OPEN rows do not invent a reading.
 */
export const DEMO_COVERS: DisplayCover[] = [
  {
    demo: true,
    id: "demo-1",
    buyer: "0xDEMO000000000000000000000000000000000001",
    template: "RAIN",
    lat: "19.0760",
    lon: "72.8777",
    place: "Mumbai",
    coverage_date: "2026-08-20",
    threshold_milli: 10000,
    premium: "1000000000000000000",
    payout: "4000000000000000000",
    state: "RESOLVED_PAY",
    evidence_url: evidenceUrl("19.0760", "72.8777", "2026-08-20", "RAIN"),
    observed_milli: "16200",
    result: {
      status: "PAY",
      amount_wei: "4000000000000000000",
      reason: "precipitation_sum at or above threshold",
      observed_milli: 16200,
    },
    created_at: "2026-08-17T00:00:00.000Z",
  },
  {
    demo: true,
    id: "demo-2",
    buyer: "0xDEMO000000000000000000000000000000000002",
    template: "RAIN",
    lat: "51.5074",
    lon: "-0.1278",
    place: "London",
    coverage_date: "2026-08-18",
    threshold_milli: 50000,
    premium: "1000000000000000000",
    payout: "4000000000000000000",
    state: "RESOLVED_KEEP",
    evidence_url: evidenceUrl("51.5074", "-0.1278", "2026-08-18", "RAIN"),
    observed_milli: "1000",
    result: {
      status: "KEEP",
      amount_wei: "0",
      reason: "precipitation_sum below threshold",
      observed_milli: 1000,
    },
    created_at: "2026-08-15T00:00:00.000Z",
  },
  {
    demo: true,
    id: "demo-3",
    buyer: "0xDEMO000000000000000000000000000000000003",
    template: "DRY",
    lat: "-1.2921",
    lon: "36.8219",
    place: "Nairobi",
    coverage_date: "2026-08-21",
    threshold_milli: 500,
    premium: "1000000000000000000",
    payout: "4000000000000000000",
    state: "INSUFFICIENT",
    evidence_url: evidenceUrl("-1.2921", "36.8219", "2026-08-21", "DRY"),
    observed_milli: "",
    result: {
      status: "INSUFFICIENT",
      amount_wei: "1000000000000000000",
      reason: "missing/null JSON field",
      observed_milli: null,
    },
    created_at: "2026-08-18T00:00:00.000Z",
  },
  {
    demo: true,
    id: "demo-4",
    buyer: "0xDEMO000000000000000000000000000000000004",
    template: "HEAT",
    lat: "1.3521",
    lon: "103.8198",
    place: "Singapore",
    coverage_date: "2026-09-15",
    threshold_milli: 35000,
    premium: "1000000000000000000",
    payout: "4000000000000000000",
    state: "OPEN",
    evidence_url: evidenceUrl("1.3521", "103.8198", "2026-09-15", "HEAT"),
    observed_milli: "",
    result: null,
    created_at: "2026-08-20T00:00:00.000Z",
  },
];

export function evidenceUrl(
  lat: string,
  lon: string,
  date: string,
  template: "RAIN" | "DRY" | "HEAT" = "RAIN"
): string {
  const field = template === "HEAT" ? "temperature_2m_max" : "precipitation_sum";
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    start_date: date,
    end_date: date,
    daily: field,
    timezone: "UTC",
  });
  return `https://historical-forecast-api.open-meteo.com/v1/forecast?${params.toString()}`;
}

export function getDemoCover(id: string): DisplayCover | undefined {
  return DEMO_COVERS.find((c) => c.id === id);
}

export function placeFor(lat: string, lon: string): string {
  const hit = CITIES.find(
    (c) => Number(c.lat).toFixed(4) === Number(lat).toFixed(4) && Number(c.lon).toFixed(4) === Number(lon).toFixed(4)
  );
  return hit?.name ?? `${lat}, ${lon}`;
}

export function asDisplay(cover: Cover, demo = false): DisplayCover {
  return { ...cover, demo, place: placeFor(cover.lat, cover.lon) };
}

export function observedDisplay(cover: {
  state: CoverState;
  observed_milli: string;
  template: "RAIN" | "DRY" | "HEAT";
}): string {
  if (cover.state === "INSUFFICIENT") return "null";
  if (cover.state === "OPEN" || cover.state === "CANCELED" || cover.observed_milli === "") {
    return "--";
  }
  const n = Number(cover.observed_milli);
  if (!Number.isFinite(n)) return "--";
  const unit = TEMPLATES.find((t) => t.id === cover.template)?.unit ?? "";
  return `${(n / 1000).toFixed(1)} ${unit}`;
}

export function thresholdDisplay(cover: {
  template: "RAIN" | "DRY" | "HEAT";
  threshold_milli: number;
}): string {
  const t = TEMPLATES.find((x) => x.id === cover.template)!;
  const op = cover.template === "DRY" ? "<=" : ">=";
  return `${op} ${(cover.threshold_milli / 1000).toFixed(1)} ${t.unit}`;
}

export const CITIES = [
  { name: "Mumbai", lat: "19.0760", lon: "72.8777" },
  { name: "London", lat: "51.5074", lon: "-0.1278" },
  { name: "Nairobi", lat: "-1.2921", lon: "36.8219" },
  { name: "Singapore", lat: "1.3521", lon: "103.8198" },
] as const;
