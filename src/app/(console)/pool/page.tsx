"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { LoadingState } from "@/components/LoadingState";
import { TxHash } from "@/components/TxHash";
import { ContractStatusNote } from "@/components/ContractStatusNote";
import { PAYOUT_RATIO, genToWei, weiToGen } from "@/lib/templates";
import { hasContract } from "@/lib/genlayer";
import type { Pool } from "@/lib/contract";
import {
  WalletRequiredError,
  formatError,
  readPool,
  writeFundPool,
  writeWithdrawUnreserved,
} from "@/lib/rainline";
import { useWallet } from "@/lib/wallet";

export default function PoolPage() {
  const wallet = useWallet();
  const [amount, setAmount] = useState("1");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [note, setNote] = useState("");
  const [hash, setHash] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pool, setPool] = useState<Pool | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setPool(await readPool());
    } catch (err) {
      setNote(formatError(err));
      setPool(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isOperator =
    Boolean(wallet.address && pool?.operator) &&
    wallet.address!.toLowerCase() === pool!.operator.toLowerCase();

  async function onFund() {
    setNote("");
    setHash("");
    if (wallet.writesBlocked) {
      if (!wallet.address) wallet.openModal();
      setNote(wallet.writesBlocked);
      return;
    }
    try {
      setBusy(true);
      const receipt = await writeFundPool(wallet.address, genToWei(amount));
      setHash(receipt.hash);
      void wallet.refreshBalance();
      setNote("fund_pool accepted.");
      await refresh();
    } catch (err) {
      if (err instanceof WalletRequiredError) wallet.openModal();
      setNote(formatError(err));
    } finally {
      setBusy(false);
    }
  }

  async function onWithdrawUnreserved() {
    setNote("");
    setHash("");
    if (wallet.writesBlocked) {
      if (!wallet.address) wallet.openModal();
      setNote(wallet.writesBlocked);
      return;
    }
    try {
      setBusy(true);
      const wei = genToWei(withdrawAmount);
      const receipt = await writeWithdrawUnreserved(wallet.address, wei);
      setHash(receipt.hash);
      void wallet.refreshBalance();
      setNote("withdraw_unreserved accepted.");
      await refresh();
    } catch (err) {
      setNote(formatError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <span className="font-mono text-[12px] uppercase tracking-widest text-on-surface-variant">
          [01] Total liquidity
        </span>
        <h1 className="mt-2 text-[32px] font-bold tracking-tight">Cover pool</h1>
        <div className="mt-4">
          <ContractStatusNote />
        </div>
      </div>

      <div className="relative overflow-hidden border border-outline bg-surface-container p-4">
        <p className="text-[15px] leading-[22px] text-on-surface-variant">
          Anyone can call <span className="font-mono">fund_pool()</span>. Buys revert if
          unreserved liquidity cannot cover a {PAYOUT_RATIO}x payout. Operator can only
          call <span className="font-mono">withdraw_unreserved</span>. Live figures come from{" "}
          <span className="font-mono">get_pool</span>. No invented GEN.
        </p>
        {loading ? (
          <div className="mt-4">
            <LoadingState rows={1} />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-outline/20 pt-4">
            <div>
              <span className="font-mono text-[12px] uppercase text-on-surface-variant">Reserved</span>
              <div className="text-2xl font-semibold">
                {pool ? `${weiToGen(pool.reserved_payout)} GEN` : "n/a"}
              </div>
            </div>
            <div>
              <span className="font-mono text-[12px] uppercase text-on-surface-variant">Available</span>
              <div className="text-2xl font-semibold">
                {pool ? `${weiToGen(pool.unreserved)} GEN` : "n/a"}
              </div>
            </div>
          </div>
        )}
        {pool ? (
          <p className="mt-3 font-mono text-[12px] text-on-surface-variant">
            pool_balance {weiToGen(pool.pool_balance)} GEN · host {pool.source_host}
          </p>
        ) : (
          <p className="mt-3 font-mono text-[12px] text-on-surface-variant">
            {hasContract() ? "get_pool did not return data." : "Contract not deployed."}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 border border-outline bg-surface px-3 py-3 font-mono text-[12px]"
          aria-label="Fund amount in GEN"
        />
        <button
          type="button"
          onClick={() => void onFund()}
          disabled={busy || Boolean(wallet.writesBlocked)}
          className="flex flex-1 items-center justify-center gap-2 border border-primary bg-primary px-4 py-3 font-mono text-[12px] uppercase tracking-wider text-on-primary hover:bg-primary/90 disabled:opacity-50"
        >
          <Icon name="add" className="text-[18px]" />
          {busy ? "fund_pool pending" : "fund_pool"}
        </button>
      </div>

      {isOperator ? (
        <div className="flex gap-2">
          <input
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="unreserved GEN"
            className="flex-1 border border-outline bg-surface px-3 py-3 font-mono text-[12px]"
            aria-label="Unreserved withdraw amount in GEN"
          />
          <button
            type="button"
            onClick={() => void onWithdrawUnreserved()}
            disabled={busy || Boolean(wallet.writesBlocked)}
            className="flex flex-1 items-center justify-center gap-2 border border-outline bg-surface px-4 py-3 font-mono text-[12px] uppercase tracking-wider disabled:opacity-50"
          >
            withdraw_unreserved
          </button>
        </div>
      ) : null}

      {hash ? <TxHash hash={hash} /> : null}
      {wallet.writesBlocked ? (
        <p className="font-mono text-[12px] text-tertiary">{wallet.writesBlocked}</p>
      ) : null}
      {note ? <p className="font-mono text-[12px] text-tertiary">{note}</p> : null}

      <div className="flex items-center gap-4">
        <span className="shrink-0 font-mono text-[12px] uppercase tracking-widest text-on-surface-variant">
          [02] Outcomes
        </span>
        <div className="h-px flex-1 bg-outline/20" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-2 border border-outline/50 bg-surface-container-low p-3">
          <span className="font-mono text-[10px] font-bold uppercase text-on-surface-variant">
            Triggered
          </span>
          <span className="font-semibold text-primary">PAY</span>
          <span className="font-mono text-[12px] text-on-surface-variant">
            Buyer receives {PAYOUT_RATIO}x. Pool drops by that amount.
          </span>
        </div>
        <div className="flex flex-col gap-2 border border-outline/50 bg-surface-container-low p-3">
          <span className="font-mono text-[10px] font-bold uppercase text-on-surface-variant">
            Missed
          </span>
          <span className="font-semibold text-secondary">KEEP</span>
          <span className="font-mono text-[12px] text-on-surface-variant">
            Premium stays in the pool. Reserve released.
          </span>
        </div>
        <div className="flex flex-col gap-2 border border-outline/50 bg-surface-container-low p-3">
          <span className="font-mono text-[10px] font-bold uppercase text-on-surface-variant">
            Missing JSON
          </span>
          <span className="font-semibold text-surface-tint">INSUFFICIENT</span>
          <span className="font-mono text-[12px] text-on-surface-variant">
            Premium returns to buyer. Nobody is slashed for a 404.
          </span>
        </div>
        <div className="flex flex-col gap-2 border border-outline/50 bg-surface-container-low p-3">
          <span className="font-mono text-[10px] font-bold uppercase text-on-surface-variant">
            Void
          </span>
          <span className="font-semibold text-on-surface-variant">REFUNDED</span>
          <span className="font-mono text-[12px] text-on-surface-variant">
            Buyer-only, and only before the coverage day starts.
          </span>
        </div>
      </div>

      <div>
        <span className="font-mono text-[12px] uppercase tracking-widest text-on-surface-variant">
          [03] Log
        </span>
        <div className="mt-2 border border-outline bg-surface-container-low p-6 text-center text-on-surface-variant">
          {hash
            ? "Last write is the Studio tx above. Historical logs are not invented."
            : "No on-chain events until fund_pool or resolve. Live activity is not invented here."}
        </div>
      </div>
    </div>
  );
}
