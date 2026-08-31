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
* **No Global State Contention:** Correlation IDs are derived from deterministic hashes of the sender address, datetime, and constraints.
* **Party weights:** There is no FOR/AGAINST market mechanic. Payouts are fixed at a 4x ratio and strictly reserved from pre-funded pool liquidity at the moment of purchase, mathematically preventing insolvency.
* **Subjective labels:** Rainline enforces purely numeric comparisons. "Did it rain heavily?" is replaced with "Was `precipitation_sum >= 5000`?"
* **UI Mechanics match Contract:** The UI explicitly states that there is no human keeper and no appeals process. The frontend perfectly maps to the contract's fixed methods (`buy_cover`, `cancel_cover`, `resolve`), ensuring users are never promised non-existent on-chain functionality.
