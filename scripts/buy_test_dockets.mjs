/**
 * Buy three test cover dockets on Studio Next.
 * 
 * Docket A: RAIN, Mumbai, valid threshold (25mm)
 * Docket B: RAIN, Singapore, max valid threshold (100mm)
 * Docket C: RAIN, Mumbai, far past date — expected to test INSUFFICIENT
 *
 * Since buy_cover enforces a 24h cutoff, we buy for D+3 from now.
 * Resolution will be possible after D+1 00:00 UTC.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, createAccount } from "genlayer-js";
import { studioDevnet } from "genlayer-js/chains";

const root = resolve(import.meta.dirname, "..");
for (const envFile of [".env.local", ".env"]) {
  const envPath = resolve(root, envFile);
  if (!existsSync(envPath)) continue;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1].trim()]) {
      process.env[match[1].trim()] = match[2].trim();
    }
  }
}

const RPC = process.env.GENLAYER_RPC_URL || "https://studio-next.genlayer.com/api";
const CONTRACT = process.env.NEXT_PUBLIC_RAINLINE_CONTRACT_ADDRESS || "0x23fFF100306713f69E677076eAfAAAd5E9FDf413";
const PREMIUM = 1n * 10n ** 18n; // 1 GEN
const profile = JSON.parse(readFileSync(resolve(root, "fee-profile.json"), "utf8"));

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

// Create a buyer account (separate from operator)
const buyerAccount = createAccount();
console.log("Buyer address:", buyerAccount.address);

// Fund buyer
console.log("Funding buyer with 20 GEN...");
await rpc("sim_fundAccount", [buyerAccount.address, Number(20n * 10n ** 18n)]);

const buyerClient = createClient({ chain, endpoint: RPC, account: buyerAccount });
const feeEstimate = await buyerClient.estimateTransactionFees({
  leaderTimeunitsAllocation: profile.methods.write.leaderTimeunitsAllocation,
  validatorTimeunitsAllocation: profile.methods.write.validatorTimeunitsAllocation,
});
const writeFees = { distribution: feeEstimate.distribution, feeValue: feeEstimate.feeValue };

// Future date: D+3 from now
function futureDate(daysAhead) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

const targetDate = futureDate(3);
console.log(`\nTarget coverage date: ${targetDate} (D+3)`);
console.log(`Buy cutoff: ${targetDate}T00:00:00Z minus 24h`);
console.log(`Resolve opens: ${futureDate(4)}T00:00:00Z\n`);

// ── Docket A: RAIN Mumbai, threshold 25mm ─────────────────────
console.log("=== Docket A: RAIN Mumbai, threshold=25mm ===");
try {
  const hashA = await buyerClient.writeContract({
    address: CONTRACT,
    functionName: "buy_cover",
    args: ["RAIN", "19.0760", "72.8777", targetDate, 25000],
    value: PREMIUM,
    fees: writeFees,
  });
  console.log("buy_cover tx:", hashA);
  const receiptA = await buyerClient.waitForTransactionReceipt({
    hash: hashA,
    status: "ACCEPTED",
    interval: 3000,
    retries: 60,
  });
  console.log("Status:", receiptA.result_name || receiptA.status_name);
  
  // Read the cover
  const ids = await buyerClient.readContract({ address: CONTRACT, functionName: "list_cover_ids", args: [] });
  console.log("Cover IDs:", ids);
  if (ids.length > 0) {
    const cover = await buyerClient.readContract({ address: CONTRACT, functionName: "get_cover", args: [ids[ids.length - 1]] });
    console.log("Cover A:", JSON.stringify(cover, null, 2));
  }
} catch (e) {
  console.error("Docket A error:", e.message);
}

// ── Docket B: RAIN Singapore, threshold 100mm ─────────────────
console.log("\n=== Docket B: RAIN Singapore, threshold=100mm ===");
try {
  const hashB = await buyerClient.writeContract({
    address: CONTRACT,
    functionName: "buy_cover",
    args: ["RAIN", "1.3521", "103.8198", targetDate, 100000],
    value: PREMIUM,
    fees: writeFees,
  });
  console.log("buy_cover tx:", hashB);
  const receiptB = await buyerClient.waitForTransactionReceipt({
    hash: hashB,
    status: "ACCEPTED",
    interval: 3000,
    retries: 60,
  });
  console.log("Status:", receiptB.result_name || receiptB.status_name);

  const ids = await buyerClient.readContract({ address: CONTRACT, functionName: "list_cover_ids", args: [] });
  if (ids.length >= 2) {
    const cover = await buyerClient.readContract({ address: CONTRACT, functionName: "get_cover", args: [ids[ids.length - 1]] });
    console.log("Cover B:", JSON.stringify(cover, null, 2));
  }
} catch (e) {
  console.error("Docket B error:", e.message);
}

// ── Docket C: HEAT Mumbai, D+4 (for INSUFFICIENT test via different date) ──
console.log("\n=== Docket C: HEAT Mumbai, threshold=35°C (for later INSUFFICIENT test) ===");
try {
  const dateC = futureDate(4);
  const hashC = await buyerClient.writeContract({
    address: CONTRACT,
    functionName: "buy_cover",
    args: ["HEAT", "19.0760", "72.8777", dateC, 35000],
    value: PREMIUM,
    fees: writeFees,
  });
  console.log("buy_cover tx:", hashC);
  const receiptC = await buyerClient.waitForTransactionReceipt({
    hash: hashC,
    status: "ACCEPTED",
    interval: 3000,
    retries: 60,
  });
  console.log("Status:", receiptC.result_name || receiptC.status_name);

  const ids = await buyerClient.readContract({ address: CONTRACT, functionName: "list_cover_ids", args: [] });
  if (ids.length >= 3) {
    const cover = await buyerClient.readContract({ address: CONTRACT, functionName: "get_cover", args: [ids[ids.length - 1]] });
    console.log("Cover C:", JSON.stringify(cover, null, 2));
  }
} catch (e) {
  console.error("Docket C error:", e.message);
}

// ── Final pool state ───────────────────────────────────────────
const pool = await buyerClient.readContract({ address: CONTRACT, functionName: "get_pool", args: [] });
console.log("\n=== Final Pool State ===");
console.log(JSON.stringify(pool, null, 2));

const allIds = await buyerClient.readContract({ address: CONTRACT, functionName: "list_cover_ids", args: [] });
console.log("\nAll cover IDs:", allIds);
console.log("\n========================================");
console.log("3 dockets created. Resolution available after coverage dates close.");
console.log("========================================");
