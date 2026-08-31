"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { TxHash } from "@/components/TxHash";
import { useWallet } from "@/lib/wallet";
import {
  WalletRequiredError,
  formatError,
  writeCancelCover,
  writeResolve,
  writeWithdraw,
} from "@/lib/rainline";

export function DocketActions({
  coverId,
  canCancel,
  canResolve,
  canWithdraw,
  onSettled,
}: {
  coverId: string;
  canCancel: boolean;
  canResolve: boolean;
  canWithdraw: boolean;
  onSettled?: () => void;
}) {
  const wallet = useWallet();
  const [note, setNote] = useState("");
  const [hash, setHash] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function run(method: "cancel_cover" | "resolve" | "withdraw", fn: () => Promise<{ hash: string }>) {
    setNote("");
    setHash("");
    if (wallet.writesBlocked) {
      if (!wallet.address) wallet.openModal();
      setNote(wallet.writesBlocked);
      return;
    }
    try {
      setBusy(method);
      const receipt = await fn();
      setHash(receipt.hash);
      void wallet.refreshBalance();
      setNote(`${method} sent.`);
      onSettled?.();
    } catch (err) {
      if (err instanceof WalletRequiredError) wallet.openModal();
      setNote(formatError(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="relative border-b border-outline bg-surface p-6 md:p-8">
      <span className="absolute top-0 right-0 border-b border-l border-outline bg-surface-container-high px-2 py-1 font-mono text-[10px] font-bold uppercase text-on-surface-variant">
        Operations
      </span>
      <div className="mt-4 flex flex-col gap-4">
        <button
          type="button"
          disabled={!canCancel || busy !== null || Boolean(wallet.writesBlocked)}
          onClick={() => void run("cancel_cover", () => writeCancelCover(wallet.address, coverId))}
          className="group flex w-full items-center justify-between border border-outline bg-surface px-4 py-3 text-left text-2xl font-semibold hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>{busy === "cancel_cover" ? "cancel_cover pending" : "cancel_cover"}</span>
          <Icon name="close" className="text-on-surface-variant" />
        </button>
        <button
          type="button"
          disabled={!canResolve || busy !== null || Boolean(wallet.writesBlocked)}
          onClick={() => void run("resolve", () => writeResolve(wallet.address, coverId))}
          className="flex w-full items-center justify-between border border-outline bg-surface px-4 py-3 text-left text-2xl font-semibold text-on-surface disabled:cursor-not-allowed disabled:opacity-50 disabled:text-on-surface-variant"
        >
          <span>{busy === "resolve" ? "resolve pending" : "resolve"}</span>
          <Icon name={canResolve ? "bolt" : "lock"} />
        </button>
        <button
          type="button"
          disabled={!canWithdraw || busy !== null || Boolean(wallet.writesBlocked)}
          onClick={() => void run("withdraw", () => writeWithdraw(wallet.address))}
          className="flex w-full items-center justify-between border border-outline bg-surface px-4 py-3 text-left text-2xl font-semibold text-on-surface disabled:cursor-not-allowed disabled:opacity-50 disabled:text-on-surface-variant"
        >
          <span>{busy === "withdraw" ? "withdraw pending" : "withdraw"}</span>
          <Icon name="output" />
        </button>
        {hash ? <TxHash hash={hash} /> : null}
        {note ? <p className="font-mono text-[12px] text-tertiary">{note}</p> : null}
      </div>
    </div>
  );
}
