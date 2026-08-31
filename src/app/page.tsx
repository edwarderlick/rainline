import Link from "next/link";
import { AtmosphereShader } from "@/components/AtmosphereShader";
import { WeatherLayer } from "@/components/WeatherLayer";
import { SiteFooter } from "@/components/Footer";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";
import { PAYOUT_RATIO, TEMPLATES } from "@/lib/templates";
import { appEntryHref } from "@/lib/app-entry";

const TEMPLATE_COPY = [
  {
    id: "RAIN" as const,
    icon: "water_drop",
    title: "Rain",
    body: "Pays if daily precipitation_sum is at or above the threshold.",
  },
  {
    id: "DRY" as const,
    icon: "grass",
    title: "Dry",
    body: "Pays if daily precipitation_sum is at or below the threshold.",
  },
  {
    id: "HEAT" as const,
    icon: "thermostat",
    title: "Heat",
    body: "Pays if daily temperature_2m_max is at or above the threshold.",
  },
];

export default function LandingPage() {
  const openHref = appEntryHref();
  return (
    <div className="relative min-h-[100dvh] bg-background text-on-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <AtmosphereShader />
        <WeatherLayer kind="mixed" />
        <div className="tech-grid absolute inset-0 opacity-25" />
      </div>
      <header className="relative z-10 flex items-center justify-between px-4 py-5 md:px-10">
        <Link href="/">
          <Logo />
        </Link>
        <Link
          href={openHref}
          className="border border-primary bg-primary px-4 py-2 font-mono text-[12px] uppercase tracking-wider text-on-primary hover:bg-primary-container"
        >
          Open app
        </Link>
      </header>
      <main className="relative z-10 mx-auto max-w-[1280px] px-4 pb-16 md:px-10">
        <section className="border-b border-outline py-10 md:py-16">
          <h1 className="w-fit border-b-2 border-primary pr-8 pb-2 font-sans text-[48px] font-extrabold uppercase leading-none tracking-tighter text-primary md:text-[80px] md:leading-[72px]">
            Rainline<sup className="ml-1 text-[24px] md:text-[32px]">®</sup>
          </h1>
          <p className="mt-6 max-w-xl font-mono text-[12px] uppercase leading-relaxed tracking-wide text-on-surface-variant">
            Parametric weather cover. Observed rain, dry, or heat. Missing data refunds.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href={openHref}
              className="flex items-center gap-2 border border-primary bg-primary px-6 py-3 font-mono text-[12px] uppercase tracking-wider text-on-primary hover:bg-primary/90"
            >
              Open app <Icon name="arrow_forward" className="text-[16px]" />
            </Link>
            <Link
              href="/how-it-works"
              className="flex items-center gap-2 border border-outline bg-transparent px-6 py-3 font-mono text-[12px] uppercase tracking-wider text-on-surface hover:bg-surface-container"
            >
              How it works
            </Link>
          </div>
        </section>

        <section className="relative border-b border-outline py-12">
          <div className="mb-8 flex items-center gap-4">
            <span className="border border-outline px-2 py-0.5 font-mono text-[12px] uppercase tracking-widest text-outline">
              [01]
            </span>
            <h2 className="text-2xl font-semibold">Cover templates</h2>
          </div>
          <div className="flex flex-col gap-4 md:grid md:grid-cols-1">
            {TEMPLATE_COPY.map((t) => {
              const meta = TEMPLATES.find((x) => x.id === t.id)!;
              return (
                <div key={t.id} className="flex items-start gap-4 border border-outline bg-surface p-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center border border-outline ${
                      t.id === "RAIN"
                        ? "bg-secondary-fixed/30 text-secondary"
                        : t.id === "DRY"
                          ? "bg-tertiary-fixed/30 text-tertiary"
                          : "bg-primary-fixed/30 text-primary"
                    }`}
                  >
                    <Icon name={t.icon} />
                  </div>
                  <div>
                    <h3 className="mb-1 font-mono text-[12px] font-bold uppercase tracking-[0.05em]">
                      {t.title}
                    </h3>
                    <p className="font-mono text-[10px] font-bold uppercase text-on-surface-variant">
                      Field: {meta.field}. Default {meta.defaultThreshold} {meta.unit}.
                    </p>
                    <p className="mt-1 text-sm text-on-surface-variant">{t.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="border-b border-outline bg-surface-container-low py-12">
          <div className="mb-8 flex items-center gap-4 px-0">
            <span className="border border-outline px-2 py-0.5 font-mono text-[12px] uppercase tracking-widest text-outline">
              [02]
            </span>
            <h2 className="text-2xl font-semibold">Resolution protocol</h2>
          </div>
          <div className="grid grid-cols-1 gap-px border border-outline bg-outline md:grid-cols-3">
            <div className="flex flex-col bg-secondary p-4 text-on-secondary">
              <span className="mb-2 font-mono text-[12px] uppercase tracking-[0.05em] text-on-secondary/70">
                Outcome: trigger hit
              </span>
              <span className="mb-1 text-[32px] font-bold leading-9">{PAYOUT_RATIO}.0x</span>
              <span className="font-mono text-[10px] font-bold uppercase">Payout to buyer</span>
            </div>
            <div className="flex flex-col bg-surface p-4">
              <span className="mb-2 font-mono text-[12px] uppercase tracking-[0.05em] text-on-surface-variant">
                Outcome: missed
              </span>
              <span className="mb-1 text-2xl font-semibold">0.0x</span>
              <span className="font-mono text-[10px] font-bold uppercase text-on-surface-variant">
                Pool keeps premium
              </span>
            </div>
            <div className="flex flex-col bg-surface p-4">
              <span className="mb-2 font-mono text-[12px] uppercase tracking-[0.05em] text-on-surface-variant">
                Outcome: no data
              </span>
              <span className="mb-1 text-2xl font-semibold">1.0x</span>
              <span className="font-mono text-[10px] font-bold uppercase text-on-surface-variant">
                Full refund issued
              </span>
            </div>
          </div>
        </section>
      </main>
      <div className="relative z-10">
        <SiteFooter inverted />
      </div>
    </div>
  );
}
