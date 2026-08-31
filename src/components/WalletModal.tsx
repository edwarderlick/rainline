"use client";

import { useWallet } from "@/lib/wallet";
import { walletConnectProjectId } from "@/lib/injected-wallets";
import { Icon } from "./Icon";
import { LoadingState } from "./LoadingState";
import { shortAddr } from "@/lib/genlayer";
import { GenBalanceLine } from "./GenBalance";

export function WalletModal() {
  const {
    modalOpen,
    closeModal,
    connect,
    connectWalletConnect,
    disconnect,
    switchWallet,
    connecting,
    error,
    wallets,
    address,
    wrongNetwork,
    balanceWei,
    balanceError,
    refreshBalance,
  } = useWallet();
  if (!modalOpen) return null;
  const wcId = walletConnectProjectId();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 px-4">
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto border border-outline bg-surface p-6 shadow-sm">
        <div className="flex items-start justify-between border-b border-outline pb-4">
          <div>
            <h3 className="text-lg font-bold text-on-surface">Connect wallet</h3>
            <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.05em] text-on-surface-variant">
              StudioNet (chain 61999). Native GEN.
            </p>
          </div>
          <button type="button" onClick={closeModal} className="text-on-surface-variant hover:text-primary">
            <Icon name="close" />
          </button>
        </div>

        {address ? (
          <div className="mt-4 space-y-3">
            <p className="font-mono text-[12px] text-on-surface-variant">Connected {shortAddr(address)}</p>
            <div className="flex items-center justify-between border border-outline bg-surface-container-low px-4 py-3">
              <GenBalanceLine
                wrongNetwork={wrongNetwork}
                balanceWei={balanceWei}
                balanceError={balanceError}
                className="text-[12px] text-on-surface"
              />
              <button
                type="button"
                onClick={() => void refreshBalance()}
                className="font-mono text-[10px] uppercase tracking-wider text-primary"
              >
                Refresh
              </button>
            </div>
            <button
              type="button"
              onClick={() => void switchWallet()}
              disabled={connecting}
              className="w-full border border-outline bg-surface-container-low p-4 font-mono text-[12px] uppercase tracking-wider hover:border-primary disabled:opacity-50"
            >
              Switch wallet
            </button>
            <button
              type="button"
              onClick={() => void disconnect()}
              className="w-full border border-outline bg-surface-container-low p-4 font-mono text-[12px] uppercase tracking-wider hover:border-primary"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {wallets.length === 0 ? (
              <p className="border border-outline bg-surface-container-low p-4 text-[15px] leading-[22px] text-on-surface-variant">
                No injected wallet found. Install MetaMask or Rabby, or use a browser with an
                EIP-1193 wallet. Landing, covers, pool figures, and limits stay readable without
                connecting.
              </p>
            ) : (
              wallets.map((wallet) => (
                <button
                  key={wallet.id}
                  type="button"
                  onClick={() => void connect(wallet)}
                  disabled={connecting}
                  className="group flex w-full items-center justify-between border border-outline bg-surface-container-low p-4 hover:border-primary hover:bg-surface-container-high disabled:opacity-50"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    {wallet.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={wallet.icon} alt="" className="h-8 w-8 shrink-0" />
                    ) : (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-outline bg-surface-container-highest">
                        <Icon name="account_balance_wallet" className="text-sm" />
                      </span>
                    )}
                    <span className="truncate font-medium">{wallet.name}</span>
                  </span>
                  <span className="font-mono text-[12px] uppercase tracking-[0.05em] text-primary">
                    {connecting ? "Connecting" : "Detected"}
                  </span>
                </button>
              ))
            )}

            <div className="border-t border-outline pt-3">
              {wcId ? (
                <button
                  type="button"
                  onClick={() => void connectWalletConnect()}
                  disabled={connecting}
                  className="flex w-full items-center justify-between border border-outline bg-surface-container-low p-4 hover:border-primary disabled:opacity-50"
                >
                  <span className="font-medium">WalletConnect</span>
                  <span className="font-mono text-[12px] uppercase tracking-[0.05em] text-outline">
                    QR
                  </span>
                </button>
              ) : (
                <p className="font-mono text-[12px] text-on-surface-variant">
                  Injected wallets only until a WalletConnect project id is set.
                </p>
              )}
            </div>
            {connecting ? <LoadingState rows={1} /> : null}
          </div>
        )}
        {error ? (
          <p className="mt-4 border border-error bg-error-container p-3 font-mono text-[12px] text-on-error-container">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
