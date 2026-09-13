## Why

`add-room-booking` collects room requests and takes payment through a Monzo link, but leaves two jobs manual and deferred: reconciling what has actually been paid, and turning a pile of per-party room requests into a rooming list the venue can work from. Both were explicit non-goals there because they depend on room-request data existing first — it now does. Payments are already arriving against `amount_paid`, a column only a human can currently fill in, and every `share_match` request is a guest who has asked to be put with someone and has nobody yet.

## What Changes

- Add an admin-triggered Monzo reconciliation: the admin authorises Monzo by hand, the server pulls recent transactions once, and matched payments update each party's `amount_paid` automatically.
- Matching runs reference (`RSVP-<partyId>`) → payer name → amount, in that order, because guests pay near-identical amounts and only the reference is unique.
- Only incoming credits since the last successful check are considered. Non-matching credits are shown once for manual assignment and never stored — the destination is a shared joint account carrying the couple's ordinary income, which must not be persisted into the wedding database.
- Add a room allocation portal: pair `share_match` requests into shared rooms by hand, see every booked room across both nights with named shares resolved to real guests, and export a rooming list for the venue.
- **BREAKING**: `room_requests` gains a nullable `paired_with_id` self-reference; existing rows default to unpaired.

## Capabilities

### New Capabilities
- `payment-reconciliation`: admin-triggered Monzo sync, the match order, the manual-assignment path for unrecognised credits, and the privacy rules governing what may be stored.
- `room-allocation`: manual pairing of match-me requests, the combined rooming view across both nights, and the venue rooming-list export.

### Modified Capabilities
- `guest-admin`: the dashboard gains payment status per party (owed vs paid vs outstanding) and a reconciliation trigger; `amount_paid` stays hand-editable as the override.
- `data-export`: the venue pack gains a rooming sheet listing each room, its night, and its occupants.

## Impact

- New `server/utils/monzo.ts` (OAuth exchange, transaction fetch), `server/utils/reconcile.ts` (match order, amount updates), `server/utils/allocation.ts` (pairing rules, rooming view).
- New `server/api/admin/monzo/` routes: start authorisation, handle callback, run the check, assign one credit to a party.
- New `app/pages/admin/payments.vue` and `app/pages/admin/rooms.vue`; `app/pages/admin/index.vue` gains payment status.
- Schema: `room_requests.paired_with_id`; new `payments` table (transaction id, party, amount, matched-on, seen-at) so a re-run never double-counts; `settings` gains `monzo_last_checked`.
- `server/utils/export.ts` gains the rooming sheet; `server/utils/backup.ts` covers the new table.
- New runtime config for the Monzo OAuth client id and secret — the first third-party credentials the project holds.
- Depends on `add-room-booking` being archived: reads `room_requests`, `parties.amount_paid`, and `shared/utils/rooms.ts` pricing.
