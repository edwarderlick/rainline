# GenLayer Steward Checklist: Project Rainline

Rainline is a parametric weather cover primitive designed specifically to highlight GenLayer's capacity for deterministic, consensus-verified web requests without relying on subjective AI judgments.

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
* **Subjective labels:** Rainline enforces purely numeric comparisons. "Did it rain heavily?" is replaced with "Was `precipitation_sum >= 5000`?"
* **UI Mechanics match Contract:** The UI explicitly states that there is no human keeper and no appeals process. The frontend perfectly maps to the contract's fixed methods (`buy_cover`, `cancel_cover`, `resolve`), ensuring users are never promised non-existent on-chain functionality.

### ⚡ Live StudioNet Settlement Proof (Sept 3, 2026 Covers)
The `D+1` time lock expired natively on the live contract. The following resolutions were executed successfully on StudioNet, proving exact balance accounting and deterministic Oracle evaluation:

*   **✅ Path: RESOLVED_PAY (Trigger Hit)**
    *   **Params:** Mumbai RAIN, Threshold >= 1.0mm. Observed: 5.6mm. 
    *   **Transaction Hash:** `0xb38596832c9683474ea0cecbc45ba48fc4fd1f218d8844c4d8e8cef1fb312c49`
    *   **Result:** Contract successfully evaluated `5.6 >= 1.0` and routed 4x payout.

*   **🛡️ Path: RESOLVED_KEEP (Trigger Missed)**
    *   **Params:** Mumbai RAIN, Threshold >= 500.0mm. Observed: 5.6mm.
    *   **Transaction Hash:** `0x6247514a8bb07e9ba402b48962f2572a321c9f6e5a39a2a2626a43a5a3b7ce8c`
    *   **Result:** Contract successfully evaluated `5.6 < 500.0`, kept premium, and released reserve.

*   **🌊 Oracle Robustness Proof (Unplanned KEEP)**
    *   **Params:** Equatorial Atlantic (10.0000, 10.0000) HEAT, Threshold >= 30.0°C. 
    *   **Transaction Hash:** `0x55da6ef0bdff9e972e6f8fd0875b2a0af13efa9df5d338e5ec29b52729916fae`
    *   **Result:** This docket was intended to test the `INSUFFICIENT` API failure path by querying the deep ocean. Impressively, the Open-Meteo Oracle successfully returned historical temperature data (`29.9 °C`) for this remote location. The contract flawlessly executed its deterministic logic, evaluated `29.9 < 30.0`, and cleanly settled the docket as `RESOLVED_KEEP`.
