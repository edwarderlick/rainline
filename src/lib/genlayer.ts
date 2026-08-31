import {
  CONTRACT_ADDRESS,
  STUDIONET_CHAIN_ID,
  STUDIONET_CHAIN_ID_HEX,
  STUDIONET_EXPLORER,
  STUDIONET_NAME,
  STUDIONET_RPC,
} from "./contract";

export type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  disconnect?: () => Promise<void>;
};

export function getEthereum(): EthereumProvider | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { ethereum?: EthereumProvider }).ethereum;
}

export function hasContract(): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS) && CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000";
}

export function shortAddr(addr?: string): string {
  if (!addr) return "not set";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export async function requestAccounts(provider: EthereumProvider): Promise<string> {
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts?.[0]) throw new Error("Wallet did not return an account.");
  return accounts[0];
}

function studioJsonRpcUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/genlayer`;
  }
  return STUDIONET_RPC;
}

/** Native GEN via Studio RPC (wei). Throws if the node does not return a result. */
export async function readStudioBalance(address: string): Promise<bigint> {
  const res = await fetch(studioJsonRpcUrl(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "eth_getBalance",
      params: [address, "latest"],
    }),
  });
  const json = (await res.json()) as { result?: string; error?: { message?: string } };
  if (!res.ok || json.error || json.result === undefined || json.result === null) {
    throw new Error(json.error?.message || "balance unavailable");
  }
  return BigInt(json.result);
}

export async function silentAccounts(provider: EthereumProvider): Promise<string[]> {
  try {
    return ((await provider.request({ method: "eth_accounts" })) as string[]) ?? [];
  } catch {
    return [];
  }
}

export async function readChainId(provider?: EthereumProvider): Promise<string | null> {
  const eth = provider ?? getEthereum();
  if (!eth) return null;
  const id = (await eth.request({ method: "eth_chainId" })) as string;
  return id;
}

export function isStudioNetChain(chainId: string | null): boolean {
  if (!chainId) return false;
  const n = Number.parseInt(chainId, 16);
  return n === STUDIONET_CHAIN_ID;
}

export async function switchToStudioNet(provider?: EthereumProvider): Promise<void> {
  const eth = provider ?? getEthereum();
  if (!eth) throw new Error("No wallet connected. Install MetaMask or Rabby.");
  const current = (await eth.request({ method: "eth_chainId" })) as string;
  if (isStudioNetChain(current)) return;
  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: STUDIONET_CHAIN_ID_HEX }],
    });
  } catch (err) {
    const code = (err as { code?: number }).code;
    if (code === 4902 || code === -32603) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: STUDIONET_CHAIN_ID_HEX,
            chainName: STUDIONET_NAME,
            nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
            rpcUrls: [STUDIONET_RPC],
            blockExplorerUrls: [STUDIONET_EXPLORER],
          },
        ],
      });
      return;
    }
    throw err instanceof Error ? err : new Error("Could not switch to StudioNet (chain 61999).");
  }
}

/**
 * The UI never labels a cover Paid unless get_cover.state is RESOLVED_PAY
 * or INSUFFICIENT/REFUNDED after the matching write receipt.
 */
export function explorerHint(): string {
  return hasContract()
    ? `StudioNet ${CONTRACT_ADDRESS}`
    : "Contract not deployed yet - set NEXT_PUBLIC_RAINLINE_CONTRACT_ADDRESS";
}

export function writesBlockReason(opts: {
  address: string | null;
  wrongNetwork: boolean;
}): string | null {
  if (!hasContract()) {
    return "Writes are disabled until NEXT_PUBLIC_RAINLINE_CONTRACT_ADDRESS is set.";
  }
  if (!opts.address) return "Connect a wallet to write.";
  if (opts.wrongNetwork) return "This app writes on StudioNet (chain 61999).";
  return null;
}
