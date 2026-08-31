"use client";

import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { ExecutionResult, TransactionStatus } from "genlayer-js/types";
import type { Address } from "viem";
import {
  CONTRACT_ADDRESS,
  type Cover,
  type CoverState,
  type Pool,
} from "./contract";
import { hasContract, isStudioNetChain, type EthereumProvider } from "./genlayer";
import { getActiveProvider } from "./injected-wallets";
import { jsonRpcEndpoint } from "./app-entry";

export class WalletRequiredError extends Error {
  constructor() {
    super("Connect a StudioNet wallet first.");
    this.name = "WalletRequiredError";
  }
}

export class ContractMissingError extends Error {
  constructor() {
    super("Deploy contracts/rainline.py and set NEXT_PUBLIC_RAINLINE_CONTRACT_ADDRESS.");
    this.name = "ContractMissingError";
  }
}

function contractAddress(): Address {
  if (!hasContract()) throw new ContractMissingError();
  return CONTRACT_ADDRESS as Address;
}

function studioChain() {
  return {
    ...studionet,
    rpcUrls: { default: { http: [jsonRpcEndpoint()] as const } },
  };
}

function readClient() {
  return createClient({
    chain: studioChain(),
  });
}

function writeClient(account: Address) {
  const provider = getActiveProvider();
  if (!provider) throw new WalletRequiredError();
  return createClient({
    chain: studioChain(),
    account,
    provider: provider as EthereumProvider,
  });
}

export function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "transaction failed";
  }
}

export type WriteReceipt = {
  hash: string;
  coverId?: string;
  execution: string;
};

function asHash(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "hash" in value) {
    return String((value as { hash: unknown }).hash);
  }
  return String(value);
}

function extractCoverId(receipt: {
  consensus_data?: { leader_receipt?: { result?: unknown }[] };
}): string | undefined {
  const raw = receipt.consensus_data?.leader_receipt?.[0]?.result;
  if (typeof raw === "string") {
    const trimmed = raw.trim().replace(/^"+|"+$/g, "");
    if (/^cover-\d+$/.test(trimmed)) return trimmed;
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (typeof parsed === "string" && /^cover-\d+$/.test(parsed)) return parsed;
    } catch {
      /* not json */
    }
  }
  return undefined;
}

async function waitAndCheck(
  hash: string,
  status: TransactionStatus
): Promise<{ hash: string; coverId?: string; execution: string }> {
  const client = readClient();
  const receipt = await client.waitForTransactionReceipt({
    hash: hash as never,
    status,
    interval: 2000,
    retries: 60,
  });
  const execution = receipt.txExecutionResultName ?? "UNKNOWN";
  if (execution === ExecutionResult.FINISHED_WITH_ERROR) {
    throw new Error(`Contract execution failed (${hash}). State was not modified.`);
  }
  return {
    hash,
    coverId: extractCoverId(receipt),
    execution,
  };
}

export async function readCover(id: string): Promise<Cover | null> {
  if (!hasContract()) return null;
  try {
    const raw = (await readClient().readContract({
      address: contractAddress(),
      functionName: "get_cover",
      args: [id],
    })) as Cover;
    if (!raw || typeof raw !== "object") return null;
    return normalizeCover(raw);
  } catch {
    return null;
  }
}

export async function readCoverIds(): Promise<string[]> {
  if (!hasContract()) return [];
  try {
    const raw = await readClient().readContract({
      address: contractAddress(),
      functionName: "list_cover_ids",
      args: [],
    });
    if (Array.isArray(raw)) return raw.map(String);
    return [];
  } catch {
    return [];
  }
}

export async function readPool(): Promise<Pool | null> {
  if (!hasContract()) {
    return {
      operator: "",
      pool_balance: 0,
      reserved_payout: 0,
      unreserved: 0,
      payout_ratio: 4,
      source_host: "",
      buy_cutoff_hours: 24,
    };
  }
  const raw = (await readClient().readContract({
    address: contractAddress(),
    functionName: "get_pool",
    args: [],
  })) as Pool;
  if (!raw || typeof raw !== "object") return null;
  return {
    operator: String(raw.operator),
    pool_balance: Number(raw.pool_balance),
    reserved_payout: Number(raw.reserved_payout),
    unreserved: Number(raw.unreserved),
    payout_ratio: Number(raw.payout_ratio),
    source_host: String(raw.source_host),
    buy_cutoff_hours: Number(raw.buy_cutoff_hours),
  };
}

