import fs from "node:fs";
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const RPC = "https://studio.genlayer.com/api";
const PAST_DATE = "2026-08-20";

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

async function getBalance(address) {
  const hex = await rpc("eth_getBalance", [address, "latest"]);
  return BigInt(hex);
}

async function main() {
  console.log("=== 1. Creating 'timeless' contract ===");
  let code = fs.readFileSync("contracts/rainline.py", "utf-8");
  
  code = code.replace(
    '        if now > day - timedelta(hours=BUY_CUTOFF_HOURS):\n            raise gl.vm.UserError(f"{ERROR_EXPECTED} buy window closed 24h before coverage date 00:00 UTC")',
    '        pass # buy window check disabled'
  );
  
  code = code.replace(
    '        if now < self._parse_date(cover.coverage_date) + timedelta(days=1):\n            raise gl.vm.UserError(f"{ERROR_EXPECTED} resolve only after the coverage day has closed (00:00 UTC next day)")',
    '        pass # resolve time check disabled'
  );
  
  fs.writeFileSync("contracts/rainline_timeless.py", code);
  console.log("Wrote contracts/rainline_timeless.py with time checks disabled.");

  console.log("\n=== 2. Setting up accounts ===");
  const operator = createAccount();
  const buyer = createAccount();
  console.log("Operator:", operator.address);
  console.log("Buyer:   ", buyer.address);

  await rpc("sim_fundAccount", [operator.address, Number(30n * 10n ** 18n)]);
  await rpc("sim_fundAccount", [buyer.address, Number(10n * 10n ** 18n)]);

  const opClient = createClient({ chain, account: operator });
  const buyerClient = createClient({ chain, account: buyer });

  console.log("\n=== 3. Deploying timeless contract ===");
  const deployHash = await opClient.deployContract({
    code,
    args: [],
    leaderOnly: true,
  });
  
  const deployReceipt = await opClient.waitForTransactionReceipt({
    hash: deployHash,
    status: "ACCEPTED",
    interval: 3000,
    retries: 120,
  });
  
  const contractAddress = deployReceipt.contract_address 
    || deployReceipt.contractAddress 
    || deployReceipt.creates
    || deployReceipt.recipient;
  
  console.log("Contract deployed to:", contractAddress);

  console.log("\n=== 4. Funding pool with 20 GEN ===");
  const fundHash = await opClient.writeContract({
    address: contractAddress,
    functionName: "fund_pool",
    args: [],
    value: 20n * 10n ** 18n,
  });
  await opClient.waitForTransactionReceipt({ hash: fundHash, status: "ACCEPTED", interval: 3000, retries: 60 });
  
  console.log("\n=== 5. Buying past-date covers ===");
  const premium = 1n * 10n ** 18n;
  
  // Cover 1: RAIN, low threshold (hit -> PAY)
  console.log(`Buying Cover 1 (RAIN, 1mm) for ${PAST_DATE}...`);
  const b1 = await buyerClient.writeContract({
    address: contractAddress,
    functionName: "buy_cover",
    args: ["RAIN", "19.0760", "72.8777", PAST_DATE, 1000],
    value: premium
  });
  await buyerClient.waitForTransactionReceipt({ hash: b1, status: "ACCEPTED", interval: 3000, retries: 60 });

  // Cover 2: DRY, high threshold (miss -> KEEP)
  // (Wait, for DRY, paying out means it must be BELOW threshold. So if it rained 16mm, a DRY cover for 100000mm will HIT and PAY. 
  // Let's use RAIN with a very high threshold to ensure it misses and KEEPs.)
  console.log(`Buying Cover 2 (RAIN, 500mm) for ${PAST_DATE}...`);
  const b2 = await buyerClient.writeContract({
    address: contractAddress,
    functionName: "buy_cover",
    args: ["RAIN", "19.0760", "72.8777", PAST_DATE, 500000],
    value: premium
  });
  await buyerClient.waitForTransactionReceipt({ hash: b2, status: "ACCEPTED", interval: 3000, retries: 60 });

  // Cover 3: HEAT, invalid date (1900-01-01 -> INSUFFICIENT)
  console.log(`Buying Cover 3 (HEAT, 35°C) with invalid date for 1900-01-01...`);
  const b3 = await buyerClient.writeContract({
    address: contractAddress,
    functionName: "buy_cover",
    // 1900-01-01 is prior to Open-Meteo's earliest 1940 data, guaranteeing a 400 HTTP error
    args: ["HEAT", "19.0760", "72.8777", "1900-01-01", 35000],
    value: premium
  });
  await buyerClient.waitForTransactionReceipt({ hash: b3, status: "ACCEPTED", interval: 3000, retries: 60 });

  const coverIds = await opClient.readContract({ address: contractAddress, functionName: "list_cover_ids", args: [] });
  console.log("Bought covers:", coverIds);

  console.log("\n=== 6. Capturing Balances Before Resolve ===");
  const buyerBalBefore = await getBalance(buyer.address);
  let poolStateBefore = await opClient.readContract({ address: contractAddress, functionName: "get_pool", args: [] });
  console.log(`Buyer balance: ${Number(buyerBalBefore)/1e18} GEN`);
  console.log(`Pool balance:  ${Number(poolStateBefore.pool_balance)/1e18} GEN (reserved: ${Number(poolStateBefore.reserved_payout)/1e18})`);

  console.log("\n=== 7. Resolving Covers ===");
  for (const cid of coverIds) {
    console.log(`Resolving ${cid}...`);
    const rHash = await opClient.writeContract({
      address: contractAddress,
      functionName: "resolve",
      args: [cid],
      value: 0n
    });
    await opClient.waitForTransactionReceipt({ hash: rHash, status: "ACCEPTED", interval: 3000, retries: 60 });
    const cover = await opClient.readContract({ address: contractAddress, functionName: "get_cover", args: [cid] });
    console.log(`  -> State: ${cover.state}`);
  }

  console.log("\n=== 8. Capturing Balances After Resolve ===");
  const buyerBalAfter = await getBalance(buyer.address);
  const buyerCredit = await opClient.readContract({ address: contractAddress, functionName: "get_credit", args: [buyer.address] });
  let poolStateAfter = await opClient.readContract({ address: contractAddress, functionName: "get_pool", args: [] });
  console.log(`Buyer balance: ${Number(buyerBalAfter)/1e18} GEN`);
  console.log(`Buyer credit in contract: ${Number(buyerCredit)/1e18} GEN`);
  console.log(`Pool balance:  ${Number(poolStateAfter.pool_balance)/1e18} GEN (reserved: ${Number(poolStateAfter.reserved_payout)/1e18})`);

  console.log("\n=== 9. Deltas ===");
  console.log(`Buyer Delta (Wallet): ${(Number(buyerBalAfter) - Number(buyerBalBefore))/1e18} GEN`);
  console.log(`Buyer Credit (Fallback): ${Number(buyerCredit)/1e18} GEN`);
  console.log(`Pool Delta:  ${(Number(poolStateAfter.pool_balance) - Number(poolStateBefore.pool_balance))/1e18} GEN`);
}

main().catch(console.error);
