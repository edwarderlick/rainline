#!/usr/bin/env node
/** Deploy the checked-out Rainline contract to Studio Next (chain 61997). */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { homedir } from "node:os";
import { createClient, createAccount, isSuccessful } from "genlayer-js";
import { studioDevnet } from "genlayer-js/chains";

const require = createRequire(import.meta.url);
const keytar = require(resolve(homedir(), "AppData/Roaming/npm/node_modules/genlayer/node_modules/keytar"));

const root = resolve(import.meta.dirname, "..");
const rpc = process.env.GENLAYER_RPC_URL || "https://studio-next.genlayer.com/api";
const accountName = process.env.RAINLINE_DEPLOY_ACCOUNT || "coverlock-challenger";
const poolFundWei = BigInt(process.env.RAINLINE_POOL_FUND_WEI || "50000000000000000000");

const secret = await keytar.getPassword("genlayer-cli", `account:${accountName}`);
if (!secret) throw new Error(`Unlocked GenLayer account ${accountName} is unavailable`);

const account = createAccount(secret);
const chain = {
  ...studioDevnet,
  id: 61997,
  name: "GenLayer Studio Next",
  rpcUrls: { default: { http: [rpc] } },
};
const client = createClient({ chain, endpoint: rpc, account });

const profile = JSON.parse(readFileSync(resolve(root, "fee-profile.json"), "utf8"));
if (profile.chainId !== 61997 || !profile.deploy || !profile.methods?.write) {
  throw new Error("fee-profile.json is not configured for Studio Next deployment and writes");
}

async function estimateFees(entry) {
  const estimate = await client.estimateTransactionFees({
    leaderTimeunitsAllocation: entry.leaderTimeunitsAllocation,
    validatorTimeunitsAllocation: entry.validatorTimeunitsAllocation,
  });
  return { distribution: estimate.distribution, feeValue: estimate.feeValue };
}

async function waitOk(hash, label) {
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

console.log("Network: Studio Next 61997");
console.log("RPC:", rpc);
console.log("Deployer:", account.address);

const code = readFileSync(resolve(root, "contracts/rainline.py"), "utf8").replace(/\r\n/g, "\n");
const codeHash = createHash("sha256").update(code, "utf8").digest("hex");
console.log("Contract source SHA-256:", codeHash);

const deployFees = await estimateFees(profile.deploy);
console.log("Deploy fee deposit (wei):", deployFees.feeValue.toString());
const deployHash = process.env.RAINLINE_DEPLOY_HASH || await client.deployContract({ code, fees: deployFees });
if (!/^0x[a-fA-F0-9]{64}$/.test(deployHash)) throw new Error("Invalid deployment transaction hash");
console.log("Deployment transaction:", deployHash);

const deployTx = await waitOk(deployHash, "deploy");
const contractAddress = deployTx.data?.contract_address
  || deployTx.txDataDecoded?.contractAddress
  || deployTx.contract_address
  || deployTx.contractAddress;
if (!/^0x[a-fA-F0-9]{40}$/.test(String(contractAddress))) {
  throw new Error(`Could not extract contract address: ${JSON.stringify(deployTx)}`);
}

const writeFees = await estimateFees(profile.methods.write);
console.log("fund_pool fee deposit (wei):", writeFees.feeValue.toString());
console.log(`Funding pool with ${poolFundWei / 10n ** 18n} GEN...`);
const fundHash = await client.writeContract({
  address: contractAddress,
  functionName: "fund_pool",
  args: [],
  value: poolFundWei,
  fees: writeFees,
});
console.log("fund_pool transaction:", fundHash);
await waitOk(fundHash, "fund_pool");

const pool = await client.readContract({
  address: contractAddress,
  functionName: "get_pool",
  args: [],
});
console.log("Pool state:", JSON.stringify(pool, null, 2));

const env = [
  "# Deployed Intelligent Contract (required for writes and live reads)",
  `NEXT_PUBLIC_RAINLINE_CONTRACT_ADDRESS=${contractAddress}`,
  "",
  "# genlayer-js network name",
  "NEXT_PUBLIC_GENLAYER_NETWORK=studio-next",
  "NEXT_PUBLIC_GENLAYER_CHAIN_ID=61997",
  `NEXT_PUBLIC_GENLAYER_RPC_URL=${rpc}`,
  "",
].join("\n");
writeFileSync(resolve(root, ".env.local"), env);

console.log("========================================");
console.log("DEPLOYMENT COMPLETE");
console.log("Contract:", contractAddress);
console.log("Deploy tx:", deployHash);
console.log("Fund tx:", fundHash);
console.log("Source SHA-256:", codeHash);
console.log("Pool balance:", pool?.pool_balance, "wei");
console.log("========================================");
