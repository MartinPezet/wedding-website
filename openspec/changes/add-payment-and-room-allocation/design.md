## Context

`add-room-booking` shipped `room_requests` (one row per booked room, per night, with a `choice` of `our_room` / `share_named` / `share_match`), `parties.amount_paid` as a hand-entered number, and a Monzo payment link carrying a per-party reference `RSVP-<partyId>`. The link now pre-fills both the amount (as a path segment) and the reference (as `?d=`), so a payment arriving in the couple's account should be identifiable.

Two facts drive most of this design.

**The destination is a shared joint account, not a dedicated one.** The couple use it for ordinary spending and income. Monzo pots cannot receive external payments at all, so isolating wedding money was never available — the couple sweep to a pot manually after the fact. Everything this change reads is therefore mixed in with salary, bills and groceries.

**Monzo's API is deliberately awkward for unattended use.** After authorisation a client can fetch full history for five minutes; from then on it can only sync the last 90 days. There is no way to hold a long-lived token that keeps working silently, which is why the admin triggers each check by hand rather than the server polling or subscribing to webhooks.

Room allocation has no such constraints — it is ordinary admin CRUD over data that already exists, deferred only because `room_requests` had to exist first.

## Goals / Non-Goals

**Goals:**
- Let the admin reconcile payments on demand: authorise Monzo, pull once, update `amount_paid` for matched parties.
- Match on the most reliable signal available, in a fixed order, and never guess.
- Keep the couple's non-wedding financial activity out of the wedding database entirely.
- Make a re-run idempotent — pressing the button twice must not double-count a payment.
- Let the admin pair `share_match` requests by hand and see the whole rooming picture across both nights.
- Give the venue a rooming list alongside the existing venue pack.

**Non-Goals:**
- Unattended reconciliation — no polling, no webhooks, no stored refresh tokens. The five-minute window makes it unreliable and the credentials make it a liability.
- Automatic pairing of `share_match` guests. The couple know who should share; a heuristic does not.
- Physical hotel room numbering — the venue's concern, as before.
- Refunds, part-refunds, or chasing underpayment. The admin reads the numbers and acts outside the system.
- Any payment initiation. This change only ever reads.

## Decisions

**The admin authorises Monzo per check; nothing long-lived is stored.**
Each reconciliation is: admin clicks → OAuth redirect → callback exchanges the code → fetch transactions immediately → discard the token. Alternatives considered: storing a refresh token for background sync (rejected — Monzo's five-minute rule means a background job sees only the last five minutes of activity, so it would silently miss almost everything, and a stored bank token is the highest-value secret this project could hold); Open Banking AISP registration (rejected — months of process for a wedding).

**Only credits, only since the last successful check.**
The fetch passes `since` from `settings.monzo_last_checked` and the code discards anything with `amount <= 0`. On a busy joint account this is what makes the feature usable at all: it removes every card payment and direct debit, leaving salary, internal transfers and guest payments. The cursor advances only on a successful run, so a failed check does not skip a window.

**Match order is reference → payer name → amount, and a tie never resolves itself.**
`RSVP-<partyId>` is unique and pre-filled, so it wins when present. Payer name comes next, matched against guest names on the party. Amount is last and weakest — guests booking the same room type pay identical sums, so amount alone can only confirm, never identify. If two parties match equally well the credit is treated as unmatched rather than assigned. Alternative considered: amount-first (rejected outright — it is the least distinguishing signal, which is exactly why the couple asked for name to be checked first).

**Matched payments are rows in a `payments` table keyed by Monzo's transaction id; `amount_paid` is derived.**
Storing the transaction id makes a re-run idempotent, and deriving `amount_paid` from the sum of a party's payment rows means the number is always explainable — the admin can see which payments produced it. `amount_paid` stays hand-editable as an override for cash, bank transfer outside the link, or anything the matcher got wrong; an override is recorded as a payment row with a null transaction id so the sum still reconciles.

**Unmatched credits are shown once and never persisted.**
They are returned in the response of the check and rendered for the admin to assign to a party; assigning one writes a payment row, ignoring it writes nothing. Nothing about a non-wedding credit — not the payer, not the amount — reaches the database. This is a hard rule rather than a nicety: the account carries the couple's salary, and a wedding website's admin page is the wrong home for it.

**Pairing is a nullable self-reference on `room_requests`, set by hand.**
`paired_with_id` points at the other `share_match` row sharing that room; both rows point at each other, and clearing one clears both. A separate `pairs` table was considered and rejected — a pair is exactly two rows and the symmetry is easy to enforce in one function, so a join table would add a migration and a query for nothing. Only rows on the same night may pair, and only `share_match` rows: a `share_named` request already names its partner in free text and needs no allocation.

**The rooming view is computed, not stored.**
One function turns `room_requests` plus pairings into a per-night list of rooms and occupants, and both the admin page and the venue export call it. Nothing about the rooming picture is persisted, so it cannot drift from the underlying requests.

## Risks / Trade-offs

[Risk: the `d=` reference does not survive into the Monzo transaction, leaving name-matching as the only real signal] → Mitigation: the match order already degrades gracefully, and the manual-assignment path is built regardless. This must be confirmed with a £1 test payment before the matcher is written — it decides how much of the matching logic earns its place.

[Risk: a card payment from a non-Monzo guest arrives looking unlike a person-to-person transfer, with no usable payer name] → Mitigation: such credits fall through to manual assignment, which is the designed path rather than a failure.

[Risk: the admin forgets to run a check for more than 90 days and older transactions become unreachable] → Mitigation: the dashboard shows when the last successful check ran and warns as that window closes; stored payment rows mean history already collected is never lost.

[Risk: OAuth client credentials leak from runtime config] → Mitigation: they are read-only scoped, they live in the same secret store as the existing backup secret, and no token is persisted — a leak exposes the ability to ask the couple to authorise, not the ability to read the account.

[Trade-off: manual pairing does not scale] → Accepted. A hundred-odd guests and a couple who know all of them make a suggestion engine pure cost.

## Migration Plan

1. Migration `0005_payments_and_pairing.sql`: create `payments`, add `room_requests.paired_with_id`, seed no settings rows (`monzo_last_checked` is written on first successful check).
2. Backfill `payments` from any non-zero `parties.amount_paid` as manual-override rows with a null transaction id, so the derived sum matches what the admin already entered.
3. Deploy with Monzo credentials unset — the reconciliation page reports itself unavailable and the allocation portal works regardless, so the room half ships without waiting on OAuth registration.
4. Rollback: the feature is read-only against Monzo and additive in schema, so reverting the deploy leaves `amount_paid` exactly as the last run left it.

## Open Questions

- Does a `monzo.me` payment carry `d=RSVP-<id>` into the transaction, and does it carry the payer's name? A £1 test payment from a Monzo account and from a card settles both, and should happen before the matcher is built.
- Does the couple's joint account appear under the API's `uk_retail_joint` account type with the same credentials as a personal account? Expected yes, unverified against their account.
