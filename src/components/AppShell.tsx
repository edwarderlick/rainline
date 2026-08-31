"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { WalletChip } from "./WalletChip";
import { WalletModal } from "./WalletModal";
import { MobileNetworkBanner, NetworkBanner } from "./NetworkBanner";
import { SiteFooter } from "./Footer";
import { Icon } from "./Icon";

const NAV = [
  { href: "/buy", label: "Buy", icon: "shield_with_heart" },
  { href: "/covers", label: "Covers", icon: "inventory_2" },
  { href: "/pool", label: "Pool", icon: "account_balance" },
  { href: "/docs", label: "Limits", icon: "bar_chart_4_bars" },
] as const;

function active(pathname: string, href: string) {
  if (href === "/covers") return pathname.startsWith("/covers");
  return pathname === href;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-on-background">
      <header className="sticky top-0 z-40 border-b border-outline-variant bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-3 px-4 md:px-10">
          <div className="flex min-w-0 items-center gap-4 md:gap-8">
            <Link href="/" className="flex items-center gap-3">
              <Logo />
            </Link>
            <nav className="hidden items-center gap-6 md:flex">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active(pathname, item.href)
                      ? "font-bold text-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <WalletChip />
        </div>
      </header>
      <div className="hidden md:block">
        <NetworkBanner />
      </div>
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-28 pt-8 md:px-10 md:pb-12">
        {children}
      </main>
      <SiteFooter />
      <MobileNetworkBanner />
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant bg-surface-container-highest/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="flex h-20 items-center justify-between px-4">
          {NAV.map((item) => {
            const on = active(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 ${
                  on ? "bg-primary text-on-primary" : "text-on-surface-variant"
                }`}
              >
                <Icon name={item.icon} />
                <span className="font-mono text-[12px] uppercase tracking-[0.05em]">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      <WalletModal />
    </div>
  );
}
