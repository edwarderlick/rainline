export default function DocsPage() {
  return (
    <div className="flex flex-col gap-8 md:flex-row">
      <aside className="flex w-full shrink-0 flex-col gap-8 md:w-1/4">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            [04] Limitations
          </span>
          <h1 className="mt-2 text-[32px] font-bold leading-9 tracking-tight md:text-[48px] md:leading-[52px]">
            Platform Constraints
          </h1>
        </div>
        <div className="flex flex-col gap-4 border border-outline bg-surface-container p-4">
          <span className="font-mono text-[12px] uppercase tracking-[0.05em] text-error">
            Critical notice
          </span>
          <p className="text-[15px] leading-[22px] text-on-surface-variant">
            Rainline operates strictly within the parameters on this page. StudioNet demo. Not a
            licensed carrier.
          </p>
          <p className="text-[15px] leading-[22px] text-on-surface-variant">
            Connect any EIP-1193 wallet (MetaMask, Rabby, Brave, Coinbase, Rainbow). The wallet
            must accept a custom network: StudioNet, chain 61999, RPC studio.genlayer.com/api,
            symbol GEN. Get test GEN from the Studio faucet.
          </p>
        </div>
        <nav className="sticky top-24 flex flex-col gap-2">
          <a
            href="#regulatory"
            className="flex items-center justify-between border border-outline p-3 hover:bg-surface-variant"
          >
            <span className="font-mono text-[12px]">01. Regulatory status</span>
          </a>
          <a
            href="#data-fidelity"
            className="flex items-center justify-between border border-outline p-3 hover:bg-surface-variant"
          >
            <span className="font-mono text-[12px]">02. Data fidelity</span>
          </a>
          <a
            href="#execution"
            className="flex items-center justify-between border border-outline p-3 hover:bg-surface-variant"
          >
            <span className="font-mono text-[12px]">03. Execution risk</span>
          </a>
        </nav>
      </aside>

      <div className="flex w-full flex-col gap-8 md:w-3/4">
        <section className="flex flex-col gap-4" id="regulatory">
          <div className="flex items-baseline justify-between border-b border-outline pb-2">
            <h2 className="text-2xl font-semibold">01. Regulatory status</h2>
          </div>
          <div className="flex flex-col gap-3 border border-outline bg-surface p-6">
            <h3 className="font-mono text-[12px] uppercase tracking-[0.05em] text-primary">
              Not insurance
            </h3>
            <p className="text-lg leading-7">
              Rainline is parametric cover on GenLayer StudioNet. It is not a licensed insurance
              policy and not a weather prediction market. Contracts trigger on predefined data
              parameters. They do not indemnify actual loss.
            </p>
          </div>
        </section>

        <section className="mt-4 flex flex-col gap-4" id="data-fidelity">
          <div className="flex items-baseline justify-between border-b border-outline pb-2">
            <h2 className="text-2xl font-semibold">02. Data fidelity</h2>
            <span className="font-mono text-[10px] font-bold uppercase text-on-surface-variant">
              Source: Open-Meteo
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-3 border border-outline bg-surface p-6">
              <h3 className="font-mono text-[12px] uppercase tracking-[0.05em] text-primary">
                Model vs. station
              </h3>
              <p className="text-[15px] leading-[22px] text-on-surface-variant">
                Open-Meteo model precipitation is not a street-level rain gauge. Local
                microclimates may experience rain not reflected in the model grid. The docket
                prints the exact URL and field.
              </p>
            </div>
            <div className="flex flex-col gap-3 border border-outline bg-surface p-6">
              <h3 className="font-mono text-[12px] uppercase tracking-[0.05em] text-primary">
                Pinned host
              </h3>
              <p className="text-[15px] leading-[22px] text-on-surface-variant">
                Evidence host is pinned. Buyers cannot paste a URL. Historical-forecast
                precipitation_sum / temperature_2m_max only. Free Open-Meteo is non-commercial.
              </p>
            </div>
            <div className="flex flex-col gap-3 border border-outline bg-surface p-6 md:col-span-2">
              <h3 className="font-mono text-[12px] uppercase tracking-[0.05em] text-primary">
                Time rules
              </h3>
              <div className="mt-2 flex flex-col gap-6 md:flex-row">
                <div className="flex-1 border-l-2 border-outline-variant pl-4">
                  <span className="mb-1 block font-mono text-[10px] font-bold uppercase text-on-surface-variant">
                    Buy cutoff
                  </span>
                  <span className="block">D minus 24h (00:00 UTC)</span>
                </div>
                <div className="flex-1 border-l-2 border-outline-variant pl-4">
                  <span className="mb-1 block font-mono text-[10px] font-bold uppercase text-on-surface-variant">
                    Cancel
                  </span>
                  <span className="block">Until D 00:00 UTC</span>
                </div>
                <div className="flex-1 border-l-2 border-primary pl-4">
                  <span className="mb-1 block font-mono text-[10px] font-bold uppercase text-on-surface-variant">
                    Resolve
                  </span>
                  <span className="block">From D+1 00:00 UTC</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 flex flex-col gap-4" id="execution">
          <div className="flex items-baseline justify-between border-b border-outline pb-2">
            <h2 className="text-2xl font-semibold">03. Execution risk</h2>
            <span className="font-mono text-[10px] font-bold uppercase text-on-surface-variant">
              On-chain
            </span>
          </div>
          <div className="flex flex-col border border-outline bg-surface-container">
            <div className="flex flex-col border-b border-outline md:flex-row">
              <div className="flex items-center border-outline bg-surface-container-high p-4 md:w-1/3 md:border-r">
                <span className="font-mono text-[12px]">Missing data</span>
              </div>
              <div className="bg-surface p-4 md:w-2/3">
                <p className="text-[15px] leading-[22px] text-on-surface-variant">
                  If the host 429s or the field is null, the product refunds instead of guessing.
                  INSUFFICIENT always returns the premium.
                </p>
              </div>
            </div>
            <div className="flex flex-col border-b border-outline md:flex-row">
              <div className="flex items-center border-outline bg-surface-container-high p-4 md:w-1/3 md:border-r">
                <span className="font-mono text-[12px]">Liquidity</span>
              </div>
              <div className="bg-surface p-4 md:w-2/3">
                <p className="text-[15px] leading-[22px] text-on-surface-variant">
                  Payout is reserved from the pool at buy time. There is no pro-rata shortfall
                  path and no queue. The buy reverts if the reserve cannot be made.
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row">
              <div className="flex items-center border-outline bg-surface-container-high p-4 md:w-1/3 md:border-r">
                <span className="font-mono text-[12px]">Transfer failure</span>
              </div>
              <div className="bg-surface p-4 md:w-2/3">
                <p className="text-[15px] leading-[22px] text-on-surface-variant">
                  If emit_transfer fails, funds credit the recipient for withdraw(). No flights.
                  No custom policy text. No keeper. No appeals.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
