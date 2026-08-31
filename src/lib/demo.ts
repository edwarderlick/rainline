import type { Cover, CoverState } from "./contract";
import { TEMPLATES } from "./templates";

export type DisplayCover = Cover & {
  demo: boolean;
  place: string;
};



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
