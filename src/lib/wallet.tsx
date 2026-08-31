"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  hasContract,
  isStudioNetChain,
  readChainId,
  readStudioBalance,
  silentAccounts,
  switchToStudioNet,
  type EthereumProvider,
} from "./genlayer";
import {
  WC_CONNECTOR_ID,
  discoverInjectedWallets,
  getWalletConnectProvider,
  readStoredWallet,
  setActiveProvider,
  setWalletConnectProvider,
  walletConnectProjectId,
  writeStoredWallet,
  type DetectedWallet,
} from "./injected-wallets";

type WalletContextValue = {
  address: string | null;
  chainId: string | null;
  connecting: boolean;
  error: string | null;
  modalOpen: boolean;
  wrongNetwork: boolean;
  wallets: DetectedWallet[];
  connectorId: string | null;
  writesBlocked: string | null;
  balanceWei: bigint | null;
  balanceError: boolean;
  balanceLoading: boolean;
  refreshBalance: () => Promise<void>;
  connect: (wallet: DetectedWallet) => Promise<void>;
  connectWalletConnect: () => Promise<void>;
  switchWallet: () => Promise<void>;
  switchNetwork: () => Promise<void>;
  disconnect: () => Promise<void>;
  openModal: () => void;
  closeModal: () => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

function attachListeners(
  provider: EthereumProvider,
  onAccounts: (...args: unknown[]) => void,
  onChain: (...args: unknown[]) => void
) {
  provider.on?.("accountsChanged", onAccounts);
  provider.on?.("chainChanged", onChain);
  return () => {
    provider.removeListener?.("accountsChanged", onAccounts);
    provider.removeListener?.("chainChanged", onChain);
  };
}

/**
 * Live permission check. localStorage is never the source of truth.
 * Empty eth_accounts → not connected to this origin.
 */
async function liveAccounts(provider: EthereumProvider): Promise<string[]> {
  return silentAccounts(provider);
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [wallets, setWallets] = useState<DetectedWallet[]>([]);
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [provider, setProvider] = useState<EthereumProvider | null>(null);
  const [balanceWei, setBalanceWei] = useState<bigint | null>(null);
  const [balanceError, setBalanceError] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const providerRef = useRef<EthereumProvider | null>(null);
  const connectorRef = useRef<string | null>(null);
  const addressRef = useRef<string | null>(null);
  const chainIdRef = useRef<string | null>(null);

  useEffect(() => {
    providerRef.current = provider;
  }, [provider]);
  useEffect(() => {
    connectorRef.current = connectorId;
  }, [connectorId]);
  useEffect(() => {
    addressRef.current = address;
  }, [address]);
  useEffect(() => {
    chainIdRef.current = chainId;
  }, [chainId]);

  const clearSession = useCallback(() => {
    setActiveProvider(undefined);
    writeStoredWallet(null);
    providerRef.current = null;
    connectorRef.current = null;
    setProvider(null);
    setAddress(null);
    setChainId(null);
    setConnectorId(null);
    setBalanceWei(null);
    setBalanceError(false);
    setBalanceLoading(false);
  }, []);

  const paintLive = useCallback(async (next: EthereumProvider, id: string, accounts: string[]) => {
    if (accounts.length === 0) {
      clearSession();
      return null;
    }
    const live = accounts[0];
    setActiveProvider(next);
    providerRef.current = next;
    connectorRef.current = id;
    setProvider(next);
    setAddress(live);
    setConnectorId(id);
    writeStoredWallet({ connectorId: id, address: live, rdns: wallets.find((w) => w.id === id)?.rdns });
    setChainId(await readChainId(next));
    return live;
  }, [clearSession, wallets]);

  /**
   * restore(): storage is a hint for WHICH provider to query.
   * UI Connected only if eth_accounts on that provider is non-empty.
   * Never paints a stored 0x if the wallet has not permitted this origin.
   */
  const restore = useCallback(async () => {
    const stored = readStoredWallet();
    if (!stored) return;

    let candidate: EthereumProvider | undefined;
    let id = stored.connectorId;

    if (stored.connectorId === WC_CONNECTOR_ID) {
      candidate = getWalletConnectProvider();
      if (!candidate) {
        clearSession();
        return;
      }
    } else {
      const match =
        wallets.find((w) => w.id === stored.connectorId) ||
        (stored.rdns ? wallets.find((w) => w.rdns === stored.rdns) : undefined);
      if (!match) {
        clearSession();
        return;
      }
      candidate = match.provider;
      id = match.id;
    }

    const accounts = await liveAccounts(candidate);
    if (accounts.length === 0) {
      clearSession();
      return;
    }
    const live =
      accounts.find((a) => a.toLowerCase() === stored.address.toLowerCase()) ?? accounts[0];
    await paintLive(candidate, id, [live, ...accounts.filter((a) => a !== live)]);
  }, [clearSession, paintLive, wallets]);

  /**
   * connect(): explicit user click. ALWAYS eth_requestAccounts on the
   * EIP-6963 provider they clicked. That is the MetaMask popup.
   * client.connect("studionet") is optional and must never replace step 1.
   */
  const connect = useCallback(
    async (wallet: DetectedWallet) => {
      setConnecting(true);
      setError(null);
      try {
        const accounts = (await wallet.provider.request({
          method: "eth_requestAccounts",
        })) as string[];
        const addr = accounts?.[0];
        if (!addr) {
          clearSession();
          throw new Error("Wallet did not return an account.");
        }
        setActiveProvider(wallet.provider);
        await switchToStudioNet(wallet.provider);
        try {
          const { createClient } = await import("genlayer-js");
          const { studionet } = await import("genlayer-js/chains");
          const client = createClient({
            chain: studionet,
            account: addr as `0x${string}`,
            provider: wallet.provider,
          });
          await client.connect("studionet");
        } catch {
          /* Snaps are MetaMask-only. Permission already granted via eth_requestAccounts. */
        }
        const confirmed = await liveAccounts(wallet.provider);
        if (confirmed.length === 0) {
          clearSession();
          throw new Error("Wallet did not grant this origin. Connect was denied or revoked.");
        }
        await paintLive(wallet.provider, wallet.id, confirmed);
        setModalOpen(false);
      } catch (err) {
        const code = (err as { code?: number }).code;
        if (code === 4001) {
          clearSession();
          setError("Connection rejected. Rainline is not connected.");
        } else {
          setError(err instanceof Error ? err.message : "Connect failed");
        }
      } finally {
        setConnecting(false);
      }
    },
    [clearSession, paintLive]
  );

  useEffect(() => {
    return discoverInjectedWallets(setWallets);
  }, []);

  useEffect(() => {
    if (connecting) return;
    if (wallets.length === 0 && !readStoredWallet()) return;
    void restore();
  }, [wallets, restore, connecting]);

  useEffect(() => {
    if (!provider) return;
    const onAccounts = (...args: unknown[]) => {
      const accounts = Array.isArray(args[0]) ? (args[0] as string[]) : [];
      if (accounts.length === 0) {
        clearSession();
        return;
      }
      const next = accounts[0];
      setAddress(next);
      const id = connectorRef.current;
      if (id) writeStoredWallet({ connectorId: id, address: next });
    };
    const onChain = (...args: unknown[]) => {
      setChainId((args[0] as string) ?? null);
    };
    return attachListeners(provider, onAccounts, onChain);
  }, [provider, clearSession]);

  useEffect(() => {
    const onFocus = () => {
      const eth = providerRef.current;
      if (!eth) {
        if (readStoredWallet()) void restore();
        return;
      }
      void liveAccounts(eth).then((accounts) => {
        if (accounts.length === 0) {
          clearSession();
          return;
        }
        setAddress(accounts[0]);
      });
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [clearSession, restore]);

  const switchWallet = useCallback(async () => {
    const eth = providerRef.current;
    const current = wallets.find((w) => w.id === connectorRef.current);
    if (eth && current) {
      await connect(current);
      return;
    }
    setAddress(null);
    setError(null);
  }, [connect, wallets]);

  const connectWalletConnect = useCallback(async () => {
    const projectId = walletConnectProjectId();
    if (!projectId) {
      setError("Injected wallets only until a WalletConnect project id is set.");
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const { EthereumProvider } = await import("@walletconnect/ethereum-provider");
      const wc = await EthereumProvider.init({
        projectId,
        showQrModal: true,
        chains: [61999],
        optionalChains: [61999],
        methods: [
          "eth_sendTransaction",
          "personal_sign",
          "eth_signTypedData_v4",
          "wallet_switchEthereumChain",
          "wallet_addEthereumChain",
        ],
        rpcMap: { "61999": "https://studio.genlayer.com/api" },
        metadata: {
          name: "Rainline",
          description: "Parametric weather cover on GenLayer StudioNet",
          url: typeof window !== "undefined" ? window.location.origin : "https://rainline.app",
          icons: typeof window !== "undefined" ? [`${window.location.origin}/logo.svg`] : [],
        },
      });
      await Promise.race([
        wc.connect(),
        new Promise((_, reject) => {
          window.setTimeout(
            () =>
              reject(
                new Error(
                  "WalletConnect timed out. Use an injected wallet, or accept StudioNet (chain 61999)."
                )
              ),
            90000
          );
        }),
      ]);
      const eip = wc as unknown as EthereumProvider;
      setWalletConnectProvider(eip);
      const accounts = (await eip.request({ method: "eth_requestAccounts" })) as string[];
      if (!accounts?.[0]) {
        clearSession();
        throw new Error("WalletConnect did not return an account.");
      }
      await switchToStudioNet(eip);
      const confirmed = await liveAccounts(eip);
      if (confirmed.length === 0) {
        clearSession();
        throw new Error("WalletConnect session is not permitted for this origin.");
      }
      await paintLive(eip, WC_CONNECTOR_ID, confirmed);
      const chain = await readChainId(eip);
      if (!isStudioNetChain(chain)) {
        throw new Error(
          "WalletConnect session is not on StudioNet (chain 61999). The wallet must accept that custom network."
        );
      }
      setModalOpen(false);
    } catch (err) {
      clearSession();
      setError(
        err instanceof Error
          ? err.message
          : "WalletConnect could not add StudioNet (chain 61999). Use an injected wallet."
      );
    } finally {
      setConnecting(false);
    }
  }, [clearSession, paintLive]);

  const switchNetwork = useCallback(async () => {
    setError(null);
    try {
      const eth = providerRef.current;
      if (!eth) throw new Error("Connect a wallet first.");
      await switchToStudioNet(eth);
      setChainId(await readChainId(eth));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not switch to StudioNet");
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await providerRef.current?.disconnect?.();
      await getWalletConnectProvider()?.disconnect?.();
    } catch {
      /* injected MetaMask has no disconnect */
    }
    setWalletConnectProvider(undefined);
    clearSession();
    setError(null);
    setModalOpen(false);
  }, [clearSession]);

  const openModal = useCallback(() => {
    setError(null);
    const eth = providerRef.current;
    if (eth) {
      void liveAccounts(eth).then((accounts) => {
        if (accounts.length === 0) {
          clearSession();
        } else {
          setAddress(accounts[0]);
        }
        setModalOpen(true);
      });
      return;
    }
    if (readStoredWallet()) {
      void restore().then(() => setModalOpen(true));
      return;
    }
    setModalOpen(true);
  }, [clearSession, restore]);

  const refreshBalance = useCallback(async () => {
    const addr = addressRef.current;
    if (!addr) {
      setBalanceWei(null);
      setBalanceError(false);
      setBalanceLoading(false);
      return;
    }
    if (!isStudioNetChain(chainIdRef.current)) {
      setBalanceWei(null);
      setBalanceError(false);
      setBalanceLoading(false);
      return;
    }
    setBalanceLoading(true);
    try {
      const wei = await readStudioBalance(addr);
      if (addressRef.current?.toLowerCase() !== addr.toLowerCase()) return;
      setBalanceWei(wei);
      setBalanceError(false);
    } catch {
      if (addressRef.current?.toLowerCase() !== addr.toLowerCase()) return;
      setBalanceWei(null);
      setBalanceError(true);
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshBalance();
  }, [address, chainId, refreshBalance]);

  const wrongNetwork = Boolean(address) && !isStudioNetChain(chainId);
  const writesBlocked = !hasContract()
    ? "Writes are disabled until NEXT_PUBLIC_RAINLINE_CONTRACT_ADDRESS is set."
    : !address
      ? "Connect a wallet to write."
      : wrongNetwork
        ? "This app writes on StudioNet (chain 61999)."
        : null;

  const value = useMemo(
    () => ({
      address,
      chainId,
      connecting,
      error,
      modalOpen,
      wrongNetwork,
      wallets,
      connectorId,
      writesBlocked,
      balanceWei,
      balanceError,
      balanceLoading,
      refreshBalance,
      connect,
      connectWalletConnect,
      switchWallet,
      switchNetwork,
      disconnect,
      openModal,
      closeModal: () => setModalOpen(false),
    }),
    [
      address,
      chainId,
      connecting,
      error,
      modalOpen,
      wrongNetwork,
      wallets,
      connectorId,
      writesBlocked,
      balanceWei,
      balanceError,
      balanceLoading,
      refreshBalance,
      connect,
      connectWalletConnect,
      switchWallet,
      switchNetwork,
      disconnect,
      openModal,
    ]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