export async function readCredit(account: string): Promise<bigint> {
  if (!hasContract() || !account) return BigInt(0);
  const raw = await readClient().readContract({
    address: contractAddress(),
    functionName: "get_credit",
    args: [account],
  });
  try {
    return BigInt(raw as string | number | bigint);
  } catch {
    return BigInt(0);
  }
}

export async function readPreviewUrl(
  template: string,
  lat: string,
  lon: string,
  coverageDate: string
): Promise<string | null> {
  if (!hasContract()) return null;
  try {
    const raw = await readClient().readContract({
      address: contractAddress(),
      functionName: "preview_url",
      args: [template, lat, lon, coverageDate],
    });
    return String(raw);
  } catch {
    return null;
  }
}

function requireAccount(account: string | null): Address {
  if (!account) throw new WalletRequiredError();
  return account as Address;
}

async function sendWrite(
  account: string | null,
  functionName: string,
  args: unknown[],
  value: bigint,
  status: TransactionStatus
): Promise<WriteReceipt> {
  const addr = requireAccount(account);
  const provider = getActiveProvider();
  if (!provider) throw new WalletRequiredError();
  const current = (await provider.request({ method: "eth_chainId" })) as string;
  if (!isStudioNetChain(current)) {
    throw new Error("This app writes on StudioNet (chain 61999).");
  }
  const client = writeClient(addr);
  try {
    if (typeof window !== "undefined" && provider === (window as unknown as { ethereum?: EthereumProvider }).ethereum) {
      await client.connect("studionet");
    }
  } catch {
    /* Snaps are MetaMask-only. Chain switch already happened on the selected provider. */
  }
  const hash = asHash(
    await client.writeContract({
      address: contractAddress(),
      functionName,
      args: args as never,
      value,
    })
  );
  return waitAndCheck(hash, status);
}

export async function writeFundPool(account: string | null, value: bigint): Promise<WriteReceipt> {
  return sendWrite(account, "fund_pool", [], value, TransactionStatus.ACCEPTED);
}

export async function writeBuyCover(
  account: string | null,
  template: string,
  lat: string,
  lon: string,
  coverageDate: string,
  thresholdMilli: number,
  value: bigint
): Promise<WriteReceipt> {
  return sendWrite(
    account,
    "buy_cover",
    [template, lat, lon, coverageDate, thresholdMilli],
    value,
    TransactionStatus.ACCEPTED
  );
}

export async function writeCancelCover(account: string | null, coverId: string): Promise<WriteReceipt> {
  return sendWrite(account, "cancel_cover", [coverId], BigInt(0), TransactionStatus.ACCEPTED);
}

export async function writeResolve(account: string | null, coverId: string): Promise<WriteReceipt> {
  return sendWrite(account, "resolve", [coverId], BigInt(0), TransactionStatus.FINALIZED);
}

export async function writeWithdraw(account: string | null): Promise<WriteReceipt> {
  return sendWrite(account, "withdraw", [], BigInt(0), TransactionStatus.ACCEPTED);
}

export async function writeWithdrawUnreserved(
  account: string | null,
  amountWei: bigint
): Promise<WriteReceipt> {
  return sendWrite(
    account,
    "withdraw_unreserved",
    [amountWei <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(amountWei) : amountWei.toString()],
    BigInt(0),
    TransactionStatus.ACCEPTED
  );
}

export function normalizeCover(raw: Cover): Cover {
  const template = String(raw.template).toUpperCase();
  const state = String(raw.state) as CoverState;
  return {
    id: String(raw.id),
    buyer: String(raw.buyer),
    template: template === "DRY" || template === "HEAT" ? template : "RAIN",
    lat: String(raw.lat),
    lon: String(raw.lon),
    coverage_date: String(raw.coverage_date),
    threshold_milli: Number(raw.threshold_milli),
    premium: String(raw.premium),
    payout: String(raw.payout),
    state,
    evidence_url: String(raw.evidence_url),
    observed_milli: raw.observed_milli == null ? "" : String(raw.observed_milli),
    result: raw.result ?? null,
    created_at: String(raw.created_at ?? ""),
  };
}
