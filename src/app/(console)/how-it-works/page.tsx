import { Icon } from "@/components/Icon";
import { ContractStatusNote, WalletReviewerNote } from "@/components/ContractStatusNote";
import { PAYOUT_RATIO } from "@/lib/templates";

export default function HowItWorksPage() {
  return (
    <div className="border border-outline/30">
      <div className="border-b border-outline/30 bg-surface-container-lowest p-6 md:p-10">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-mono text-[12px] uppercase tracking-widest text-tertiary">
            [01] System protocol
          </span>
          <span className="border border-primary-container bg-primary-container px-2 py-1 font-mono text-[10px] font-bold uppercase text-on-primary-container">
            Live
          </span>
        </div>
        <h1 className="mb-2 text-[32px] font-bold leading-9 tracking-tight md:text-[80px] md:leading-[72px]">
          How Cover Works
        </h1>
        <p className="max-w-2xl text-lg leading-7 text-on-surface-variant">
          A buyer pays a fixed premium on a fixed template. After the UTC day closes, validators
          fetch a pinned Open-Meteo historical-forecast URL, extract one number, and the contract
          pays, keeps, or refunds.
        </p>
        <div className="mt-6 max-w-2xl space-y-3">
          <ContractStatusNote />
          <WalletReviewerNote />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12">
        <div className="border-b border-outline/30 md:col-span-8 md:border-r md:border-b-0">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="border-b border-outline/30 p-6 hover:bg-surface-container-low md:border-r">
              <div className="mb-4 flex items-center gap-2">
                <span className="font-mono text-[12px] text-primary">01</span>
                <Icon name="account_balance" className="text-[16px] text-primary" />
              </div>
              <h3 className="mb-2 text-2xl font-semibold">Fund the pool</h3>
              <p className="mb-4 text-[15px] leading-[22px] text-on-surface-variant">
                Anyone calls <span className="font-mono">fund_pool()</span>. Buys revert unless
                unreserved liquidity can cover a {PAYOUT_RATIO}× payout.
              </p>
              <div className="border border-outline/50 bg-surface p-2 font-mono text-[12px] uppercase tracking-[0.05em] text-tertiary">
                Status: awaiting deposit
              </div>
            </div>
            <div className="border-b border-outline/30 p-6 hover:bg-surface-container-low">
              <div className="mb-4 flex items-center gap-2">
                <span className="font-mono text-[12px] text-primary">02</span>
                <Icon name="tune" className="text-[16px] text-primary" />
              </div>
              <h3 className="mb-2 text-2xl font-semibold">Parameter selection</h3>
              <p className="mb-4 text-[15px] leading-[22px] text-on-surface-variant">
                RAIN / DRY / HEAT, latitude, longitude, a UTC coverage day, threshold, and
                premium. Buyers cannot paste an evidence URL.
              </p>
              <div className="flex justify-between border border-outline/50 bg-surface p-2 font-mono text-[12px] uppercase tracking-[0.05em] text-tertiary">
                <span>Rain / Dry / Heat</span>
                <span>UTC day</span>
              </div>
            </div>
          </div>

          <div className="border-b border-outline/30 bg-surface-container-lowest p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="font-mono text-[12px] text-error">03</span>
              <Icon name="block" className="text-[16px] text-error" />
            </div>
            <h3 className="mb-2 text-2xl font-semibold">Buy refusal logic</h3>
            <p className="max-w-xl text-[15px] leading-[22px] text-on-surface-variant">
              The contract refuses the buy if the pool cannot reserve {PAYOUT_RATIO}× or if the
              clock is inside D minus 24 hours.
            </p>
            <div className="mt-6 flex flex-col gap-2 border border-outline/30 bg-surface p-4">
              <span className="font-mono text-[11px] text-on-surface">
                1. Pool lacks {PAYOUT_RATIO}× collateral reserve.
              </span>
              <span className="font-mono text-[11px] text-on-surface">
                2. Attempting to buy within 24h of target date.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="border-b border-outline/30 p-6 hover:bg-surface-container-low md:border-r md:border-b-0">
              <div className="mb-4 flex items-center gap-2">
                <span className="font-mono text-[12px] text-primary">04</span>
                <Icon name="schedule" className="text-[16px] text-primary" />
              </div>
              <h3 className="mb-2 text-2xl font-semibold">Resolution timing</h3>
              <p className="text-[15px] leading-[22px] text-on-surface-variant">
                Cancel is allowed until D 00:00 UTC. Resolve is allowed from D+1 00:00 UTC.
                Clock is on-chain, not the UI.
              </p>
            </div>
            <div className="p-6 hover:bg-surface-container-low">
              <div className="mb-4 flex items-center gap-2">
                <span className="font-mono text-[12px] text-primary">05</span>
                <Icon name="sync" className="text-[16px] text-primary" />
              </div>
              <h3 className="mb-2 text-2xl font-semibold">Validator fetch</h3>
              <p className="text-[15px] leading-[22px] text-on-surface-variant">
                Validators fetch the contract-pinned historical-forecast URL. A missing or null
                field is INSUFFICIENT, never a guessed millimetre.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col bg-surface-container md:col-span-4">
          <div className="border-b border-outline/30 p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="font-mono text-[12px] text-secondary">06</span>
              <Icon name="price_check" className="text-[16px] text-secondary" />
            </div>
            <h3 className="mb-2 text-2xl font-semibold">Payout / refund</h3>
            <p className="mb-6 text-[15px] leading-[22px] text-on-surface-variant">
              Recipients and amounts come from contract storage. If native send fails, funds
              credit for <span className="font-mono">withdraw()</span>.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between border border-secondary bg-secondary/10 p-3">
                <span className="font-mono text-[12px]">PAY</span>
                <span className="bg-secondary px-2 py-1 font-mono text-[10px] font-bold text-on-secondary">
                  {PAYOUT_RATIO}× to buyer
                </span>
              </div>
              <div className="flex items-center justify-between border border-outline/50 bg-surface p-3">
                <span className="font-mono text-[12px]">KEEP</span>
                <span className="border border-outline/50 bg-surface-variant px-2 py-1 font-mono text-[10px] font-bold text-on-surface-variant">
                  Pool keeps premium
                </span>
              </div>
              <div className="flex items-center justify-between border border-outline/50 bg-surface p-3">
                <span className="font-mono text-[12px]">INSUFFICIENT</span>
                <span className="bg-error px-2 py-1 font-mono text-[10px] font-bold text-on-error">
                  Refund
                </span>
              </div>
              <div className="flex items-center justify-between border border-outline/50 bg-surface p-3">
                <span className="font-mono text-[12px]">CANCELED</span>
                <span className="bg-tertiary px-2 py-1 font-mono text-[10px] font-bold text-on-tertiary">
                  Refund
                </span>
              </div>
            </div>
          </div>
          <div className="relative flex-1 overflow-hidden bg-surface-container-high p-6">
            <h4 className="relative z-10 mb-2 flex items-center text-2xl font-semibold">
              Strict finality
            </h4>
            <p className="relative z-10 text-lg font-bold text-on-surface-variant">Zero appeals.</p>
            <p className="relative z-10 mt-2 text-[15px] leading-[22px] text-on-surface-variant">
              The contract has no appeal path, no FOR/AGAINST book, no keeper, and no court.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
