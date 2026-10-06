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

The live contract address is: **[`0x50c7aa4dae8Ac8bD9e42B26E4c1323D83b7CCd0C`](https://explorer-studio-dev.genlayer.com/address/0x50c7aa4dae8Ac8bD9e42B26E4c1323D83b7CCd0C)**

- **Deploy tx:** [`0xa84fa44f586c4cbcc58b40e2031a4fae60d7e094cf6641bcd38ed24abf24d345`](https://explorer-studio-dev.genlayer.com/tx/0xa84fa44f586c4cbcc58b40e2031a4fae60d7e094cf6641bcd38ed24abf24d345)
- **Fund tx:** [`0x8d22eda77d97ec7ea77d72651899b94379f926db8d2a6d49ec68486d7e22a7cb`](https://explorer-studio-dev.genlayer.com/tx/0x8d22eda77d97ec7ea77d72651899b94379f926db8d2a6d49ec68486d7e22a7cb)
- **Live buy proof tx:** [`0x13dc848c30a339e549abcbf9d8a54e6dd9ab580588fb4538814059ba53c8f141`](https://explorer-studio-dev.genlayer.com/tx/0x13dc848c30a339e549abcbf9d8a54e6dd9ab580588fb4538814059ba53c8f141)
- **Live cancel credit tx:** [`0x280e8487e9bcaad43e4e7666e91a682010f37c5d08412a03b25714a6c06ccbaf`](https://explorer-studio-dev.genlayer.com/tx/0x280e8487e9bcaad43e4e7666e91a682010f37c5d08412a03b25714a6c06ccbaf)
- **Live withdraw proof tx:** [`0xbffdbc3da3399f4548949a621d4dc44cdbf87b61833b038a29d0735ece4eecdc`](https://explorer-studio-dev.genlayer.com/tx/0xbffdbc3da3399f4548949a621d4dc44cdbf87b61833b038a29d0735ece4eecdc)
- **Source SHA-256:** `bf80404f02b1416a24eae0a34e8cead1a858c817a8d984f145941927cf2ff875`

### 2. Frontend Wiring
The frontend was perfectly architected for the transition. All data-fetching layers in `src/lib/rainline.ts` were already utilizing the live SDK. The only change required was:
- Updating `.env.local` with the deployed address.
- Fixing a small truthy check bug in `Footer.tsx` where the zero-address `0x00...` evaluated to true. It now correctly relies on `hasContract()`.

### 3. Live Withdrawal Proof
The script `scripts/prove_withdraw_live.mjs` was used to act as a buyer, fund a fresh wallet, buy a future cover, cancel it before cutoff, and withdraw the resulting credit.

- **Cover ID:** `cover-0xd17bede059532cf310504a94662edfd34e32d9572e95fd55823f19a58133394f`
- **Credit after cancel:** `1000000000000000000`
- **Credit after withdraw:** `0`
- **Reproducible source tests:** `python -m pytest tests/direct tests/unit -q` passes with `24 passed`.

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
