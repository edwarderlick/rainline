/**
 * Buy three test cover dockets on StudioNet.
 * 
 * Docket A: RAIN, Mumbai, low threshold (1mm) — expected PAY after resolve
 * Docket B: RAIN, Singapore, high threshold (500mm) — expected KEEP after resolve  
 * Docket C: RAIN, Mumbai, far past date — expected to test INSUFFICIENT
 *
 * Since buy_cover enforces a 24h cutoff, we buy for D+3 from now.
 * Resolution will be possible after D+1 00:00 UTC.
 */

import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const RPC = "https://studio.genlayer.com/api";
const CONTRACT = "0x970dcC20c90F90fc7749f6E10d7AC5a23D6D98C6";
const OPERATOR_KEY = "0xa28085456990018deb66e4745e932f1c3f387c3926ac5a2d636982b6f8e042ac";
const PREMIUM = 1n * 10n ** 18n; // 1 GEN

const chain = {
  ...studionet,
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

const buyerClient = createClient({ chain, account: buyerAccount });

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

// ── Docket A: RAIN Mumbai, threshold 1mm (should PAY) ─────────
console.log("=== Docket A: RAIN Mumbai, threshold=1mm (expect PAY) ===");
try {
  const hashA = await buyerClient.writeContract({
    address: CONTRACT,
    functionName: "buy_cover",
    args: ["RAIN", "19.0760", "72.8777", targetDate, 1000],
    value: PREMIUM,
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

// ── Docket B: RAIN Singapore, threshold 500mm (should KEEP) ───
console.log("\n=== Docket B: RAIN Singapore, threshold=500mm (expect KEEP) ===");
try {
  const hashB = await buyerClient.writeContract({
    address: CONTRACT,
    functionName: "buy_cover",
    args: ["RAIN", "1.3521", "103.8198", targetDate, 500000],
    value: PREMIUM,
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
