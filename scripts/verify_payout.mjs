/**
 * StudioNet balance-delta proof.
 * Usage:
 *   CONTRACT=0x... BUYER=0x... RPC=https://... node scripts/verify_payout.mjs
 *
 * Print balances before/after a RESOLVED_PAY and an INSUFFICIENT refund.
 * The UI must not say Paid until one of these deltas is real.
 */
const rpc = process.env.RPC || "https://studio.genlayer.com/api";
const buyer = process.env.BUYER;
if (!buyer) {
  console.log("Set BUYER=0x... and re-run after a live resolve.");
  process.exit(0);
}

async function balance(addr) {
  const res = await fetch(rpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getBalance",
      params: [addr, "latest"],
    }),
  });
  const json = await res.json();
  return BigInt(json.result || "0x0");
}

const before = process.env.BEFORE ? BigInt(process.env.BEFORE) : await balance(buyer);
const after = await balance(buyer);
console.log({
  buyer,
  before: before.toString(),
  after: after.toString(),
  delta_wei: (after - before).toString(),
});
