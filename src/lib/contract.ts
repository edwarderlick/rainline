export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_RAINLINE_CONTRACT_ADDRESS ?? "";

export const NETWORK = process.env.NEXT_PUBLIC_GENLAYER_NETWORK ?? "studionet";

export const STUDIONET_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID ?? 61999
);
export const STUDIONET_CHAIN_ID_HEX = `0x${STUDIONET_CHAIN_ID.toString(16)}`;
export const STUDIONET_RPC =
  process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? "https://studio.genlayer.com/api";
export const STUDIONET_EXPLORER = "https://explorer-studio.genlayer.com";
export const STUDIONET_NAME = "GenLayer StudioNet";

export type CoverState =
  | "OPEN"
  | "REFUNDED"
  | "RESOLVED_PAY"
  | "RESOLVED_KEEP"
  | "INSUFFICIENT";

export type Cover = {
  id: string;
  buyer: string;
  template: "RAIN" | "DRY" | "HEAT";
  lat: string;
  lon: string;
  coverage_date: string;
  threshold_milli: number;
  premium: number | string;
  payout: number | string;
  state: CoverState;
  evidence_url: string;
  observed_milli: string;
  result: {
    status?: string;
    amount_wei?: string;
    reason?: string;
    evidence_url?: string;
    observed_milli?: number | null;
  } | null;
  created_at: string;
};

export type Pool = {
  operator: string;
  pool_balance: number;
  reserved_payout: number;
  unreserved: number;
  payout_ratio: number;
  source_host: string;
  buy_cutoff_hours: number;
};

export const WRITE_METHODS = [
  "fund_pool",
  "buy_cover",
  "cancel_cover",
  "resolve",
  "withdraw",
  "withdraw_unreserved",
] as const;

export const VIEW_METHODS = [
  "get_cover",
  "list_cover_ids",
  "get_pool",
  "get_credit",
  "preview_url",
] as const;
