/**
 * Deploy rainline.py to StudioNet and fund the pool.
 *
 * Usage:
 *   node scripts/deploy_studionet.mjs
 *
 * Generates a fresh account, funds it via sim_fundAccount,
 * deploys the contract, funds the pool with 50 GEN,
 * and prints the contract address.
 */

import { readFileSync } from "node:fs";
import { createClient, createAccount, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const RPC = "https://studio.genlayer.com/api";
const FUND_AMOUNT_WEI = 200n * 10n ** 18n; // 200 GEN for deploy gas + pool funding
const POOL_FUND_WEI = 50n * 10n ** 18n; // 50 GEN pool seed

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

async function getBalance(address) {
  const hex = await rpc("eth_getBalance", [address, "latest"]);
  return BigInt(hex);
}

// ── 1. Create or reuse deploy account ──────────────────────────
const privateKey = generatePrivateKey();
const account = createAccount(privateKey);
console.log("Deploy account:", account.address);
console.log("Private key:  ", privateKey);

// ── 2. Fund via sim_fundAccount ────────────────────────────────
console.log(`\nFunding ${account.address} with ${FUND_AMOUNT_WEI / 10n ** 18n} GEN...`);
await rpc("sim_fundAccount", [account.address, Number(FUND_AMOUNT_WEI)]);

// Verify
const balance = await getBalance(account.address);
console.log(`Balance: ${balance / 10n ** 18n} GEN`);

// ── 3. Deploy contract ─────────────────────────────────────────
const code = readFileSync("contracts/rainline.py", "utf-8");
console.log(`\nDeploying contracts/rainline.py (${code.length} bytes)...`);

const chain = {
  ...studionet,
  rpcUrls: { default: { http: [RPC] } },
};

const client = createClient({ chain, account });

const deployHash = await client.deployContract({
  code,
  args: [],
  leaderOnly: true,
});
console.log("Deploy tx hash:", deployHash);

console.log("Waiting for deploy receipt (ACCEPTED)...");
const deployReceipt = await client.waitForTransactionReceipt({
  hash: deployHash,
  status: "ACCEPTED",
  interval: 3000,
  retries: 120,
});

const contractAddress = deployReceipt.contract_address
  || deployReceipt.contractAddress
  || deployReceipt.creates;
console.log("\n========================================");
console.log("CONTRACT DEPLOYED!");
console.log("Address:", contractAddress);
console.log("========================================\n");

if (!contractAddress) {
  console.log("Full receipt:", JSON.stringify(deployReceipt, null, 2));
  console.log("Could not extract contract address from receipt. Check the receipt above.");
  process.exit(1);
}

// ── 4. Fund pool ───────────────────────────────────────────────
console.log(`Funding pool with ${POOL_FUND_WEI / 10n ** 18n} GEN...`);
const fundHash = await client.writeContract({
  address: contractAddress,
  functionName: "fund_pool",
  args: [],
  value: POOL_FUND_WEI,
});
console.log("fund_pool tx hash:", fundHash);

console.log("Waiting for fund_pool receipt...");
const fundReceipt = await client.waitForTransactionReceipt({
  hash: fundHash,
  status: "ACCEPTED",
  interval: 3000,
  retries: 60,
});
console.log("fund_pool status:", fundReceipt.txExecutionResultName || "OK");

// ── 5. Verify pool state ───────────────────────────────────────
const pool = await client.readContract({
  address: contractAddress,
  functionName: "get_pool",
  args: [],
});
console.log("\nPool state:", JSON.stringify(pool, null, 2));

// ── Summary ────────────────────────────────────────────────────
console.log("\n========================================");
console.log("DEPLOYMENT COMPLETE");
console.log("Contract:", contractAddress);
console.log("Operator:", account.address);
console.log("Pool balance:", pool?.pool_balance, "wei");
console.log("========================================");
console.log(`\nUpdate .env.local:`);
console.log(`NEXT_PUBLIC_RAINLINE_CONTRACT_ADDRESS=${contractAddress}`);
