/**
 * Resolve the three test cover dockets on StudioNet.
 *
 * NOTE: The contract strictly enforces resolution timing: 
 * "resolve only after the coverage day has closed".
 * The covers were bought for future dates (D+3, D+4), 
 * so running this script right now WILL revert on-chain.
 *
 * This script is provided for completeness so you can test 
 * resolution once the dates actually pass.
 */

import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const RPC = "https://studio.genlayer.com/api";
const CONTRACT = "0x970dcC20c90F90fc7749f6E10d7AC5a23D6D98C6";

// Any account can resolve
const resolverAccount = createAccount();

const client = createClient({ 
  chain: { ...studionet, rpcUrls: { default: { http: [RPC] } } }, 
  account: resolverAccount 
});

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

// Fund resolver for gas
console.log("Funding resolver for gas...");
await rpc("sim_fundAccount", [resolverAccount.address, Number(5n * 10n ** 18n)]);

async function resolve(coverId) {
  console.log(`\nAttempting to resolve ${coverId}...`);
  try {
    const hash = await client.writeContract({
      address: CONTRACT,
      functionName: "resolve",
      args: [coverId],
      value: 0n,
    });
    console.log(`${coverId} resolve tx:`, hash);
    const receipt = await client.waitForTransactionReceipt({
      hash,
      status: "ACCEPTED",
      interval: 3000,
      retries: 60,
    });
    console.log("Status:", receipt.result_name || receipt.status_name);
    
    const cover = await client.readContract({
      address: CONTRACT,
      functionName: "get_cover",
      args: [coverId]
    });
    console.log(`${coverId} state post-resolve:`, cover.state);
    if (cover.result) {
      console.log("Result:", JSON.stringify(cover.result, null, 2));
    }
  } catch (e) {
    console.error(`Failed to resolve ${coverId}:`, e.message);
  }
}

async function main() {
  const ids = await client.readContract({ 
    address: CONTRACT, 
    functionName: "list_cover_ids", 
    args: [] 
  });
  
  console.log("Current cover IDs:", ids);
  
  if (ids.length === 0) {
    console.log("No covers found to resolve.");
    return;
  }

  for (const id of ids) {
    await resolve(id);
  }
  
  const pool = await client.readContract({ 
    address: CONTRACT, 
    functionName: "get_pool", 
    args: [] 
  });
  console.log("\n=== Final Pool State ===");
  console.log(JSON.stringify(pool, null, 2));
}

main().catch(console.error);
