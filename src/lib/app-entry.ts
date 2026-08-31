import { hasContract } from "./genlayer";

/** Open App: live contract → /buy. Otherwise How Cover Works with a not-set note. */
export function appEntryHref(): "/buy" | "/how-it-works" {
  return hasContract() ? "/buy" : "/how-it-works";
}

export function jsonRpcEndpoint(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/genlayer`;
  }
  return process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? "https://studio.genlayer.com/api";
}
