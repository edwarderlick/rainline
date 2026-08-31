export const TEMPLATES = [
  {
    id: "RAIN" as const,
    label: "Rain",
    unit: "mm",
    field: "precipitation_sum",
    hint: "Pays if daily precipitation_sum is at or above the threshold.",
    defaultThreshold: "25",
  },
  {
    id: "DRY" as const,
    label: "Dry",
    unit: "mm",
    field: "precipitation_sum",
    hint: "Pays if daily precipitation_sum is at or below the threshold.",
    defaultThreshold: "1",
  },
  {
    id: "HEAT" as const,
    label: "Heat",
    unit: "°C",
    field: "temperature_2m_max",
    hint: "Pays if daily temperature_2m_max is at or above the threshold.",
    defaultThreshold: "35",
  },
];

export const PAYOUT_RATIO = 4;
export const BUY_CUTOFF_HOURS = 24;
export const MIN_PREMIUM = 0.01;
export const MAX_PREMIUM = 10;

export function toMilli(value: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error("threshold must be a number");
  return Math.round(n * 1000);
}

export function fromMilli(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "--";
  return (Number(value) / 1000).toFixed(1);
}

const WEI_PER_GEN = BigInt("1000000000000000000");

export function weiToGen(wei: number | string | bigint): string {
  const n = BigInt(wei);
  const whole = n / WEI_PER_GEN;
  const frac = (n % WEI_PER_GEN).toString().padStart(18, "0").slice(0, 4);
  return `${whole}.${frac}`;
}

/** Native GEN for the wallet chip: max 4 decimals, trim trailing zeros. */
export function formatGenDisplay(wei: number | string | bigint): string {
  const n = BigInt(wei);
  const whole = n / WEI_PER_GEN;
  const frac = (n % WEI_PER_GEN).toString().padStart(18, "0").slice(0, 4).replace(/0+$/, "");
  return frac.length > 0 ? `${whole.toString()}.${frac}` : whole.toString();
}

export function genToWei(gen: string): bigint {
  const [w, f = ""] = gen.trim().split(".");
  const frac = (f + "000000000000000000").slice(0, 18);
  return BigInt(w || "0") * WEI_PER_GEN + BigInt(frac);
}

export function buyDeadlineIso(coverageDate: string): string {
  const d = new Date(`${coverageDate}T00:00:00.000Z`);
  d.setUTCHours(d.getUTCHours() - BUY_CUTOFF_HOURS);
  return d.toISOString();
}

export function resolveOpensIso(coverageDate: string): string {
  const d = new Date(`${coverageDate}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}
