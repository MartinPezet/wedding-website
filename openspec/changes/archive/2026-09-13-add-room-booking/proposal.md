## Why

The RSVP page currently bundles attendance, meal choice, and party extras into one form — but the wedding menu isn't confirmed yet, so meal choice can't be collected. Meanwhile the couple need to start collecting overnight room bookings and payment (via Monzo) for both the night before and night of the wedding, which today has no home anywhere in the RSVP flow.

## What Changes

- Split the RSVP page: attendance, room booking, and party extras stay on `/` (token URL); meal choice moves to its own page, gated off until the menu is confirmed.
- **BREAKING**: `POST /api/rsvp` no longer accepts or stores meal fields — moved to a new `POST /api/food` endpoint on the new page.
- Add overnight room booking to the RSVP page: parties book any number of rooms per night, night-before and night-of priced and tracked separately, with an option to share with a named guest from another party or ask to be matched with another party's guest.
- Show a running total next to a Monzo payment link (amount and reference pre-filled), with a "pay any time before" disclaimer date.
- Add a new, admin-toggled Menu page (separate token-identified page) for meal choice + dietary notes, off by default, with its own deadline setting.
- Add admin settings: food-choice toggle, food deadline, payment deadline.
- Add admin visibility into room requests and amounts (paid tracking is a manual numeric field in this change; automated Monzo reconciliation is a separate follow-on change).

## Capabilities

### New Capabilities
- `room-booking`: overnight room booking for both nights (multiple rooms per night, three sharing options, per-night pricing), the running total, and the Monzo payment link/disclaimer.
- `food-choice`: the admin-toggled, token-identified menu page — per-guest course choice and dietary notes, its own deadline, closed-state copy when the menu isn't ready.

### Modified Capabilities
- `rsvp-flow`: meal-choice requirement removed (moved to `food-choice`); attendance-only scope on this page; room booking now part of the page.
- `guest-admin`: settings page gains food-choice toggle, food deadline, and payment deadline; dashboard gains room-request and payment-amount visibility; "admin can edit RSVP answers" splits into RSVP answers (attendance/room) vs. food answers (meals), edited on their respective pages.
- `data-export`: guest-list export gains room booking and night-before columns.

## Impact

- `app/pages/rsvp.vue` (attendance + rooms + extras), new `app/pages/menu.vue` (food choice, gated).
- `server/utils/rsvp.ts` split: meal handling moves out; room booking validation added.
- New `server/api/food.get.ts` / `food.post.ts`, admin equivalent for editing food answers.
- Schema: new `room_requests` table (party-scoped, one row per booked room, per night); `settings` gains `food_choice_open`, `food_deadline`, `payment_deadline`; `parties` gains `amount_paid`.
- `shared/content/` gains the Monzo handle and per-night prices; `shared/utils/rooms.ts` for the shared pricing calculation.
- `app/pages/admin/settings.vue`, `app/pages/admin/parties/[id].vue`, `app/pages/admin/index.vue` updated for the new fields.
