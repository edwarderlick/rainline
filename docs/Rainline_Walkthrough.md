# Rainline Integration Walkthrough

The Rainline parametric cover system is deployed on Studio Next and the frontend is fully live.

## What was done

### 1. Contract Deployment
An automated deployment script (`scripts/deploy_studio_next.mjs`) is used to interface with the `genlayer-js` v2 RC SDK. The script:
1. Loads an unlocked GenLayer CLI deploy account.
2. Estimates v0.6 transaction fees from `fee-profile.json`.
3. Deploys the LF-normalized contract source to Studio Next.
4. Verifies finalized successful execution and the source SHA-256.
5. Calls `fund_pool` to seed the initial liquidity with **50 GEN**.

The live contract address is: **[`0x4656AEA89b67C61A6B99689613735013e8635B0d`](https://explorer-studio-dev.genlayer.com/address/0x4656AEA89b67C61A6B99689613735013e8635B0d)**

- **Deploy tx:** [`0x3415428ec168e8995a51b89c22a65e9ebc98f8d5245419483bed294427d278cf`](https://explorer-studio-dev.genlayer.com/tx/0x3415428ec168e8995a51b89c22a65e9ebc98f8d5245419483bed294427d278cf)
- **Fund tx:** [`0x48b60d6e7ca09656fd17fcd48c5b1cd694301d5cc0c887dd40f4019406e7808d`](https://explorer-studio-dev.genlayer.com/tx/0x48b60d6e7ca09656fd17fcd48c5b1cd694301d5cc0c887dd40f4019406e7808d)
- **Live buy proof tx:** [`0xe8cc0e02e1df7bbe40cbf5bf77b09bab66f9041fcdf8c9a9ab57fc32b8e9cb09`](https://explorer-studio-dev.genlayer.com/tx/0xe8cc0e02e1df7bbe40cbf5bf77b09bab66f9041fcdf8c9a9ab57fc32b8e9cb09)
- **Live withdraw proof tx:** [`0x2724d0062e72c07a04a1927a2a12975ca1c0c60527530bf24cfe47806f8c4f14`](https://explorer-studio-dev.genlayer.com/tx/0x2724d0062e72c07a04a1927a2a12975ca1c0c60527530bf24cfe47806f8c4f14)
- **Source SHA-256:** `ba945ed526689aa1e6120c62585d60e100bc53c4239c66d041d15bc5717f2b9a`

### 2. Frontend Wiring
The frontend was perfectly architected for the transition. All data-fetching layers in `src/lib/rainline.ts` were already utilizing the live SDK. The only change required was:
- Updating `.env.local` with the deployed address.
- Fixing a small truthy check bug in `Footer.tsx` where the zero-address `0x00...` evaluated to true. It now correctly relies on `hasContract()`.

### 3. Test Dockets (Live State)
A second automated script (`scripts/buy_test_dockets.mjs`) was used to act as a buyer, funding a new wallet with 20 GEN and purchasing three covers to prove out the settlement paths.

Because the contract strictly enforces that covers must be bought at least 24 hours before the coverage date (`D 00:00 UTC`), these test covers were placed for **`2026-09-03` and `2026-09-04`**.

| ID | Template | Location | Threshold | Premium | Expected Result |
|---|---|---|---|---|---|
| `cover-1` | RAIN | Mumbai | 25mm | 1 GEN | Depends on observed rain |
| `cover-2` | RAIN | Singapore | 100mm | 1 GEN | Likely KEEP |
| `cover-3` | HEAT | Mumbai | 35°C | 1 GEN | **INSUFFICIENT** (Refund 1 GEN) |

> [!NOTE]
> **Resolution is Time-Locked**
> The `resolve` method will revert if called before the coverage day closes. Because these covers target Sept 3rd and 4th, they cannot be resolved right now.
> 
> A script is provided at `scripts/resolve_test_dockets.mjs` to trigger the resolutions and verify the payout logic once the dates pass.

## Current Pool State
```json
{
  "buy_cutoff_hours": 24,
  "max_event_exposure_bps": 2500,
  "operator": "0xBb4e0fD1CEaC9F8db17242CF86decDcdd45FA48a",
  "payout_ratio": 4,
  "pool_balance": "50000000000000000000",
  "reserved_payout": 0,
  "source_host": "historical-forecast-api.open-meteo.com",
  "unreserved": "50000000000000000000"
}
```
*(50 initial GEN funded on Studio Next. No covers are open on the fresh hardened deployment yet, so no payout is reserved).*

## Screenshots

> **Please insert a clear screenshot showing a successful UI buy transaction hash on Studio Next here:**
> ![Successful UI Buy](assets/successful_buy.png)

> **Please insert a clear screenshot showing a successful UI cancel transaction hash on Studio Next here:**
> ![Successful UI Cancel](assets/successful_cancel.png)
