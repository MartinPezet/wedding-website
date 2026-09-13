## 1. Room pricing and schema foundation

- [x] 1.1 Add migration `0004_room_booking.sql` (`room_requests` table, `parties.amount_paid`); add `shared/content/rooms.json` (Monzo handle, night-of/night-before prices); write unit tests for `shared/utils/rooms.ts` (`roomPrice`, `roomTotal`) covering all three choices on both nights — confirm red
- [x] 1.2 Implement `shared/utils/rooms.ts` and the `guests`/schema additions until the unit tests pass
- [x] 1.3 Quality pass: test, lint, typecheck green

## 2. RSVP split — attendance and room booking

- [x] 2.1 Install `room-booking.feature` into `tests/features/` and `rsvp-flow.feature` into `tests/features/` (overwrite), write/extend step definitions in `tests/steps/` — confirm red
- [x] 2.2 Split `server/utils/rsvp.ts`: remove meal validation/persistence, add room-request validation (choice enum, required share-with name) and replace-on-submit persistence; update `server/api/rsvp.post.ts`, `server/api/rsvp.get.ts`, `server/api/admin/parties/[id]/rsvp.put.ts`
- [x] 2.3 Rebuild `app/pages/rsvp.vue`: attendance-only per-guest fields, a room-booking repeater for each night (choice + conditional share-with input), the live total via `roomTotal`, the Monzo link (pre-filled amount + `RSVP-<partyId>` reference) with the payment-deadline disclaimer above it
- [x] 2.4 Quality pass: test, lint, typecheck green

## 3. Food-choice page

- [x] 3.1 Install `food-choice.feature` into `tests/features/`, write step definitions — confirm red
- [x] 3.2 Add `server/utils/food.ts` (`saveFood`, gated on `settings.food_choice_open` and `settings.food_deadline`), `server/api/food.get.ts`, `server/api/food.post.ts`, and `server/api/admin/parties/[id]/food.put.ts`
- [x] 3.3 Add `app/pages/menu.vue`: closed-state copy when the toggle is off, the per-attending-guest course/dietary form (reusing `menu.json`/`COURSE_FIELDS`/`optionsFor` from `shared/utils/menu.ts`) when on, prompt-to-RSVP-first state, and its own deadline lock
- [x] 3.4 Quality pass: test, lint, typecheck green

## 4. Admin settings, dashboard, and party editor

- [x] 4.1 Install `guest-admin.feature` into `tests/features/` (overwrite), write/extend step definitions — confirm red
- [x] 4.2 Extend `server/utils/admin.ts` and `server/api/admin/settings.*.ts` for `food_choice_open`, `food_deadline`, `payment_deadline`; add room-request totals (per night, per choice) to `getDashboardStats`; add `amount_paid` read/write to the party edit endpoints
- [x] 4.3 Update `app/pages/admin/settings.vue` (toggle + two new date fields), `app/pages/admin/index.vue` (room-request totals, amount-paid column), `app/pages/admin/parties/[id].vue` (split the RSVP answers sub-form from a new food-answers sub-form, add room-booking editing and the amount-paid field)
- [x] 4.4 Quality pass: test, lint, typecheck green

## 5. Data export

- [x] 5.1 Install `data-export.feature` into `tests/features/` (overwrite), write/extend step definitions — confirm red
- [x] 5.2 Update `server/utils/export.ts` to add room-booking columns (per night, choice, share-with) and amount-paid to the full guest-list workbook
- [x] 5.3 Quality pass: test, lint, typecheck green
