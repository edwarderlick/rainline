
import fs from "fs";
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const RPC = "https://studio.genlayer.com/api";
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

function extractId(receipt) {
  let raw = receipt.consensus_data?.leader_receipt?.[0]?.result;
  if (raw && typeof raw === "object" && raw.payload && raw.payload.readable) {
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
  console.log("Could not extract ID from:", JSON.stringify(receipt.consensus_data?.leader_receipt?.[0], null, 2));
  return null;
}

async function run() {
  const deployer = createAccount();
  const buyer = createAccount();
  console.log("Deployer:", deployer.address);
  console.log("Buyer:", buyer.address);

  console.log("Funding deployer (30 GEN) and buyer (20 GEN)...");
  await rpc("sim_fundAccount", [deployer.address, Number(30n * 10n ** 18n)]);
  await rpc("sim_fundAccount", [buyer.address, Number(20n * 10n ** 18n)]);

  const deployerClient = createClient({ chain, account: deployer });
  const buyerClient = createClient({ chain, account: buyer });

  console.log("\nDeploying rainline_timeless.py...");
  const code = fs.readFileSync("contracts/rainline_timeless.py", "utf8");
  const deployHash = await deployerClient.deployContract({ code, args: [] });
  const deployReceipt = await deployerClient.waitForTransactionReceipt({ hash: deployHash, status: "ACCEPTED", interval: 2000, retries: 60 });
  console.log("deployReceipt:", JSON.stringify(deployReceipt, null, 2));
  const CONTRACT = deployReceipt.contract_address || deployReceipt.contractAddress || deployReceipt.creates || deployReceipt.created_contract || deployReceipt.recipient;
  if (!CONTRACT) throw new Error("Deploy failed to return contract address");
  console.log("Deployed to:", CONTRACT);

  console.log("Funding pool with 20 GEN...");
  const fundHash = await deployerClient.writeContract({ address: CONTRACT, functionName: "fund_pool", args: [], value: 20n * 10n ** 18n });
  await deployerClient.waitForTransactionReceipt({ hash: fundHash, status: "ACCEPTED", interval: 2000, retries: 60 });

  console.log("\n=== 1. Buy Historical Dockets ===");
  const historicalDate = "2024-01-01"; // Should resolve successfully
  const impossibleDate = "1900-01-01"; // Should fail resolution (INSUFFICIENT)

  // 1. PAY: London Rain
  console.log("Buying Docket 1 (PAY expected)...");
  const hash1 = await buyerClient.writeContract({ address: CONTRACT, functionName: "buy_cover", args: ["RAIN", "51.5072", "-0.1276", historicalDate, 10], value: PREMIUM });
  
  // 2. KEEP: Phoenix Rain (threshold very high)
  console.log("Buying Docket 2 (KEEP expected)...");
  const hash2 = await buyerClient.writeContract({ address: CONTRACT, functionName: "buy_cover", args: ["RAIN", "33.4484", "-112.0740", historicalDate, 50000], value: PREMIUM });
  
  // 3. INSUFFICIENT: Impossible Date
  console.log("Buying Docket 3 (INSUFFICIENT expected)...");
  const hash3 = await buyerClient.writeContract({ address: CONTRACT, functionName: "buy_cover", args: ["HEAT", "51.5072", "-0.1276", impossibleDate, 35000], value: PREMIUM });

  const r1 = await buyerClient.waitForTransactionReceipt({ hash: hash1, status: "ACCEPTED", interval: 2000, retries: 60 });
  const r2 = await buyerClient.waitForTransactionReceipt({ hash: hash2, status: "ACCEPTED", interval: 2000, retries: 60 });
  const r3 = await buyerClient.waitForTransactionReceipt({ hash: hash3, status: "ACCEPTED", interval: 2000, retries: 60 });

  const id1 = extractId(r1);
  const id2 = extractId(r2);
  const id3 = extractId(r3);
  console.log("IDs:", id1, id2, id3);

  // Read native balances
  const buyerBalanceBefore = BigInt(await rpc("eth_getBalance", [buyer.address, "latest"]));
  console.log("\nBuyer Balance Before Resolve:", buyerBalanceBefore, "wei");

  console.log("\n=== 2. Resolve Dockets ===");
  const rHash1 = await buyerClient.writeContract({ address: CONTRACT, functionName: "resolve", args: [id1] });
  const rHash2 = await buyerClient.writeContract({ address: CONTRACT, functionName: "resolve", args: [id2] });
  const rHash3 = await buyerClient.writeContract({ address: CONTRACT, functionName: "resolve", args: [id3] });

  // Use ACCEPTED for resolve
  console.log("Waiting for resolves to finalize...");
  await buyerClient.waitForTransactionReceipt({ hash: rHash1, status: "ACCEPTED", interval: 3000, retries: 60 });
  await buyerClient.waitForTransactionReceipt({ hash: rHash2, status: "ACCEPTED", interval: 3000, retries: 60 });
  await buyerClient.waitForTransactionReceipt({ hash: rHash3, status: "ACCEPTED", interval: 3000, retries: 60 });

  const c1 = await buyerClient.readContract({ address: CONTRACT, functionName: "get_cover", args: [id1] });
  const c2 = await buyerClient.readContract({ address: CONTRACT, functionName: "get_cover", args: [id2] });
  const c3 = await buyerClient.readContract({ address: CONTRACT, functionName: "get_cover", args: [id3] });

  console.log(`Docket 1 Status: ${c1.state}`);
  console.log(`Docket 2 Status: ${c2.state}`);
  console.log(`Docket 3 Status: ${c3.state}`);

  const buyerBalanceAfter = BigInt(await rpc("eth_getBalance", [buyer.address, "latest"]));
  console.log(`\nBuyer Balance After Resolve: ${buyerBalanceAfter} wei`);
  
  const balanceDelta = buyerBalanceAfter - buyerBalanceBefore;
  console.log(`Native Balance Delta: ${balanceDelta > 0n ? "+" : ""}${balanceDelta} wei`);

  const credits = await buyerClient.readContract({ address: CONTRACT, functionName: "get_credit", args: [buyer.address] });
  console.log(`Buyer Fallback Credits: ${credits} wei`);
  
  console.log("\n=== PROOF SUMMARY ===");
  console.log("Native balance increased by:", balanceDelta.toString());
  console.log("Fallback credits held:", credits.toString());
  console.log("Total value recouped (Delta + Credits):", (balanceDelta + BigInt(credits)).toString());
}

run().catch(console.error);
