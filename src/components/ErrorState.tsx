import { Icon } from "./Icon";

export function ErrorState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-error bg-error-container p-6">
      <div className="flex items-center gap-2 text-error">
        <Icon name="warning" filled />
        <span className="font-mono text-[12px] uppercase tracking-[0.05em]">{title}</span>
      </div>
      <p className="mt-3 text-on-error-container">{body}</p>
    </div>
  );
}

export function PoolCapacityError() {
  return (
    <div className="border border-outline bg-surface">
      <div className="relative h-24 overflow-hidden border-b border-outline bg-surface-container-high p-4">
        <span className="absolute -bottom-3 -left-1 select-none font-sans text-[80px] font-extrabold leading-none text-surface-variant">
          ERR_CAP
        </span>
      </div>
      <div className="space-y-4 p-6">
        <span className="inline-block border border-secondary-fixed-dim bg-secondary-fixed px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-on-secondary-fixed">
          Rejected
        </span>
        <h3 className="text-2xl font-semibold">Pool cannot reserve 4× payout</h3>
        <p className="text-on-surface-variant">
          Buys revert unless unreserved liquidity plus the premium can cover a 4× payout. Fund
          the pool with <span className="font-mono">fund_pool()</span> after deploy. No invented
          reserve figure is shown here.
        </p>
      </div>
    </div>
  );
}

export function BuyWindowClosed({ deadline }: { deadline: string }) {
  return (
    <div className="border border-outline bg-surface p-6">
      <span className="mb-3 inline-block border border-tertiary-fixed-dim bg-tertiary-fixed px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-tertiary">
        Buy window closed
      </span>
      <h3 className="text-2xl font-semibold">Purchasing window inactive</h3>
      <p className="mt-2 text-on-surface-variant">
        Buys close 24 hours before 00:00 UTC on the coverage day. That stops buying when the
        radar already shows a storm.
      </p>
      <p className="mt-4 font-mono text-[12px] uppercase tracking-[0.05em] text-on-surface-variant">
        Deadline was {deadline}
      </p>
    </div>
  );
}
