import Link from "next/link";
import type { DisplayCover } from "@/lib/demo";
import { observedDisplay, thresholdDisplay } from "@/lib/demo";
import { weiToGen } from "@/lib/templates";
import { DemoChip, StatusChip } from "./StatusChip";
import { weatherForCover } from "@/lib/status";
import { WeatherLayer } from "./WeatherLayer";
import { Icon } from "./Icon";

const ICONS = { RAIN: "water_drop", DRY: "grass", HEAT: "thermostat" } as const;

export function CoverCard({ cover }: { cover: DisplayCover }) {
  const wx = weatherForCover(cover.template, cover.state);
  return (
    <Link
      href={`/covers/${cover.id}`}
      className="group relative flex flex-col overflow-hidden border border-outline-variant bg-surface-container-lowest hover:border-primary"
    >
      <WeatherLayer kind={wx} className="opacity-40" />
      <div className="relative z-10 flex items-start justify-between border-b border-outline-variant bg-surface-container-high p-4">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1 font-mono text-[12px] font-bold uppercase tracking-[0.05em] text-primary">
            <Icon name={ICONS[cover.template]} className="text-[14px]" />
            {cover.id}
          </span>
          <span className="text-[15px] text-on-surface">
            {cover.place}
          </span>
          <span className="font-mono text-[12px] text-on-surface-variant">
            {cover.lat}°, {cover.lon}°
          </span>
        </div>
        <div className="flex flex-col items-end gap-1">
          {cover.demo ? <DemoChip /> : null}
          <StatusChip state={cover.state} />
        </div>
      </div>
      <div className="relative z-10 flex flex-col gap-4 p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Observed
            </span>
            <span className="text-2xl font-semibold leading-7">{observedDisplay(cover)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Threshold
            </span>
            <span className="text-2xl font-semibold leading-7 text-on-surface-variant">
              {thresholdDisplay(cover)}
            </span>
          </div>
        </div>
        <div className="h-px w-full bg-outline-variant" />
        <div className="flex justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Date (UTC)
            </span>
            <span className="font-mono text-[12px]">{cover.coverage_date}</span>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Payout
            </span>
            <span className="font-mono text-[12px] font-bold">
              {weiToGen(cover.payout)} GEN
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
