## 1. Venue and date content

- [x] 1.1 Extend `tests/unit/content.test.ts` with the venue-content assertions (a `venue` export
      with name, addressLines, county, url, mapsUrl; every `schedule.json` event dated 2027-01-16
      or 2027-01-17 carriages, located at the venue; no "Huntsham" or "Devon" left in
      `shared/content/`) — run `npm test`, confirm the new assertions FAIL
- [x] 1.2 Add `shared/content/venue.json` (`St Audries Park`, address lines without postcode until
      confirmed, county `Somerset`, `https://www.audries-park.co.uk/`, Google Maps URL) and export
      it as typed `venue` from `shared/content/index.ts` with a `Venue` interface
- [x] 1.3 Move every `schedule.json` event to 2027-01-16 (carriages/late events roll into
      2027-01-17), swap `location` and `mapsUrl` to the new venue, keep the running-order times as
      placeholders
- [x] 1.4 Update `shared/content/handout.json` venue and wifi placeholder lines, and the
      venue-relative wording in `shared/content/hotels.json` (distances/transport still
      placeholders, but no Devon references)
- [x] 1.5 Replace hard-coded venue strings with the `venue` export: `app/layouts/default.vue`
      footer, `app/pages/admin/print/letters.vue` `venueLine`
- [x] 1.6 Correct the seeded `wedding_date` in `scripts/seed.mjs` to `2027-01-16`
- [x] 1.7 Quality pass: test, lint, typecheck green

## 2. Save-the-date response storage

- [x] 2.1 Install `features/guest-data.feature` into `tests/features/`, extend
      `tests/steps/guest-data.steps.ts` with the save-the-date response-model scenarios (stored and
      retrieved, phone-is-identity upsert, no party/guest rows created) — run `npm test`, confirm
      the new scenarios FAIL
- [x] 2.2 Add the `saveTheDateResponses` table to `server/db/schema.ts`: id, name, phone (unique),
      addressLine1, addressLine2 (nullable), city, postcode, country, stayNightBefore,
      stayNightOf (booleans, default false), createdAt, updatedAt
- [x] 2.3 Generate/write migration `server/db/migrations/0003_save_the_date.sql` and its journal
      entry; verify `node scripts/migrate.mjs` applies cleanly to a fresh local DB
- [x] 2.4 Add `shared/utils/save-the-date.ts`: field caps, required-field checks, `normalisePhone`
      call, returning `{ ok: true, value }` (trimmed, phone in E.164, country defaulted to United
      Kingdom) or `{ ok: false, error }`
- [x] 2.5 Add `server/utils/save-the-date.ts`: `saveResponse(db, input)` validating via the shared
      util then upserting on the unique phone (`onConflictDoUpdate`, refreshing address, flags and
      `updatedAt`), and `listResponses(db)` newest-first
- [x] 2.6 Quality pass: test, lint, typecheck green

## 3. Public save-the-date form

- [x] 3.1 Install `features/save-the-date.feature` into `tests/features/`, write
      `tests/steps/save-the-date.steps.ts` covering the ungated page, content-driven date/venue,
      form validation, room-night flags, server-side revalidation, per-IP throttling, resubmission
      upsert, and the input-hint scenarios; extend `tests/unit/save-the-date.test.ts` — run
      `npm test`, confirm the new scenarios FAIL
- [x] 3.2 Add `server/api/save-the-date.post.ts`: public route, per-IP limiter from
      `createLoginLimiter` recording every submission, body parsed and revalidated through the
      shared util, `saveResponse` on success, 400 on validation error, 429 when throttled
- [x] 3.3 Update `app/pages/save-the-date.vue` to read date from the schedule content and venue
      name/county/link from `venue`, replacing the hard-coded "Devon, England" strings and the
      SEO/OG copy
- [x] 3.4 Add the interest form to the page: name, tel, address line 1/2, town/city, postcode,
      country fields with `autocomplete` attributes, client-side validation via the shared util,
      inline error, pending state, and a confirmation panel replacing the form on success
