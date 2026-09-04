"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { asDisplay, observedDisplay, thresholdDisplay, type DisplayCover } from "@/lib/demo";
import { PAYOUT_RATIO, TEMPLATES, resolveOpensIso, weiToGen } from "@/lib/templates";
import { canMarkPaid, paidReason, weatherForCover } from "@/lib/status";
import { StatusChip } from "@/components/StatusChip";
import { WeatherLayer } from "@/components/WeatherLayer";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { Icon } from "@/components/Icon";
import { shortAddr, hasContract } from "@/lib/genlayer";
import { readCover, readCredit } from "@/lib/rainline";
import { useWallet } from "@/lib/wallet";
import { DocketActions } from "./docket-actions";

export function CoverDocket({ id }: { id: string }) {
  const wallet = useWallet();
  const [cover, setCover] = useState<DisplayCover | null>(null);
  const [credit, setCredit] = useState(BigInt(0));
  const [loading, setLoading] = useState(hasContract());
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (hasContract()) {
      setLoading(true);
      try {
        const live = await readCover(id);
        if (live) {
          setCover(asDisplay(live, false));
          setError("");
        } else {
          setCover(null);
          setError(`${id} is not in get_cover.`);
        }
        if (wallet.address) {
          setCredit(await readCredit(wallet.address));
        } else {
          setCredit(BigInt(0));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "get_cover failed");
      } finally {
        setLoading(false);
      }
      return;
    }
    setError(`Contract not deployed.`);
    setLoading(false);
  }, [id, wallet.address]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading) return <LoadingState rows={2} />;

  if (!cover) {
    return (
      <div className="max-w-2xl space-y-4">
        <ErrorState title="Cover not found" body={error || `${id} was not returned by get_cover.`} />
        <Link href="/covers" className="inline-flex items-center gap-2 font-mono text-[12px] uppercase text-primary">
          <Icon name="arrow_back" className="text-[16px]" />
          Back to covers
        </Link>
      </div>
    );
  }

  const wx = weatherForCover(cover.template, cover.state);
  const template = TEMPLATES.find((t) => t.id === cover.template)!;
  const unlock = resolveOpensIso(cover.coverage_date);
  const resolveOpen = new Date(unlock).getTime() <= Date.now();
  const isBuyer = Boolean(wallet.address) && wallet.address!.toLowerCase() === cover.buyer.toLowerCase();
  const canCancel = cover.state === "OPEN" && isBuyer;
  const canResolve = cover.state === "OPEN" && resolveOpen;
  const canWithdraw = credit > BigInt(0);

  return (
    <div className="relative">
      <WeatherLayer kind={wx} className="opacity-25" />
      <div className="relative z-10 grid grid-cols-12 gap-0">
        <div className="col-span-12 flex flex-col justify-between border border-b-0 border-outline bg-surface-container-low p-6 md:flex-row md:items-end md:p-8">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[12px] uppercase tracking-[0.05em] text-on-surface-variant">
              [01] Cover docket record
            </span>
            <h1 className="m-0 font-sans text-[48px] font-extrabold uppercase leading-none tracking-tight md:text-[80px] md:leading-[72px]">
              {cover.id}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <StatusChip state={cover.state} credit={credit} />
              <span className="font-mono text-[12px] text-on-surface-variant">
                TEMPLATE: {cover.template}
              </span>
            </div>
          </div>
          <div className="mt-6 flex flex-col items-start gap-2 md:mt-0 md:items-end">
            <span className="font-mono text-[12px] uppercase text-on-surface-variant">Buyer</span>
            <span className="border border-outline bg-surface-container px-3 py-1 font-mono text-[15px]">
              {shortAddr(cover.buyer)}
            </span>
            {canMarkPaid(cover.state) && isBuyer ? (
              <span className="font-mono text-[10px] font-bold uppercase text-secondary">
                {credit > 0n ? "Funds secured in escrow" : paidReason(cover.state)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="col-span-12 grid grid-cols-12 border border-outline">
          <div className="col-span-12 flex flex-col border-outline md:col-span-8 md:border-r">
            <div className="relative border-b border-outline bg-surface p-6 md:p-8">
              <span className="absolute top-0 right-0 border-b border-l border-outline bg-surface-container-high px-2 py-1 font-mono text-[10px] font-bold uppercase text-on-surface-variant">
                Parameters
              </span>
              <div className="mt-4 grid grid-cols-2 gap-6 md:grid-cols-4">
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[12px] uppercase text-on-surface-variant">Location</span>
                  <span className="text-lg uppercase">{cover.place}</span>
                  <span className="font-mono text-[10px] font-bold text-on-surface-variant">
                    {cover.lat}°, {cover.lon}°
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[12px] uppercase text-on-surface-variant">Target period</span>
                  <span className="text-lg">{cover.coverage_date}</span>
                  <span className="font-mono text-[10px] font-bold text-on-surface-variant">
                    00:00 - 23:59 UTC
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[12px] uppercase text-on-surface-variant">Threshold</span>
                  <span className="text-lg">{thresholdDisplay(cover)}</span>
                  <span className="font-mono text-[10px] font-bold text-on-surface-variant">
                    {template.field}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[12px] uppercase text-on-surface-variant">Payout</span>
                  <span className="text-lg">{weiToGen(cover.payout)} GEN</span>
                  <span className="font-mono text-[10px] font-bold text-on-surface-variant">
                    {PAYOUT_RATIO}x premium
                  </span>
                </div>
              </div>
            </div>
            <div className="relative flex-grow bg-surface-container-highest p-6 md:p-8">
              <span className="absolute top-0 right-0 border-b border-l border-outline bg-surface-variant px-2 py-1 font-mono text-[10px] font-bold uppercase text-on-surface-variant">
                Evidence source
              </span>
              <p className="mt-4 w-full text-[15px] text-on-surface-variant md:w-3/4">
                Resolution is bound to the JSON payload returned by the pinned Open-Meteo
                historical-forecast URL. No manual appeals are permitted.
              </p>
              <div className="mt-4 flex items-center justify-between gap-3 overflow-hidden border border-outline bg-surface p-4">
                <span className="flex min-w-0 items-center gap-3">
                  <Icon name="link" className="text-on-surface-variant" />
                  <span className="truncate font-mono text-[12px]">{cover.evidence_url}</span>
                </span>
                <span className="ml-4 shrink-0 bg-tertiary px-2 py-1 font-mono text-[10px] font-bold uppercase text-on-tertiary">
                  Pinned public JSON
                </span>
              </div>
              <div className="tech-grid mt-4 h-40 border border-outline" />
            </div>
          </div>

          <div className="col-span-12 flex flex-col bg-surface-container md:col-span-4">
            <div className="relative border-b border-outline p-6 md:p-8">
              <span className="absolute top-0 right-0 border-b border-l border-outline bg-surface-container-high px-2 py-1 font-mono text-[10px] font-bold uppercase text-on-surface-variant">
                Sequence
              </span>
              <p className="mt-4 text-center font-mono text-[12px] uppercase text-on-surface-variant">
                Resolve unlocks {unlock}
              </p>
              <p className="mt-2 text-center font-mono text-[12px] text-primary">
                {resolveOpen ? "Resolve window open" : "Awaiting D+1 00:00 UTC"}
              </p>
            </div>
            <DocketActions
              canCancel={canCancel}
              canResolve={canResolve}
              canWithdraw={canWithdraw}
              coverId={cover.id}
              onSettled={() => void refresh()}
            />
            <div
              className={`relative flex-grow p-6 md:p-8 ${
                cover.state === "OPEN" ? "opacity-40" : ""
              }`}
            >
              <span className="absolute top-0 right-0 border-b border-l border-outline bg-surface-container px-2 py-1 font-mono text-[10px] font-bold uppercase text-on-surface-variant">
                Result output
              </span>
              {cover.state === "OPEN" ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                  <span className="rotate-[-15deg] border border-outline bg-surface-container px-4 py-2 font-mono text-[12px] uppercase tracking-widest">
                    Pending
                  </span>
                </div>
              ) : null}
              <div className={`mt-4 flex flex-col gap-6 ${cover.state === "OPEN" ? "blur-[2px]" : ""}`}>
                <div className="flex items-end justify-between border-b border-outline pb-2">
                  <span className="font-mono text-[12px] uppercase text-on-surface-variant">
                    Terminal status
                  </span>
                  <span className="text-2xl font-semibold uppercase">
                    {cover.state === "OPEN" ? "--" : cover.state}
                  </span>
                </div>
                <div className="flex items-end justify-between border-b border-outline pb-2">
                  <span className="font-mono text-[12px] uppercase text-on-surface-variant">
                    Observed value
                  </span>
                  <span className="text-lg">{observedDisplay(cover)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[12px] uppercase text-on-surface-variant">
                    Resolution reason
                  </span>
                  <span className="text-[15px]">
                    {cover.result?.reason ?? "Data points not yet collected from pinned source."}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
