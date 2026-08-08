## Context

The site was built against placeholders: `schedule.json` puts six events at "Huntsham Court,
Devon EX16" on 2027-01-17, `handout.json` repeats the venue, `app/layouts/default.vue` and
`app/pages/save-the-date.vue` hard-code "Devon, England", `app/pages/admin/print/letters.vue`
hard-codes `venueLine = "Huntsham Court, Devon"`, and `scripts/seed.mjs` seeds
`wedding_date: '2027-06-12'`. Nine files, three different placeholder dates.

`app/pages/save-the-date.vue` is the only page reachable without a session
(`app/middleware/auth.global.ts` lets `/welcome` and `/save-the-date` through) and today it is
read-only: photo, date, "Invitation to follow". Every write path on the site so far sits behind
either the shared password (`/api/gate`), a party token, or an admin session
(`server/middleware/admin-guard.ts`). This change adds the first genuinely public write endpoint,
accepting name, phone, and home address.

Existing pieces this change leans on: `normalisePhone` (`shared/utils/phone.ts`,
libphonenumber-js, GB default region), `createLoginLimiter` (`server/utils/auth.ts`, in-memory
per-IP with exponential backoff), `buildFullWorkbook` (`server/utils/export.ts`, ExcelJS),
`dumpDatabase`/`restoreDatabase` (`server/utils/backup.ts`), and the admin layout's nav.

## Goals / Non-Goals

**Goals:**

- One home for venue identity, so the next venue detail change is a one-file edit.
- Collect postal addresses and room-night interest from the save-the-date page while it is the
  link being shared.
- Give the guest frontend a staged arrival — focal point first, sections as they are reached —
  without ever making content depend on JavaScript or motion to be readable.
- Keep the public endpoint safe: server-side validation of every field, per-IP throttling, no way
  to enumerate or read back what others submitted.
- Make the collected data usable — admin list with totals, plus a sheet in the existing export.

**Non-Goals:**

- No booking, payment, or room allocation. The checkboxes gauge interest; the couple negotiate the
  block with the venue off-site.
- No linkage from save-the-date responses to parties/guests. Building invite parties from these
  responses is a later change (the CSV import path already exists for that).
- No email/SMS confirmation to the submitter, and no notification to the couple. No mail
  transport is configured and adding one is its own change.
- No captcha. Rate limiting plus a required valid phone number is the ceiling here.
- No revision of the schedule's running order — times stay placeholders until the venue confirms.
- No route/view transitions between pages, and no per-element choreography inside a section. The
  reveal is one class toggle per tagged section.

## Decisions

### Venue identity moves to `shared/content/venue.json`

A new typed content file (`name`, `addressLines`, `county`, `url`, `mapsUrl`) exported from
`shared/content/index.ts` as `venue`, consumed by the save-the-date page, the default layout
footer, the printed letter venue line, and `handout.json`'s venue section.

Alternative considered: leave the venue inline per event in `schedule.json` and keep the page
strings hard-coded. Rejected — the strings are already duplicated across six files and this change
has to touch all of them anyway; a venue file makes the next edit (postcode, what3words, a changed
maps pin) one line.

`schedule.json` keeps its per-event `location` and `mapsUrl` strings, updated to the new venue.
Making them optional and defaulting to `venue` would remove six duplicated strings but would touch
the schedule renderer, the .ics builder, and the `content-pages` spec. Not worth it: an event
genuinely can move (a church ceremony, a next-day brunch), so per-event location stays real data.

### New table `save_the_date_responses`, keyed by phone

Drizzle table in `server/db/schema.ts` plus migration `0003_save_the_date.sql`:
`id`, `name`, `phone` (unique, E.164), `addressLine1`, `addressLine2` (nullable), `city`,
`postcode`, `country`, `stayNightBefore` / `stayNightOf` (boolean, default false), `createdAt`,
`updatedAt` (ISO text, matching `parties.respondedAt`).

Resubmission is an upsert on the unique `phone` column (`onConflictDoUpdate`), which gives the
"corrected address" behaviour for free and caps how much one person can flood the table. Phone is
the only field a household reliably re-enters identically; name and address are not.

Alternative considered: reuse `parties`/`guests` so responses flow straight into the invite list.
Rejected — parties are invite units with tokens and fixed guest lists chosen by the couple; a
self-service public form writing into them would break "parties cannot add guests" and pollute the
RSVP dashboard with people who may not be invited.

### Validation lives in `shared/utils/save-the-date.ts`, called from both sides

One `validateSaveTheDate(input)` returning `{ ok: true, value }` with the phone normalised, or
`{ ok: false, error }`. The page calls it before `$fetch`; `server/api/save-the-date.post.ts`
calls it again on the parsed body and is the only enforcement that counts. Field caps: 120 chars
for name and each address line, 20 for postcode, 60 for country.

This mirrors how `saveRsvp` centralises RSVP validation, and stops the client and server drifting
apart on what "valid" means. Trimming and normalisation happen inside it so both sides store and
display the same shape.

### Throttling reuses `createLoginLimiter`

Every submission — success or failure — calls `recordFailure(ip)`, so the existing counter
becomes a submission counter: 5 free, then 30s/60s/120s backoff. No new limiter code, same
in-memory ceiling already accepted for the gate.

