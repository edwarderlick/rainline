import "dotenv/config";
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const RPC = "https://studio.genlayer.com/api";
const CONTRACT = process.env.NEXT_PUBLIC_RAINLINE_CONTRACT_ADDRESS;
const BUYER = createAccount(process.env.OPERATOR_PRIVATE_KEY).address;

const chain = {
  ...studionet,
  rpcUrls: { default: { http: [RPC] } },
};
const client = createClient({ chain, account: createAccount() });

async function main() {
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
