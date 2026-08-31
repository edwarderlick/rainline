import type { CoverState } from "./contract";

export type WeatherKind = "mixed" | "RAIN" | "DRY" | "HEAT" | "off" | "none";

export function weatherForCover(
  template: "RAIN" | "DRY" | "HEAT",
  state: CoverState
): WeatherKind {
  if (state === "INSUFFICIENT") return "off";
  return template;
}

/** Paid copy is allowed only after a settlement that moved premium or payout. */
export function canMarkPaid(state: CoverState): boolean {
  return state === "RESOLVED_PAY" || state === "INSUFFICIENT" || state === "CANCELED";
}

export function paidReason(state: CoverState): string | null {
  if (state === "RESOLVED_PAY") return "Payout sent or credited";
  if (state === "INSUFFICIENT") return "Premium refunded";
  if (state === "CANCELED") return "Premium refunded";
  return null;
}

export function stateLabel(state: CoverState): string {
  return state;
}