- [x] 3.5 Add the room-night block: the two checkboxes (both unticked by default) with copy naming
      the nights (Fri 15 / Sat 16 January 2027), the approximate £200 per room per night, dinner
      and breakfast included, block-booked by the couple, and that ticking registers interest
      rather than booking
- [x] 3.6 Verify in the browser preview at `/save-the-date` without a session: form submits, a
      resubmission with the same phone updates rather than duplicates, and the layout holds at
      375px width
- [x] 3.7 Quality pass: test, lint, typecheck green

## 4. Admin view of responses

- [x] 4.1 Install `features/guest-admin.feature` into `tests/features/`, extend
      `tests/steps/guest-admin.steps.ts` with the responses-listed, interest-totals,
      unauthenticated-access, and empty-state scenarios — run `npm test`, confirm the new
      scenarios FAIL
- [x] 4.2 Add `server/api/admin/save-the-date.get.ts` returning `listResponses(useDb())` (admin
      guard already covers `/api/admin/`)
- [x] 4.3 Add `app/pages/admin/save-the-date.vue`: admin layout, table of name, phone, full
      address, both room-night flags and submitted time (newest first), the three interest totals
      computed from the list, and an empty state
- [x] 4.4 Add the nav entry to `app/layouts/admin.vue`
- [x] 4.5 Quality pass: test, lint, typecheck green

## 5. Export and backup

- [x] 5.1 Install `features/data-export.feature` into `tests/features/`, extend
      `tests/steps/data-export.steps.ts` with the save-the-date sheet, venue-pack-unaffected, and
      backup/restore-includes-responses scenarios — run `npm test`, confirm the new scenarios FAIL
- [x] 5.2 Add the "Save the Date" sheet to `buildFullWorkbook` in `server/utils/export.ts` (name,
      phone, address line 1/2, town/city, postcode, country, night before, night of, submitted at);
      leave `buildVenueWorkbook` untouched
- [x] 5.3 Add the table to `dumpDatabase` and `restoreDatabase` in `server/utils/backup.ts`, and
      confirm `scripts/restore.mjs` round-trips a dump containing responses
- [x] 5.4 Note in `SECRETS.md` that backup dumps now contain postal addresses
- [x] 5.5 Quality pass: test, lint, typecheck green

## 6. Staged page reveal

- [x] 6.1 Install `features/design-system.feature` into `tests/features/`, extend
      `tests/steps/design-system.steps.ts` with the reveal scenarios (focal reveals on load,
      sections reveal on intersection, reduced motion and missing `IntersectionObserver` leave
      everything visible, no hidden state without JavaScript, admin and print routes untagged) —
      run `npm test`, confirm the new scenarios FAIL
- [x] 6.2 Add the reveal directive plugin (`app/plugins/reveal.client.ts`) — hidden class applied
      at mount, `.focal` modifier reveals immediately, others observe once then unobserve, no-op
      under `prefers-reduced-motion`, immediate reveal when `IntersectionObserver` is missing
- [x] 6.3 Add the reveal CSS (opacity + translate transition) to the global stylesheet, keyed off
      the directive's classes so nothing is hidden until the directive runs
- [x] 6.4 Tag focal and section elements across the guest pages — `index`, `welcome`,
      `save-the-date` (focal = names/arch/date block, form is a later section), `schedule`,
      `travel`, `gifts`, `faq`, `rsvp`; leave admin pages and `PrintPage` routes untouched
- [x] 6.5 Verify in the browser preview: focal block reveals on load, below-fold sections reveal on
      scroll, `prefers-reduced-motion` renders everything static and visible, `/admin/print/letters`
      unaffected
- [x] 6.6 Quality pass: test, lint, typecheck green

## 7. Spec sync

- [x] 7.1 Confirm the installed `tests/features/*.feature` files are green, then sync the delta
      specs into `openspec/specs/` (`/opsx:sync`) — new `save-the-date` capability plus the
      `guest-data`, `guest-admin`, `data-export`, and `design-system` deltas — keeping those
      feature files as their executable projections
