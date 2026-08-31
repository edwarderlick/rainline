"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BUY_CUTOFF_HOURS,
  MAX_PREMIUM,
  MIN_PREMIUM,
  PAYOUT_RATIO,
  TEMPLATES,
  buyDeadlineIso,
  genToWei,
  toMilli,
} from "@/lib/templates";
import { CITIES, evidenceUrl } from "@/lib/demo";
import { hasContract } from "@/lib/genlayer";
import {
  ContractMissingError,
  WalletRequiredError,
  formatError,
  readPreviewUrl,
  writeBuyCover,
} from "@/lib/rainline";
import { useWallet } from "@/lib/wallet";
import { Icon } from "@/components/Icon";
import { BuyWindowClosed, PoolCapacityError } from "@/components/ErrorState";
import { WeatherLayer } from "@/components/WeatherLayer";
import { TxHash } from "@/components/TxHash";
import { ContractStatusNote } from "@/components/ContractStatusNote";

function defaultDate(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 3);
  return d.toISOString().slice(0, 10);
}

export default function BuyPage() {
  const router = useRouter();
  const wallet = useWallet();
  const [template, setTemplate] = useState<(typeof TEMPLATES)[number]["id"]>("RAIN");
  const [city, setCity] = useState<(typeof CITIES)[number]>(CITIES[0]);
  const [date, setDate] = useState(defaultDate);
  const [threshold, setThreshold] = useState("25");
  const [premium, setPremium] = useState("1");
  const [note, setNote] = useState("");
  const [hash, setHash] = useState("");
  const [busy, setBusy] = useState(false);
  const [showCapacity, setShowCapacity] = useState(false);
  const [pinnedUrl, setPinnedUrl] = useState("");

  const current = TEMPLATES.find((t) => t.id === template)!;
  const payout = Number(premium || 0) * PAYOUT_RATIO;
  const deadline = useMemo(() => buyDeadlineIso(date), [date]);
  const windowClosed = useMemo(() => new Date(deadline).getTime() <= Date.now(), [deadline]);
  const localUrl = evidenceUrl(city.lat, city.lon, date, template);

  useEffect(() => {
    let alive = true;
    setPinnedUrl(localUrl);
    if (!hasContract()) return;
    void readPreviewUrl(template, city.lat, city.lon, date).then((url) => {
      if (alive && url) setPinnedUrl(url);
    });
    return () => {
      alive = false;
    };
  }, [template, city.lat, city.lon, date, localUrl]);

  async function onBuy() {
    setShowCapacity(false);
    setHash("");
    setNote("");
    try {
      const milli = toMilli(threshold);
      const wei = genToWei(premium);
      if (Number(premium) < MIN_PREMIUM || Number(premium) > MAX_PREMIUM) {
        throw new Error(`premium must be ${MIN_PREMIUM}-${MAX_PREMIUM} GEN`);
      }
      if (windowClosed) {
        setNote("buy_cover reverts: buy window closed 24h before coverage date 00:00 UTC.");
        return;
      }
      if (wallet.writesBlocked) {
        if (!wallet.address) wallet.openModal();
        setNote(wallet.writesBlocked);
        return;
      }
      setBusy(true);
      const receipt = await writeBuyCover(
        wallet.address,
        template,
        city.lat,
        city.lon,
        date,
        milli,
        wei
      );
      setHash(receipt.hash);
      void wallet.refreshBalance();
      setNote(
        receipt.coverId
          ? `buy_cover returned ${receipt.coverId}.`
          : "buy_cover sent. Cover id is returned by that transaction."
      );
      if (receipt.coverId) router.push(`/covers/${receipt.coverId}`);
    } catch (err) {
      const message = formatError(err);
      if (err instanceof WalletRequiredError) wallet.openModal();
      if (err instanceof ContractMissingError || /pool cannot reserve/i.test(message)) {
        setShowCapacity(true);
      }
      setNote(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative mx-auto max-w-3xl space-y-6">
      <WeatherLayer kind={template} className="opacity-20" />
      <div className="relative z-10">
        <p className="font-mono text-[12px] uppercase tracking-widest text-on-surface-variant">
          [01] Buy cover
        </p>
        <h1 className="mt-2 text-[32px] font-bold uppercase tracking-tight">Checkout</h1>
        <div className="mt-4">
          <ContractStatusNote />
        </div>
      </div>

      <div className="relative z-10 space-y-6 border border-outline bg-surface-container-low p-4">
        <div className="flex items-center justify-between border-b border-outline pb-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-outline">Step 01</span>
          <h2 className="text-[15px] font-bold uppercase tracking-tight">Select template</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {TEMPLATES.map((t) => {
            const on = template === t.id;
            const icon = t.id === "RAIN" ? "rainy" : t.id === "DRY" ? "wb_sunny" : "thermostat";
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTemplate(t.id);
                  setThreshold(t.defaultThreshold);
                }}
                className={`relative flex flex-col items-center justify-center gap-2 border p-3 ${
                  on
                    ? "border-outline bg-primary text-on-primary"
                    : "border-outline bg-surface text-on-surface hover:bg-surface-variant"
                }`}
              >
                <Icon name={icon} className="text-2xl" />
                <span className="font-mono text-[10px] uppercase tracking-wider">{t.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-on-surface-variant">{current.hint}</p>
      </div>

      <div className="relative z-10 space-y-4 border border-outline bg-surface-container-low p-4">
        <div className="flex items-center justify-between border-b border-outline pb-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-outline">Step 02</span>
          <h2 className="text-[15px] font-bold uppercase tracking-tight">Location</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {CITIES.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => setCity(c)}
              className={`flex items-center justify-between border p-2 text-left font-mono text-[10px] uppercase ${
                city.name === c.name
                  ? "border-primary bg-primary text-on-primary"
                  : "border-outline bg-surface hover:bg-surface-variant"
              }`}
            >
              {c.name}
              <Icon name="arrow_forward" className="text-[14px]" />
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-4 border-t border-outline pt-4">
          <div className="flex items-center justify-between border border-outline bg-surface p-3">
            <span className="font-mono text-[12px] font-bold uppercase text-primary">
              {city.name === "Manual Coordinates" ? "Manual Coordinates" : city.name}
            </span>
            <span className="font-mono text-[12px] text-on-surface-variant">
              {city.lat}°, {city.lon}°
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-outline">
                Latitude
              </span>
              <input
                value={city.lat}
                onChange={(e) =>
                  setCity({ name: "Manual Coordinates", lat: e.target.value, lon: city.lon })
                }
                className="w-full border border-outline bg-surface p-2 font-mono text-[12px]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-outline">
                Longitude
              </span>
              <input
                value={city.lon}
                onChange={(e) =>
                  setCity({ name: "Manual Coordinates", lat: city.lat, lon: e.target.value })
                }
                className="w-full border border-outline bg-surface p-2 font-mono text-[12px]"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="relative z-10 space-y-6 border border-outline bg-surface-container-low p-4">
        <div className="flex items-center justify-between border-b border-outline pb-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-outline">Step 03</span>
          <h2 className="text-[15px] font-bold uppercase tracking-tight">Parameters</h2>
        </div>
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-outline">
              UTC date
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-outline bg-surface p-2 font-mono text-[12px]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-outline">
              Threshold ({current.unit})
            </span>
            <input
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full border border-outline bg-surface p-2 font-mono text-[12px]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-outline">
              Premium (GEN)
            </span>
            <div className="flex items-center justify-between border border-outline bg-surface p-2">
              <input
                value={premium}
                onChange={(e) => setPremium(e.target.value)}
                className="w-full bg-transparent font-mono text-[12px] outline-none"
              />
              <span className="font-mono text-[10px] text-outline">
                {MIN_PREMIUM}-{MAX_PREMIUM}
              </span>
            </div>
          </label>
        </div>

        <div className="border-t border-outline pt-4">
          <div className="mb-2 flex items-end justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-outline">
              Expected payout
            </span>
            <span className="text-[20px] font-bold text-primary">{payout || 0} GEN</span>
          </div>
          <div className="flex items-center justify-between border border-outline bg-surface p-2">
            <span className="font-mono text-[10px] uppercase text-outline">Multiplier</span>
            <span className="bg-tertiary px-2 py-1 font-mono text-[10px] font-bold uppercase text-on-tertiary">
              {PAYOUT_RATIO}x premium
            </span>
          </div>
        </div>

        <div className="relative space-y-2 border border-outline bg-surface p-3">
          <div className="absolute top-0 right-0 border-b border-l border-outline bg-primary px-1 py-0.5 font-mono text-[8px] uppercase tracking-widest text-on-primary">
            Pinned public JSON
          </div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-outline">
            Oracle resolution URL
          </p>
          <p className="truncate font-mono text-[10px] text-on-surface">{pinnedUrl}</p>
          <p className="font-mono text-[10px] text-outline">
            Built by the contract. Buyer cannot supply a host.
          </p>
        </div>

        <p className="font-mono text-[10px] text-error">
          Buy deadline: {deadline} (D minus {BUY_CUTOFF_HOURS}h)
        </p>

        {windowClosed ? <BuyWindowClosed deadline={deadline} /> : null}

        <button
          type="button"
          onClick={() => void onBuy()}
          disabled={busy || windowClosed || Boolean(wallet.writesBlocked)}
          className="relative flex w-full items-center justify-center gap-2 border border-outline bg-surface py-3 font-mono text-[12px] uppercase tracking-wider hover:border-primary hover:bg-primary hover:text-on-primary disabled:opacity-50"
        >
          {busy ? "buy_cover pending" : "buy_cover"}
          <Icon name="chevron_right" className="text-[16px]" />
        </button>
        {hash ? <TxHash hash={hash} /> : null}
        {wallet.writesBlocked ? (
          <p className="font-mono text-[12px] text-tertiary">{wallet.writesBlocked}</p>
        ) : null}
        {note ? <p className="font-mono text-[12px] text-tertiary">{note}</p> : null}
        {showCapacity ? <PoolCapacityError /> : null}
      </div>
    </div>
  );
}
