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
const CONTRACT = process.env.NEXT_PUBLIC_RAINLINE_CONTRACT_ADDRESS;
const BUYER = process.env.BUYER_ADDRESS || (process.env.OPERATOR_PRIVATE_KEY ? createAccount(process.env.OPERATOR_PRIVATE_KEY).address : "");

const chain = {
  ...studioDevnet,
  id: 61997,
  name: "GenLayer Studio Next",
  rpcUrls: { default: { http: [RPC] } },
};
const client = createClient({ chain, endpoint: RPC, account: createAccount() });

async function main() {
  if (!CONTRACT) throw new Error("NEXT_PUBLIC_RAINLINE_CONTRACT_ADDRESS is required");
  if (!BUYER) throw new Error("Set BUYER_ADDRESS or OPERATOR_PRIVATE_KEY");
  const credit = await client.readContract({
    address: CONTRACT,
    functionName: "get_credit",
    args: [BUYER]
  });
  console.log(`Buyer credit in contract: ${Number(credit)/1e18} GEN`);
  
  const cover1 = await client.readContract({ address: CONTRACT, functionName: "get_cover", args: ["cover-1"] });
  console.log("Cover 1 result:", JSON.stringify(cover1.result, null, 2));

  const cover3 = await client.readContract({ address: CONTRACT, functionName: "get_cover", args: ["cover-3"] });
  console.log("Cover 3 result:", JSON.stringify(cover3.result, null, 2));
}

main().catch(console.error);
