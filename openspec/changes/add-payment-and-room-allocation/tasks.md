## 1. Schema, payment records, and derived balances

- [ ] 1.1 Add migration `0005_payments_and_pairing.sql` (`payments` table keyed on Monzo transaction id, `room_requests.paired_with_id`) with its journal entry; write unit tests for `server/utils/payments.ts` (`recordPayment`, `amountPaidFor`) covering idempotent re-recording of the same transaction id and manual rows with a null transaction id — confirm red
- [ ] 1.2 Implement the schema additions and `server/utils/payments.ts` until the unit tests pass; backfill existing non-zero `parties.amount_paid` as manual rows so derived sums match what the admin already entered
- [ ] 1.3 Quality pass: test, lint, typecheck green

## 2. Room allocation

- [ ] 2.1 Install `room-allocation.feature` into `tests/features/`, write step definitions in `tests/steps/` — confirm red
- [ ] 2.2 Add `server/utils/allocation.ts`: symmetric `pairRooms`/`unpairRooms` rejecting cross-night, non-`share_match`, and already-paired rows; `roomingView(db)` resolving own rooms, named shares, paired rooms, and unpaired requests per night
- [ ] 2.3 Add `server/api/admin/rooms.get.ts` and `server/api/admin/rooms/pair.post.ts`; add `app/pages/admin/rooms.vue` with the unpaired list, pair/unpair controls, and the per-night rooming picture
- [ ] 2.4 Quality pass: test, lint, typecheck green

## 3. Rooming list in the venue export

- [ ] 3.1 Install `data-export.feature` into `tests/features/` (overwrite), extend step definitions — confirm red
- [ ] 3.2 Add the rooming sheet to `buildVenueWorkbook` in `server/utils/export.ts` from `roomingView`, one row per room with night, occupants, and parties, unpaired requests marked unallocated; extend `server/utils/backup.ts` to cover `payments` and the pairing column
- [ ] 3.3 Quality pass: test, lint, typecheck green

## 4. Monzo client and the match order

- [ ] 4.1 Install `payment-reconciliation.feature` into `tests/features/`, write step definitions against a stubbed Monzo client (no live calls in tests) — confirm red for the fetch/filter and matching scenarios
- [ ] 4.2 Add `server/utils/monzo.ts`: authorisation URL construction, code exchange, and a single transaction fetch taking `since`, filtering to credits, with the access token never persisted; add runtime config for client id and secret and report unavailability when unset
- [ ] 4.3 Add `server/utils/reconcile.ts`: match reference → payer name → amount, leave equal matches unmatched, record matched credits through `recordPayment`, return unmatched credits without storing them, and advance `settings.monzo_last_checked` only on success
- [ ] 4.4 Quality pass: test, lint, typecheck green

## 5. Reconciliation admin surface

- [ ] 5.1 Install `guest-admin.feature` into `tests/features/` (overwrite), extend step definitions for payment status and admin reachability — confirm red
- [ ] 5.2 Add `server/api/admin/monzo/` routes: start authorisation, callback, run check, assign one unmatched credit to a party, dismiss one without storing it
- [ ] 5.3 Add `app/pages/admin/payments.vue` (run the check, per-party owed/paid/shortfall, unmatched credits with assign and dismiss, last-checked time with the ninety-day staleness warning); extend `getDashboardStats` and `app/pages/admin/index.vue` with payment status; link both new pages from the admin navigation
- [ ] 5.4 Quality pass: test, lint, typecheck green
