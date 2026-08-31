import { formatGenDisplay } from "@/lib/templates";

export function GenBalanceLine({
  wrongNetwork,
  balanceWei,
  balanceError,
  className = "",
}: {
  wrongNetwork: boolean;
  balanceWei: bigint | null;
  balanceError: boolean;
  className?: string;
}) {
  if (wrongNetwork) {
    return (
      <span className={`font-mono text-[10px] uppercase tracking-[0.04em] text-error ${className}`}>
        switch to StudioNet to read GEN
      </span>
    );
  }
  if (balanceError) {
    return (
      <span className={`font-mono text-[10px] uppercase tracking-[0.04em] text-on-surface-variant ${className}`}>
        — <span className="normal-case tracking-normal">balance unavailable</span>
      </span>
    );
  }
  if (balanceWei === null) return null;
  return (
    <span className={`font-mono text-[10px] uppercase tracking-[0.04em] ${className}`}>
      {formatGenDisplay(balanceWei)} GEN
    </span>
  );
}
