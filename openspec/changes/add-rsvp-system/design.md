## Context

Foundation provides the gated Nuxt app. This change introduces persistence and the guest-facing RSVP flow. Scale: ~100–200 guests, two admins. Hosting: AWS Amplify (Lambda — no persistent disk), local dev must work offline.

## Goals / Non-Goals

**Goals:**
- One data model serving RSVP, admin, seating, and print changes
- Guests identified by QR token with zero typing
- Same database code local and in production

**Non-Goals:**
- Admin UI (next change — but schema anticipates it)
- Email confirmations (explicitly declined)
- Seating fields (added by `add-seating-chart`)

## Decisions

- **Drizzle ORM + libSQL client.** Local dev: `file:./data/wedding.db`. Production: Turso URL + auth token. One env var switch, identical code. Alternatives considered: DynamoDB (pure AWS — rejected: relational queries and meal pivots get awkward), RDS (rejected: cost/overkill for 200 rows).
- **Schema — RSVP fields live on the guest row** (attending, mealChoiceId, dietaryNotes, isChild, phone) rather than a separate rsvps table: exactly one RSVP per guest, a join adds nothing. Party rows carry token, name, songRequest, noteToCouple, respondedAt, updatedAt.
  ```
  parties: id, name, token (unique), songRequest, noteToCouple, respondedAt, updatedAt
  guests:  id, partyId, name, sortOrder, isChild, phone, attending, mealChoiceId, dietaryNotes
  settings: key (pk), value   — wedding_date, rsvp_deadline
  ```
- **Tokens: 32 random bytes** (`crypto.randomBytes(32)`), base64url-encoded in URLs (`/rsvp?t=<token>`). Unguessable; no expiry (letters live for months). Constant-time lookup comparison unnecessary — token is the lookup key itself, high entropy.
- **Site-gate integration:** middleware accepts `?t=<token>` on any route; valid token sets the same session cookie as the password path plus `partyId` in the session. Invalid/expired token falls back to the password gate with a friendly message.
- **Deadline enforcement server-side** (`rsvp_deadline` from settings checked in the POST handler), not just UI lock — form disabling alone is not enforcement.
- **Phone: required at party level on the form** ("best contact number"), stored on the lead guest (first guest row). Validated with `libphonenumber-js` client-side for UX and server-side for integrity; stored E.164. Global formats supported.
- **Menu in `menu.json`**: `{ courses/options: [{id, name, description}], childMenu?: [...] }`. Meal choice stores the option `id`; venue export resolves names at read time. Child guests (isChild) see childMenu options when present.
- **Settings editable later via admin** (next change); this change seeds them with a migration/seed script.
- **Re-editing**: token revisit loads existing answers pre-filled; submitting overwrites and bumps `updatedAt`. After deadline: read-only summary with "contact us to change".

## Risks / Trade-offs

- [Token leaks if letter photographed/shared] → accepted: worst case someone RSVPs as that party; visible in admin and correctable
- [Guests without smartphones / lost letters] → password path + admin manual entry (next change) cover them
- [Lead-guest phone convention slightly implicit] → documented in schema comments; admin UI will expose per-guest phones anyway

## Migration Plan

Drizzle-kit migrations committed to the repo; applied to local file automatically and to Turso via migration script (CI hook arrives in `add-infra-deployment`).

## Open Questions

- Real menu content — user supplies `menu.json` entries during implementation
