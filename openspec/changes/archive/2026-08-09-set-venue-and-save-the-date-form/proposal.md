## Why

The venue and date are now booked — Saturday 16 January 2027 at St Audries Park, Somerset — but
every page still carries the Huntsham Court / Devon / 17 January placeholders. At the same time the
save-the-date page is a dead end: it announces the date and stops. Before invitations can be
printed the couple need postal addresses, and before the venue's room block can be reserved they
need a headcount of who wants to stay the night before and/or the night of the wedding. Collecting
that on the save-the-date page — the one link being shared right now — is the only chance to gather
it while people are already looking.

## What Changes

- Replace the placeholder date and venue everywhere with the booked ones: Saturday 16 January 2027,
  St Audries Park, West Quantoxhead, Somerset (`https://www.audries-park.co.uk/`). Touches
  `schedule.json` (all six events move to 2027-01-16, venue name + maps URL swapped, running-order
  times stay placeholders), `handout.json`, the site footer, the printed letter venue line, and the
  seeded `wedding_date` setting. Guest-facing "Devon, England" becomes "Somerset, England".
- Add an interest form to the public save-the-date page capturing, per household: name, contact
  phone (validated, stored E.164), postal address as structured fields (line 1, line 2, town/city,
  postcode, country defaulting to United Kingdom), and two independent room-night checkboxes —
  night before (Fri 15 Jan) and night of (Sat 16 Jan) — with copy explaining the ~£200 per room per
  night, dinner and breakfast included, block-booked by the couple, and that ticking gauges
  interest rather than books a room.
- Store submissions in a new table. The form is public (no password, no party token), so the
  endpoint validates every field server-side and is rate limited per IP; a resubmission from the
  same phone number updates the existing row rather than duplicating it.
- New admin page listing save-the-date responses with room-night interest totals, and a new sheet
  in the full Excel export carrying names, phones, addresses, and both room-night flags. The JSON
  backup/restore covers the new table.
- Add a staged page reveal across the guest-facing frontend: each page's focal block (hero photo,
  page heading) fades and rises on load, and every other section reveals as it is scrolled into
  view rather than all at once. Content is server-rendered and already present — the reveal is
  presentation only, so reduced-motion and no-JS visitors get the full page, static and visible.
  The admin panel and print routes are excluded.

## Capabilities

### New Capabilities

- `save-the-date`: the public, ungated save-the-date page — its announcement content, the
  household interest form (name, phone, postal address, room-night interest), server-side
  validation and rate limiting of the public submission endpoint, and idempotent resubmission.

### Modified Capabilities

- `guest-data`: new persisted entity for save-the-date responses (household name, E.164 phone,
  structured postal address, two room-night interest flags, timestamps), independent of parties
  and guests.
- `guest-admin`: new requirement for an admin view of save-the-date responses with room-night
  interest totals.
- `data-export`: full workbook gains a save-the-date responses sheet; the JSON backup and restore
  cover the new table.
- `design-system`: new requirements for the staged page reveal on the guest frontend (focal block
  first on load, remaining sections on scroll into view) and for its safety fallbacks — reduced
  motion, no JavaScript, and no `IntersectionObserver` all render the full page visible. Motion
  already lives in this spec alongside the floral sway and reduced-motion rule.

## Impact

- Content: `shared/content/schedule.json`, `shared/content/handout.json`,
  `shared/content/hotels.json` (venue-relative descriptions), `scripts/seed.mjs` (`wedding_date`).
- App: `app/pages/save-the-date.vue` (form), `app/layouts/default.vue` (footer),
  `app/pages/admin/print/letters.vue` (venue line), new `app/pages/admin/save-the-date.vue`,
  admin layout nav.
- Reveal: new reveal directive plugin and its CSS, applied across every guest page (`index`,
  `welcome`, `save-the-date`, `schedule`, `travel`, `gifts`, `faq`, `rsvp`) — admin pages and
  `PrintPage` routes untouched.
- Server: new `server/api/save-the-date.post.ts` (public), new `server/utils/save-the-date.ts`,
  new `server/api/admin/save-the-date.get.ts`, `server/db/schema.ts` + a new migration,
  `server/utils/export.ts`, `server/utils/backup.ts`.
- Tests: new `tests/features/save-the-date.feature` + steps; deltas to `guest-data`,
  `guest-admin`, `data-export` features; existing `tests/unit/save-the-date.test.ts` extended.
- Security: first public write endpoint on the site — unauthenticated POST accepting personal data
  (name, phone, home address). Rate limiting and strict server-side validation are mandatory, and
  the stored addresses raise the sensitivity of the backup dump.
- No new dependencies (`libphonenumber-js` and `exceljs` already present).