Alternative considered: a DB-backed counter surviving restarts. Rejected for the same reason the
gate limiter is in-memory — a wedding site with a few hundred visitors does not need it, and the
unique-phone upsert already bounds the damage. `createLoginLimiter` gets a doc comment noting the
second use rather than a rename.

### Admin surface

`GET /api/admin/save-the-date` returns all responses newest-first (covered by the existing
`admin-guard` middleware since it sits under `/api/admin/`), rendered by
`app/pages/admin/save-the-date.vue` with three totals — night before, night of, either — computed
client-side from the same list. Nav entry added to `app/layouts/admin.vue`.

Totals are derived in the page rather than in a stats endpoint: the list is already fetched, and
`/api/admin/stats` is about RSVP counts.

### Export and backup

`buildFullWorkbook` gains a "Save the Date" sheet (name, phone, address parts, both flags,
submitted at). The venue workbook is untouched — the venue never gets home addresses.
`dumpDatabase`/`restoreDatabase` gain the table; restore deletes it before reinserting, in the
same order-sensitive block as the others.

### Form UX

Single-column, mobile-first, matching the RSVP form's controls and design tokens. `type="tel"` and
`autocomplete` on every field (`name`, `tel`, `address-line1`, `address-line2`,
`address-level2`, `postal-code`, `country-name`) so mobile address autofill works. The two room
checkboxes sit in their own bordered block with the rate/inclusions/interest-only copy above them.
On success the form is replaced by a confirmation panel rather than cleared, so nobody
double-submits by reflex.

### Staged reveal: IntersectionObserver directive, not scroll-driven CSS

Every guest page is server-rendered with all its content present; the reveal is a presentation
layer over content that is already there. A `v-reveal` directive (registered by a Nuxt plugin)
adds the hidden state at mount and removes it either immediately (`v-reveal.focal`, the page's
hero or heading) or when the element first intersects the viewport, then unobserves.

`animation-timeline: view()` would do this with zero JavaScript, but it is not in Safari and
guests arrive by QR code on phones — the majority would see no effect at all. A ~15-line directive
covers every browser. The existing `design-system` spec already records that scroll-*driven* motion
was dropped for the floral sway; this is scroll-*triggered*, a one-shot class toggle, not a
timeline.

Two ordering choices, both deliberate: the focal element opts in explicitly rather than being
inferred from document order, so a page whose hero is not its first element still reveals the
right thing first; and sections below the fold wait for scroll rather than cascading on load, so
nothing animates where nobody is looking.

**Content is never hidden by CSS alone.** The hidden state is applied by the directive at mount,
so a visitor with no JavaScript, a crawler, or a failed hydration sees the full page. No
`IntersectionObserver` support reveals everything immediately; `prefers-reduced-motion` makes the
directive a no-op. This is the same posture as the floral art, which already renders statically
under reduced motion.

Scope is the guest frontend only. Admin pages are a working tool, and `PrintPage` routes must
never animate — a mid-transition element could be captured by the print renderer.

## Risks / Trade-offs

- **Public endpoint accepting personal data (name, phone, home address)** → validated and capped
  server-side, throttled per IP, unique-phone upsert bounds row growth; nothing is ever read back
  publicly (no GET on the public route).
- **In-memory rate limiter resets on redeploy and is per-instance** → accepted, same as the gate;
  the table cannot be flooded with distinct rows faster than distinct valid phone numbers can be
  supplied.
- **Home addresses now sit in the nightly JSON backup** → backup endpoint is already bearer- or
  admin-authenticated; note in `SECRETS.md` that dumps now contain postal addresses and should be
  stored accordingly.
- **Spam or joke submissions** → visible to the couple in the admin list and deletable in a later
  change; a required valid phone number raises the bar. No delete UI ships here (**Open
  Question** below).
- **Room rate quoted as "around £200"** → copy says approximate and interest-only, so the number
  can move without anyone having been promised a price.
- **Interest counts are not bookings** → the admin page labels them "interested", not "booked", so
  the block negotiation is never based on a false certainty.
- **Reveal fighting the existing floral motion** (`bloom-in` in `FloralArch`/`FloralCluster`,
  `FallingPetals`) → the reveal only drives section opacity and translate; floral components keep
  their own timing and their own reduced-motion gates, unchanged.
- **A section that never intersects stays hidden** (an observer that never fires, an element in a
  clipped container) → the directive reveals on mount when `IntersectionObserver` is unavailable,
  and reveal is opt-in per element, so an untagged section is simply always visible.

## Migration Plan

1. Ship migration `0003_save_the_date.sql` (additive, new table only — no existing table is
   touched, so rollback is a `DROP TABLE`).
2. Deploy. `scripts/seed.mjs` uses `ON CONFLICT DO NOTHING` for settings, so the corrected
   `wedding_date` seed applies to fresh databases only; existing environments get the new date via
   the admin settings page.
3. Content and copy changes are static — a redeploy is the whole rollout.

## Open Questions

- Should the admin be able to delete a save-the-date response (spam, duplicate under a second
  phone number)? Not in this change; add if junk actually arrives.
- Exact venue postcode and address lines for `venue.json` — "St Audries Park, West Quantoxhead,
  Somerset" is confirmed, the postcode is not yet, so `addressLines` ships without it until
  confirmed.
- Whether the night-before/night-of copy should name the actual dates (Fri 15 / Sat 16 January
  2027) rather than "the night before" / "the night of" — assumed yes, dates are clearer.
