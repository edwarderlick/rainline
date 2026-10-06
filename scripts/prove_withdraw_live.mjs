#!/usr/bin/env node
/** Prove buy -> cancel credit -> withdraw on the deployed Studio Next contract. */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createAccount, createClient, isSuccessful } from "genlayer-js";
import { studioDevnet } from "genlayer-js/chains";

const root = resolve(import.meta.dirname, "..");
for (const envFile of [".env.local", ".env"]) {
  const envPath = resolve(root, envFile);
  if (!existsSync(envPath)) continue;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1].trim()]) {
      process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, "");
    }
  }
}

const RPC = process.env.GENLAYER_RPC_URL || process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || "https://studio-next.genlayer.com/api";
const CONTRACT = process.env.NEXT_PUBLIC_RAINLINE_CONTRACT_ADDRESS;
if (!/^0x[a-fA-F0-9]{40}$/.test(String(CONTRACT))) {
  throw new Error("NEXT_PUBLIC_RAINLINE_CONTRACT_ADDRESS is not set");
}

const profile = JSON.parse(readFileSync(resolve(root, "fee-profile.json"), "utf8"));
const PREMIUM = 1n * 10n ** 18n;
const chain = {
  ...studioDevnet,
  id: 61997,
  name: "GenLayer Studio Next",
  rpcUrls: { default: { http: [RPC] } },
};

async function rpc(method, params) {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(`RPC ${method}: ${json.error.message}`);
  return json.result;
}

async function waitOk(client, hash, label) {
  await client.waitForTransactionReceipt({
    hash,
    waitUntil: "finalized",
    retries: 120,
    interval: 3000,
  });
  const tx = await client.getTransaction({ hash });
  const ok = typeof isSuccessful === "function"
    ? isSuccessful(tx)
    : tx.statusName === "FINALIZED" && tx.txExecutionResultName === "FINISHED_WITH_RETURN";
  if (!ok) {
    throw new Error(`${label} failed: ${JSON.stringify({
      hash,
      status: tx.statusName,
      execution: tx.txExecutionResultName,
    })}`);
  }
  return tx;
}

function futureDate(daysAhead) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

function extractCoverId(tx) {
  let raw = tx.consensusData?.leaderReceipt?.[0]?.result
    || tx.consensus_data?.leader_receipt?.[0]?.result
    || tx.data?.result;
  if (raw && typeof raw === "object" && raw.payload?.readable) {
    raw = raw.payload.readable;
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim().replace(/^"+|"+$/g, "");
    if (trimmed.startsWith("cover-")) return trimmed;
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === "string" && parsed.startsWith("cover-")) return parsed;
    } catch {}
  }
  return null;
}

const buyer = createAccount();
await rpc("sim_fundAccount", [buyer.address, Number(10n * 10n ** 18n)]);

const client = createClient({ chain, endpoint: RPC, account: buyer });
const estimate = await client.estimateTransactionFees({
  leaderTimeunitsAllocation: profile.methods.write.leaderTimeunitsAllocation,
  validatorTimeunitsAllocation: profile.methods.write.validatorTimeunitsAllocation,
});
const fees = { distribution: estimate.distribution, feeValue: estimate.feeValue };

console.log("Network: Studio Next 61997");
console.log("Contract:", CONTRACT);
console.log("Buyer:", buyer.address);

const coverageDate = futureDate(3);
const buyHash = await client.writeContract({
  address: CONTRACT,
  functionName: "buy_cover",
  args: ["RAIN", "19.0760", "72.8777", coverageDate, 25000],
  value: PREMIUM,
  fees,
});
const buyTx = await waitOk(client, buyHash, "buy_cover");
let coverId = extractCoverId(buyTx);
if (!coverId) {
  const ids = await client.readContract({ address: CONTRACT, functionName: "list_cover_ids", args: [] });
  coverId = ids[ids.length - 1];
}
console.log("buy_cover tx:", buyHash);
console.log("cover id:", coverId);

const cancelHash = await client.writeContract({
  address: CONTRACT,
  functionName: "cancel_cover",
  args: [coverId],
  fees,
});
await waitOk(client, cancelHash, "cancel_cover");
const creditAfterCancel = await client.readContract({
  address: CONTRACT,
  functionName: "get_credit",
  args: [buyer.address],
});
console.log("cancel_cover tx:", cancelHash);
console.log("credit after cancel:", creditAfterCancel.toString());

const withdrawHash = await client.writeContract({
  address: CONTRACT,
  functionName: "withdraw",
  args: [],
  fees,
});
await waitOk(client, withdrawHash, "withdraw");
const creditAfterWithdraw = await client.readContract({
  address: CONTRACT,
  functionName: "get_credit",
  args: [buyer.address],
});
console.log("withdraw tx:", withdrawHash);
console.log("credit after withdraw:", creditAfterWithdraw.toString());
console.log("========================================");
console.log("BUY_TX:", buyHash);
console.log("CANCEL_TX:", cancelHash);
console.log("WITHDRAW_TX:", withdrawHash);
console.log("COVER_ID:", coverId);
console.log("CREDIT_AFTER_CANCEL:", creditAfterCancel.toString());
console.log("CREDIT_AFTER_WITHDRAW:", creditAfterWithdraw.toString());
console.log("========================================");
