## Context

`app/pages/rsvp.vue` currently drives one form covering attendance, per-course meal choice, dietary notes, phone, song, and note — all through one `saveRsvp()` in `server/utils/rsvp.ts`, shared by the guest POST and the admin PUT. Meal columns already live on `guests` (`starterChoiceId`, `mainChoiceId`, `dessertChoiceId`). The menu isn't confirmed, so meal choice needs to come off this page without losing the working attendance/deadline/lock machinery. Overnight room booking and Monzo payment collection need a new home, and there is no payment surface anywhere in the site today.

Automated Monzo transaction reconciliation (OAuth, matching, an admin-triggered "check payments" button) is intentionally **not** in this change — it depends on room-request data existing first and on registering an OAuth app with Monzo outside this codebase. This change adds the manual `amount_paid` field and the reference on the payment link so that follow-on change has something to reconcile against.

## Goals / Non-Goals

**Goals:**
- Split attendance+rooms (page 1) from meal choice (page 2), each independently deadline-locked.
- Let a party book any number of rooms for the night before and the night of the wedding, independently priced, with three sharing arrangements per room.
- Surface a running total and a pre-filled Monzo link with payment reference on the RSVP page.
- Gate the new food-choice page behind an admin toggle, off by default, with closed-state copy.
- Keep both pages editable via the same token URL/QR up to their respective deadlines, matching the existing RSVP edit pattern.

**Non-Goals:**
- Automated Monzo API payment verification (OAuth, polling/webhooks, matching) — follow-on change.
- Room allocation/pairing admin portal — follow-on change (depends on room-request data existing).
- Physical hotel room numbering — out of scope; venue's own concern.
- Any change to child-guest/child-menu handling — children aren't invited to this wedding; that code path stays dormant, untouched.

## Decisions

**Room requests as one row per room, not a JSON blob on the party.**
A `room_requests` table (`id, party_id, night ('before'|'of'), choice ('our_room'|'share_named'|'share_match'), share_with, occupants, reference`) — one row per booked room — keeps validation, per-row Monzo references, and the later admin allocation portal simple, and matches how `guests` already models one-row-per-entity rather than blobs. Alternative considered: a JSON column on `parties`; rejected because the follow-on allocation change needs to query and update individual room rows (pairing two `share_match` rows together), which a blob makes awkward.

**Pricing computed from a single shared util, not stored per row.**
`shared/utils/rooms.ts` exports `roomPrice(night, choice, occupants)` and `roomTotal(requests)`, used identically by the RSVP page (live total), the server (validation), and later the admin/export views. Prices themselves (£160 / £80 / £95) live in `shared/content/rooms.json` alongside the Monzo handle, matching the existing `gifts.json` pattern — a rate change never touches code.
- Night of: `our_room` → £160 flat per room (1–2 of the party's own guests); `share_named` / `share_match` → £80 per person (only the party's own person is charged here).
- Night before: £95 per person regardless of choice (dinner + continental breakfast), so `our_room` with `occupants: 2` charges £190, everything else charges £95.

**`saveRsvp` splits along the existing admin/guest seam.**
`server/utils/rsvp.ts` loses meal handling entirely (moves to new `server/utils/food.ts` / `saveFood()`), gains room-request validation and persistence. Both guest (`/api/rsvp`, `/api/food`) and admin (`/api/admin/parties/[id]/rsvp`, new `/api/admin/parties/[id]/food`) routes keep calling into these shared functions, unchanged in shape from today.

**Food page reuses the RSVP page's lock/greet/token pattern rather than a shared component.**
`app/pages/menu.vue` duplicates the small amount of token-identification and deadline-lock template logic from `rsvp.vue` rather than extracting a shared component now — the two pages diverge enough (rooms vs. meals) that a shared abstraction would mostly be conditional branches. Revisit if a third page ever needs the same shell.

**Payment reference format: `RSVP-<partyId>`.**
Simple, stable per party (not per room — one Monzo payment can cover several rooms), matches the pattern the follow-on reconciliation change will parse. Not sensitive: party IDs are already exposed via admin URLs.

**`parties.amount_paid` is a plain numeric column, admin-edited.**
Replaces the earlier boolean-toggle idea now that partial payments matter. This change adds the column and the admin input only; the follow-on change is what writes to it automatically.

## Risks / Trade-offs

[Risk: a party edits their room booking after paying, changing the total their Monzo reference was generated against] → Mitigation: the reference identifies the *party*, not a specific total, so admin reconciliation (this or the follow-on change) always compares current `amount_paid` against the current computed total rather than a frozen snapshot.

[Risk: room-request rows accumulate orphaned entries if a party repeatedly adds/removes rooms before submitting] → Mitigation: `saveRsvp` replaces a party's full room-request set on every submit (delete-then-insert within the request), same pattern already used for guest answers.

[Risk: `food_choice_open` flips on before any party has an attending guest recorded] → Mitigation: the food page already requires an RSVP with at least one attending guest to show the meal form; otherwise it prompts the party to RSVP first, independent of the toggle.

## Migration Plan

1. Migration `0004_room_booking.sql`: add `room_requests` table, `parties.amount_paid`, `settings` rows are just key/value inserts (no schema change needed for `food_choice_open`/`food_deadline`/`payment_deadline`).
2. Deploy with `food_choice_open` defaulted false — no visible change to guests until the couple confirms the menu and flips it on.
3. No backfill needed: existing meal answers on `guests` stay put and simply become invisible until the toggle is on.

## Open Questions

- None outstanding — deferred items (Monzo auto-reconciliation, room allocation portal, save-the-date price copy) are explicitly out of scope for this change.
