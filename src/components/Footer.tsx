import { CONTRACT_ADDRESS } from "@/lib/contract";
import { explorerHint, hasContract, shortAddr } from "@/lib/genlayer";

export function SiteFooter({ inverted = false }: { inverted?: boolean }) {
  return (
    <footer
      className={
        inverted
          ? "bg-inverse-surface px-4 py-12 text-inverse-on-surface md:px-10"
          : "border-t border-outline-variant bg-surface-container-lowest px-4 py-12 md:px-10"
      }
    >
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <span
            className={`font-mono text-[10px] font-bold uppercase tracking-widest ${
              inverted ? "text-outline-variant" : "text-on-surface-variant"
            }`}
          >
            Rainline parametric cover
          </span>
          <div
            className={`flex items-center gap-2 border px-3 py-1 ${
              inverted ? "border-outline-variant/30 bg-inverse-surface/50" : "border-outline-variant bg-surface-container-high"
            }`}
          >
            <span className="font-mono text-[12px] uppercase tracking-[0.05em] text-on-surface-variant">
              Contract:
            </span>
            <span className="font-mono text-[12px] font-bold text-primary">
              {hasContract() ? shortAddr(CONTRACT_ADDRESS) : "not deployed"}
            </span>
          </div>
          <p
            className={`max-w-xl font-mono text-[10px] uppercase leading-relaxed ${
              inverted ? "text-outline-variant" : "text-on-surface-variant"
            }`}
          >
            {explorerHint()}. Not licensed insurance. StudioNet test GEN.
          </p>
        </div>
        {!inverted ? (
          <p className="text-xs italic text-on-surface-variant/60">No appeals. No markets.</p>
        ) : (
          <span className="font-sans text-[48px] font-extrabold uppercase leading-none tracking-tighter">
            Rainline<sup className="text-[24px]">®</sup>
          </span>
        )}
      </div>
    </footer>
  );
}
