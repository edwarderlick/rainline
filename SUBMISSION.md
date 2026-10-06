# GenLayer Steward Checklist: Project Rainline

Rainline is a parametric weather cover primitive designed specifically to highlight GenLayer's capacity for deterministic, consensus-verified web requests without relying on subjective AI judgments.

### Live

- **App:** [rainline-jet.vercel.app](https://rainline-jet.vercel.app/)
- **Repo:** [github.com/edwarderlick/rainline](https://github.com/edwarderlick/rainline)
- **Chain:** Studio Next `61997`
- **RPC:** `https://studio-next.genlayer.com/api`
- **Explorer:** [explorer-studio-dev.genlayer.com](https://explorer-studio-dev.genlayer.com/)
- **Current contract:** [`0x23fFF100306713f69E677076eAfAAAd5E9FDf413`](https://explorer-studio-dev.genlayer.com/address/0x23fFF100306713f69E677076eAfAAAd5E9FDf413)
- **Deploy tx:** [`0xcb638423bcafa33eb5f7fc5acba3ef4a6d6dd57e1d2e2a06f4fa0eb89fb0fc19`](https://explorer-studio-dev.genlayer.com/tx/0xcb638423bcafa33eb5f7fc5acba3ef4a6d6dd57e1d2e2a06f4fa0eb89fb0fc19)
- **Fund tx:** [`0x505a55c3c9e5dd0a66089a59af15d3f0cbffeb592edaec46698f27bb0b6df9dd`](https://explorer-studio-dev.genlayer.com/tx/0x505a55c3c9e5dd0a66089a59af15d3f0cbffeb592edaec46698f27bb0b6df9dd)
- **Live buy proof tx:** [`0xd33cdb70c2d7038cb643e7171b947272c6e960422633d9978d101196478d604d`](https://explorer-studio-dev.genlayer.com/tx/0xd33cdb70c2d7038cb643e7171b947272c6e960422633d9978d101196478d604d)
- **Deployed source SHA-256:** `b14e03b044e99de38012644ce1c7d1e1d2c3823a35ddd1f57efdb884c1fa38bb`

### Fit Checklist

- [x] **Native on-chain consequence:** The contract directly moves native GEN out of the pool to the buyer upon a successful `PAY` resolution, or returns the premium on `INSUFFICIENT`.
- [x] **Independent fetching of evidence:** The contract generates an Open-Meteo API URL directly from the immutable cover data (lat, lon, date). The buyer does *not* supply the URL, preventing injection or spoofing.
- [x] **Counterparties don't trust server:** The resolution relies on GenLayer validators individually executing the HTTP GET and achieving consensus on the returned payload, removing the need for a trusted Oracle.
- [x] **Structured outcome:** The AI prompt strictly requests JSON extraction containing an integer representation of the weather data. There are no prose verdicts or subjective explanations.
- [x] **No subjective judgment:** A cover is resolved purely by a mathematical comparison (e.g., `observed_milli >= threshold_milli`). 

### Addressed Critiques from Previous Models
Rainline was built to avoid the pitfalls of subjective "AI Courts" and prediction markets:
* **ID Custody & Retrieval:** An append-only registry is used for listing. Correlation IDs are explicitly derived from deterministic hashes that include strict parameters and a monotonic nonce to guarantee unique assignment and prevent collision during simultaneous traffic.
* **Party weights:** There is no FOR/AGAINST market mechanic. Payouts are fixed at a 4x ratio and strictly reserved from pre-funded pool liquidity at the moment of purchase, mathematically preventing insolvency.
* **Underwriting and exposure controls:** Buyers cannot choose near-certain thresholds. RAIN must be 10-100 mm, DRY must be 0-1 mm, and HEAT must be 35-55 C. Each template/location/date bucket is also capped at 25% of the post-premium pool, so repeated buys cannot concentrate correlated exposure into one weather event.
* **Withdrawal safety:** `withdraw()` now restores credit and reverts if the native transfer fails. A failed transfer no longer zeroes the caller's credit.
* **Subjective labels:** Rainline enforces purely numeric comparisons. "Did it rain heavily?" is replaced with "Was `precipitation_sum >= 5000`?"
* **UI Mechanics match Contract:** The UI explicitly states that there is no human keeper and no appeals process. The frontend perfectly maps to the contract's fixed methods (`buy_cover`, `cancel_cover`, `resolve`), ensuring users are never promised non-existent on-chain functionality.

### ⚡ Live Settlement Proof (Sept 6, 2026 Covers)
Earlier live covers proved the `D+1` settlement path. The current hardened Studio Next contract is `0x23fFF100306713f69E677076eAfAAAd5E9FDf413`; the historical transaction hashes below are retained as settlement evidence from the previous deployment.

### Studio Next Deployment Proof (Oct 6, 2026)

- **Contract:** [`0x23fFF100306713f69E677076eAfAAAd5E9FDf413`](https://explorer-studio-dev.genlayer.com/address/0x23fFF100306713f69E677076eAfAAAd5E9FDf413)
- **Deploy tx:** [`0xcb638423bcafa33eb5f7fc5acba3ef4a6d6dd57e1d2e2a06f4fa0eb89fb0fc19`](https://explorer-studio-dev.genlayer.com/tx/0xcb638423bcafa33eb5f7fc5acba3ef4a6d6dd57e1d2e2a06f4fa0eb89fb0fc19)
- **Fund tx:** [`0x505a55c3c9e5dd0a66089a59af15d3f0cbffeb592edaec46698f27bb0b6df9dd`](https://explorer-studio-dev.genlayer.com/tx/0x505a55c3c9e5dd0a66089a59af15d3f0cbffeb592edaec46698f27bb0b6df9dd)
- **Live buy proof tx:** [`0xd33cdb70c2d7038cb643e7171b947272c6e960422633d9978d101196478d604d`](https://explorer-studio-dev.genlayer.com/tx/0xd33cdb70c2d7038cb643e7171b947272c6e960422633d9978d101196478d604d)
- **Source SHA-256:** `b14e03b044e99de38012644ce1c7d1e1d2c3823a35ddd1f57efdb884c1fa38bb`
- **Verified pool state:** 50 GEN funded, `max_event_exposure_bps` = 2500, `payout_ratio` = 4. The live buy proof created `cover-0xf79c61e606403dd51f90c4670888538322d9e81d541b85473f770312c07a019d` and reserved a 0.04 GEN payout.

*   **✅ Path: RESOLVED_PAY (Trigger Hit)**
    *   **Params:** Mumbai RAIN, Threshold >= 2.0 mm. 
    *   **Observed:** 5.3 mm.
    *   **Transaction Hash:** [`0xb4ab44656413dce8bc78b9fb51bef3f2f1587114fb036857aa2fe12c2b25e8cc`](https://explorer-studio-dev.genlayer.com/tx/0xb4ab44656413dce8bc78b9fb51bef3f2f1587114fb036857aa2fe12c2b25e8cc)
    *   **Result:** Contract successfully evaluated `5.3 >= 2.0` and credited the 4x payout to the user's mapping, which was then successfully withdrawn via the CEI-compliant `withdraw()` function.

*   **🛡️ Path: RESOLVED_KEEP (Trigger Missed)**
    *   **Params:** Mumbai RAIN, Threshold >= 500.0 mm. 
    *   **Observed:** 5.3 mm.
    *   **Transaction Hash:** [`0xc56b9c88fc31771733bb514a3439bef96b79825e2252b5a0ef80dc7b850c42b3`](https://explorer-studio-dev.genlayer.com/tx/0xc56b9c88fc31771733bb514a3439bef96b79825e2252b5a0ef80dc7b850c42b3)
    *   **Result:** Contract successfully evaluated `5.3 < 500.0`, kept premium, and released reserve.

*   **🌊 Oracle Robustness Proof (Unplanned KEEP on Edge Coordinates)**
    *   **Params:** Equatorial Atlantic (10.0000, 10.0000) HEAT, Threshold >= 35.0 °C. 
    *   **Observed:** 30.7 °C.
    *   **Transaction Hash:** [`0x3cfa0a2b0a5a19d00e3487da67824f2b94b2a294af88b6e4dedf5533b51be487`](https://explorer-studio-dev.genlayer.com/tx/0x3cfa0a2b0a5a19d00e3487da67824f2b94b2a294af88b6e4dedf5533b51be487)
    *   **Result:** This docket tested the deep ocean coordinates. The GenLayer consensus gracefully handled the remote data fetch, evaluating `30.7 < 35.0`, and cleanly settled the docket as `RESOLVED_KEEP` without reverting.
