# How we build Rainline (same loop as Alpha Court)

Alpha Court was built in passes, not one shot:

1. Spec the state machine and the money before UI.
2. Write the Intelligent Contract as a single Studio file.
3. Prove deadlines and IDs in tests.
4. Thin Next.js that cannot advertise methods the contract does not have.
5. Live dockets: one success, one miss, one missing-data refund.
6. Honest README / Limits page first screen.

We do not start with a Stitch landing page and reverse-engineer economics.

## Pass 1 — contract

File: `contracts/rainline.py`

- `fund_pool` payable
- `buy_cover` payable → returns `cover-{n}` from that transaction
- `cancel_cover` buyer-only, before date D 00:00 UTC
- `resolve` after D has closed
- `withdraw` credits if native send fails
- `withdraw_unreserved` operator-only, cannot touch reserved

Pinned evidence:

```
https://historical-forecast-api.open-meteo.com/v1/forecast
  ?latitude={lat}&longitude={lon}
  &start_date={D}&end_date={D}
  &daily=precipitation_sum|temperature_2m_max
  &timezone=UTC
```

## Pass 2 — tests stewards already asked you for

- Concurrent buys → distinct IDs
- Late buy reverts
- Missing / null JSON → INSUFFICIENT refund
- PAY / KEEP amounts come from contract storage
- Operator cannot drain reserved GEN

Unit logic lives in `contracts/rainline_logic.py` so we can run it without GenVM.

## Pass 3 — interface

No Appeal. No “Paid” badge on OPEN. Footer prints the live address.
Templates only: RAIN / DRY / HEAT.

## Stitch prompt (UI only, after the contract exists)

```
Design a dark, spare weather-cover console called Rainline.
Not a courtroom. Not a prediction market.
IBM Plex, teal on near-black, one buy form, one covers table, one pool panel.
Three template chips: Rain, Dry, Heat.
Show buy deadline, payout ratio 4x, and a Limits footer.
No Appeal button. No scales-of-justice icon. No gavel.
Mobile-first, 1200px max content width.
```

## Claude Code prompt (implementation)

```
Think before you implement.

Build Rainline as a GenLayer Intelligent Contract + thin Next.js app.
Copy LicenseLock settlement, not Alpha Court keepers.

Hard rules:
- IDs returned by buy_cover, not a follow-up list length
- Deadlines inside buy_cover / cancel_cover / resolve via gl.message_raw["datetime"]
- Buyer cannot supply the evidence URL
- Equivalence on {status, observed_milli} only
- INSUFFICIENT refunds the premium
- No flights, no free-text policy, no FOR/AGAINST book, no keeper, no appeals
- UI copy matches implemented methods

Do not invent RPC methods. Do not mark Paid without a state change.
```
