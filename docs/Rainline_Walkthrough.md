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

The live contract address is: **`0x25FcB91f4Ae2A6122045e6B22Ed54C01860a4043`**

- **Deploy tx:** `0x45aebfa02467f209e7c174419b4c415823f2c12f5923c7d5970a11dd7a3ae7e3`
- **Fund tx:** `0x53574fbca7df89a8828664cb09d39d6bdbadb5f4df3d74ca81d2f29f4e640353`
- **Source SHA-256:** `932ac31689367dcfd31d349a2fc616833ff2fb84132ee0053304a4dfbcaf45e0`

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
