import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import fs from "node:fs";

const RPC = "https://studio.genlayer.com/api";
const chain = { ...studionet, rpcUrls: { default: { http: [RPC] } } };

const code = `
from genlayer import *

class Test(gl.Contract):
    def __init__(self):
        pass
        
    @gl.public.write.payable
    def test_transfer(self, target: str, amount: int) -> str:
        res = gl.get_contract_at(Address(target)).emit_transfer(value=u256(amount))
        return str(type(res)) + ":" + str(res)
`;

async function main() {
  const op = createAccount();
  console.log("Op:", op.address);
  
  const client = createClient({ chain, account: op });
  await fetch(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "sim_fundAccount", params: [op.address, 10000000000000000000] }),
  });

  const hash = await client.deployContract({ code, args: [] });
  const rx = await client.waitForTransactionReceipt({ hash, status: "ACCEPTED", interval: 3000, retries: 60 });
  const addr = rx.contract_address || rx.contractAddress || rx.creates || rx.recipient;
  console.log("Deployed:", addr);
  await new Promise(r => setTimeout(r, 15000));

  const tHash = await client.writeContract({
    address: addr,
    functionName: "test_transfer",
    args: [op.address, 100],
    value: 1000n
  });
  const tRx = await client.waitForTransactionReceipt({ hash: tHash, status: "ACCEPTED", interval: 3000, retries: 60 });
  
  const data = await client.readContract({ address: addr, functionName: "test_transfer", args: [op.address, 100] });
  console.log("Return:", data);
}
main().catch(console.error);
