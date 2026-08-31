"use client";

import { useWallet } from "@/lib/wallet";
import { Icon } from "./Icon";

export function NetworkBanner() {
  const { wrongNetwork, switchNetwork, error } = useWallet();
  if (!wrongNetwork) return null;

  return (
    <div className="border border-error bg-error-container px-4 py-3 md:px-10">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          <Icon name="warning" className="text-error" filled />
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-error">
              Critical
            </p>
            <p className="font-bold text-on-error-container">This app writes on StudioNet (chain 61999).</p>
            <p className="text-sm text-on-error-container/80">
              Switch your wallet to GenLayer StudioNet before buy_cover, fund_pool, cancel_cover,
              resolve, or withdraw. Reads still work.
            </p>
            {error ? <p className="mt-1 text-xs text-on-error-container">{error}</p> : null}
          </div>
        </div>
        <button
          type="button"
          onClick={() => void switchNetwork()}
          className="shrink-0 border border-error bg-error px-6 py-3 font-mono text-[12px] uppercase tracking-wider text-on-error hover:bg-on-error-container"
        >
          Switch to StudioNet
        </button>
      </div>
    </div>
  );
}

export function MobileNetworkBanner() {
  const { wrongNetwork, switchNetwork } = useWallet();
  if (!wrongNetwork) return null;
  return (
    <div className="fixed inset-x-4 bottom-24 z-40 flex items-center justify-between bg-error px-4 py-2 md:hidden">
      <span className="flex items-center gap-2 font-mono text-[12px] uppercase text-on-error">
        <Icon name="warning" className="text-[18px]" />
        StudioNet (chain 61999)
      </span>
      <button
        type="button"
        onClick={() => void switchNetwork()}
        className="font-mono text-[12px] uppercase text-on-error underline"
      >
        Switch
      </button>
    </div>
  );
}
