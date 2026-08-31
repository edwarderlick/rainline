import { hasContract } from "@/lib/genlayer";

export function ContractStatusNote() {
  if (hasContract()) return null;
  return (
    <p className="border border-outline bg-surface-container p-4 font-mono text-[12px] uppercase tracking-[0.04em] text-on-surface-variant">
      Contract not set. Deploy contracts/rainline.py and set NEXT_PUBLIC_RAINLINE_CONTRACT_ADDRESS.
      DEMO rows still render. Writes are disabled. No hashes are invented.
    </p>
  );
}

export function WalletReviewerNote() {
  return (
    <p className="text-[15px] leading-[22px] text-on-surface-variant">
      Connect any EIP-1193 wallet (MetaMask, Rabby, Brave, Coinbase, Rainbow). The wallet must
      accept a custom network: StudioNet, chain 61999, RPC studio.genlayer.com/api, symbol GEN.
      Get test GEN from the Studio faucet.
    </p>
  );
}
