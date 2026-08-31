import type { CoverState } from "@/lib/contract";
import { canMarkPaid } from "@/lib/status";

export function StatusChip({ state }: { state: CoverState }) {
  const paid = canMarkPaid(state);
  const tone =
    state === "OPEN"
      ? "bg-primary text-on-primary border-on-primary-fixed-variant"
      : state === "RESOLVED_PAY"
        ? "bg-primary text-on-primary border-on-primary-fixed-variant"
        : state === "RESOLVED_KEEP"
          ? "bg-surface-variant text-on-surface-variant border-outline-variant"
          : state === "INSUFFICIENT"
            ? "bg-error text-on-error border-error"
            : "bg-tertiary text-on-tertiary border-tertiary";

  return (
    <span className="inline-flex items-center gap-1">
      <span className={`border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest ${tone}`}>
        {state}
      </span>
      {paid ? (
        <span className="border border-secondary bg-secondary-container px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-on-secondary-container">
          {state === "REFUNDED" || state === "INSUFFICIENT" ? "Refunded" : "Paid"}
        </span>
      ) : null}
    </span>
  );
}

export function DemoChip() {
  return (
    <span className="border border-outline bg-surface-container-high px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
      Demo
    </span>
  );
}
