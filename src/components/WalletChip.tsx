"use client";

import { shortAddr } from "@/lib/genlayer";
import { useWallet } from "@/lib/wallet";
import { Icon } from "./Icon";
import { GenBalanceLine } from "./GenBalance";

export function WalletChip() {
  const { address, openModal, wrongNetwork, balanceWei, balanceError } = useWallet();

  if (!address) {
    return (
      <button
        type="button"
        onClick={openModal}
        className="flex shrink-0 items-center rounded-full border border-outline bg-surface-container px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.05em] text-on-surface hover:border-primary md:text-[12px]"
      >
        <Icon name="account_balance_wallet" className="mr-2 text-[14px]" />
        Connect wallet
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openModal}
      className="flex shrink-0 items-center gap-2 rounded-full border border-on-secondary-container/20 bg-secondary-container px-3 py-1.5"
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${wrongNetwork ? "bg-error" : "bg-secondary"}`} />
      <span className="flex flex-col items-start leading-tight">
        <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-on-secondary-container md:text-[12px]">
          {shortAddr(address)}
        </span>
        <GenBalanceLine
          wrongNetwork={wrongNetwork}
          balanceWei={balanceWei}
          balanceError={balanceError}
          className="text-on-secondary-container/80"
        />
      </span>
    </button>
  );
}
