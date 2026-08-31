# Project Rainline

**Parametric Weather Cover on GenLayer**

Rainline is a deterministic financial primitive built on GenLayer StudioNet (Chain ID 61999). It allows users to lock premiums into fixed templates (RAIN, DRY, HEAT) for a specific Lat/Lon and UTC date, receiving a fixed 4x payout if the observed conditions hit their selected threshold.

The official brand mark is the **AP Square (Rust on cream lined paper)**.

### Live Contract (StudioNet)
**Address:** `0x970dcC20c90F90fc7749f6E10d7AC5a23D6D98C6`

## How it works
1. **Liquidity:** The operator seeds the contract pool with test GEN.
2. **Buy:** Users buy cover using the fixed templates, locking a premium (min 0.01 GEN, max 10 GEN). The 4x payout ratio is guaranteed and reserved from the pool's liquidity at buy time.
3. **Evidence:** A specific, pinned Open-Meteo historical-forecast URL is formulated entirely on-chain based on the user's lat/lon/date/template. **The buyer does not provide the URL.**
4. **Resolution:** After the coverage day closes, anyone can call `resolve()`. Validators execute a non-deterministic HTTP GET to the Open-Meteo API, parse the JSON, and extract the required observation.
5. **Payout:** The extracted observation is compared to the user's threshold. The contract deterministicly settles to `PAY`, `KEEP`, or `INSUFFICIENT` (if the API fails or the coordinates are null).

## Limits & Constraints
This is a strict deterministic protocol. Be aware of the following limits:
* **Not Licensed Insurance:** Rainline is a demonstration primitive, not a regulated insurance product. It runs on StudioNet with test GEN.
* **No Subjectivity:** This is not an "AI Court" or a prediction market. There are no FOR/AGAINST sides, no human verdicts, and no subjective judgments.
* **No Appeals & No Keeper:** Resolution is final and is executed explicitly by anyone calling `resolve`. There are no keepers or background crons monitoring the weather.
* **Open-Meteo is not a weather station:** The free tier model provides grid-approximated historical data. It is for non-commercial demo use only. It should not be used for critical applications like flights or agriculture.
* **Buy Cutoff:** You must purchase a cover **at least 24 hours before the coverage date (00:00 UTC)**. The `buy_cover` function strictly enforces this to prevent retroactive purchasing. 

## Local Development
To run the Rainline web interface locally:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment:
   Create a `.env.local` file with the deployed contract address:
   ```env
   NEXT_PUBLIC_RAINLINE_CONTRACT_ADDRESS=0x970dcC20c90F90fc7749f6E10d7AC5a23D6D98C6
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000)

See [docs/Rainline_Walkthrough.md](docs/Rainline_Walkthrough.md) for screenshots and a full deployment walkthrough.
