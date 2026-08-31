import type { EthereumProvider } from "./genlayer";

export type DetectedWallet = {
  id: string;
  name: string;
  rdns?: string;
  icon?: string;
  provider: EthereumProvider;
};

type Eip6963Announce = Event & {
  detail?: {
    info?: { uuid?: string; name?: string; icon?: string; rdns?: string };
    provider?: EthereumProvider;
  };
};

type FlaggedProvider = EthereumProvider & {
  isMetaMask?: boolean;
  isRabby?: boolean;
  isBraveWallet?: boolean;
  isCoinbaseWallet?: boolean;
  isRainbow?: boolean;
  isOkxWallet?: boolean;
  isPhantom?: boolean;
  providers?: FlaggedProvider[];
};

function nameFromFlags(p: FlaggedProvider): string {
  if (p.isRabby) return "Rabby";
  if (p.isBraveWallet) return "Brave Wallet";
  if (p.isCoinbaseWallet) return "Coinbase Wallet";
  if (p.isRainbow) return "Rainbow";
  if (p.isOkxWallet) return "OKX Wallet";
  if (p.isMetaMask) return "MetaMask";
  return "Injected wallet";
}

function enumerateWindowProviders(): DetectedWallet[] {
  if (typeof window === "undefined") return [];
  const w = window as unknown as {
    ethereum?: FlaggedProvider;
    evmproviders?: Record<string, FlaggedProvider>;
    coinbaseWalletExtension?: FlaggedProvider;
    okxwallet?: FlaggedProvider;
    rabby?: FlaggedProvider;
  };
  const found: DetectedWallet[] = [];
  const seen = new Set<EthereumProvider>();

  const push = (id: string, name: string, provider?: FlaggedProvider) => {
    if (!provider || seen.has(provider)) return;
    seen.add(provider);
    found.push({ id, name: nameFromFlags(provider) === "Injected wallet" ? name : nameFromFlags(provider), provider });
  };

  const eth = w.ethereum;
  if (eth?.providers?.length) {
    eth.providers.forEach((p, i) => push(`window.ethereum.providers.${i}`, nameFromFlags(p), p));
  } else if (eth) {
    push("window.ethereum", nameFromFlags(eth), eth);
  }

  if (w.evmproviders) {
    Object.entries(w.evmproviders).forEach(([key, p]) => push(`evmproviders:${key}`, key, p));
  }
  push("coinbaseWalletExtension", "Coinbase Wallet", w.coinbaseWalletExtension);
  push("okxwallet", "OKX Wallet", w.okxwallet);
  push("rabby", "Rabby", w.rabby);

  return found;
}

export function discoverInjectedWallets(onChange: (wallets: DetectedWallet[]) => void): () => void {
  const byId = new Map<string, DetectedWallet>();

  const publish = () => {
    const list = [...byId.values()];
    if (list.length === 0) {
      onChange(enumerateWindowProviders());
      return;
    }
    onChange(list);
  };

  const onAnnounce = (event: Event) => {
    const detail = (event as Eip6963Announce).detail;
    const info = detail?.info;
    const provider = detail?.provider;
    if (!info?.uuid || !provider) return;
    byId.set(info.uuid, {
      id: info.uuid,
      name: info.name || "Injected wallet",
      rdns: info.rdns,
      icon: info.icon,
      provider,
    });
    publish();
  };

  window.addEventListener("eip6963:announceProvider", onAnnounce as EventListener);
  window.dispatchEvent(new Event("eip6963:requestProvider"));

  const fallback = window.setTimeout(() => {
    if (byId.size === 0) {
      enumerateWindowProviders().forEach((w) => byId.set(w.id, w));
    }
    publish();
  }, 50);

  return () => {
    window.clearTimeout(fallback);
    window.removeEventListener("eip6963:announceProvider", onAnnounce as EventListener);
  };
}

let activeProvider: EthereumProvider | undefined;
let walletConnectProvider: EthereumProvider | undefined;

export function setActiveProvider(provider?: EthereumProvider) {
  activeProvider = provider;
}

export function getActiveProvider(): EthereumProvider | undefined {
  return activeProvider;
}

export function setWalletConnectProvider(provider?: EthereumProvider) {
  walletConnectProvider = provider;
}

export function getWalletConnectProvider(): EthereumProvider | undefined {
  return walletConnectProvider;
}

export const WC_CONNECTOR_ID = "walletconnect";
export const WALLET_STORAGE_KEY = "rainline.wallet";

export type StoredWallet = {
  connectorId: string;
  address: string;
  rdns?: string;
};

export function readStoredWallet(): StoredWallet | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(WALLET_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredWallet;
    if (!parsed.connectorId || !parsed.address) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredWallet(value: StoredWallet | null) {
  if (typeof window === "undefined") return;
  if (!value) {
    window.localStorage.removeItem(WALLET_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(value));
}

export function walletConnectProjectId(): string {
  return process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() ?? "";
}
