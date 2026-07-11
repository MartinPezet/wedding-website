## 1. Database Layer

- [ ] 1.1 Install guest-data.feature into tests/features/, write step defs + unit tests (data model, token generation, settings) — confirm red
- [ ] 1.2 Add drizzle-orm, @libsql/client, drizzle-kit; configure local-file vs Turso via env
- [ ] 1.3 Define schema: parties, guests, settings (per design.md)
- [ ] 1.4 Generate initial migration; seed script for settings (wedding_date, rsvp_deadline) and sample parties
- [ ] 1.5 Server utility: token generation (32 random bytes, base64url)
- [ ] 1.6 Quality pass: guest-data scenarios green; test, lint, typecheck

## 2. Gate Integration

- [ ] 2.1 Install site-gate.feature (merged projection incl. QR token bypass) into tests/features/, write step defs for token scenarios — confirm red
- [ ] 2.2 Extend gate middleware: accept `?t=<token>`, validate against parties, set session + partyId
- [ ] 2.3 Invalid-token fallback to password gate with friendly message
- [ ] 2.4 Quality pass: site-gate scenarios green; test, lint, typecheck

## 3. Menu Content

- [ ] 3.1 Unit test for menu.json structure (options + optional childMenu) — confirm red
- [ ] 3.2 Define menu.json structure with TS interface; seed with placeholder menu
- [ ] 3.3 Quality pass: test, lint, typecheck green

## 4. RSVP Flow

- [ ] 4.1 Install rsvp-flow.feature into tests/features/, write step defs (identification, meals, phone, extras, deadline; phone-viewport is @manual) — confirm red
- [ ] 4.2 GET endpoint: current party's guests + existing answers (session partyId)
- [ ] 4.3 RSVP page: greeting, per-guest attendance toggle, meal picker (child menu for isChild guests), dietary notes — mobile-first
- [ ] 4.4 Party-level fields: required phone (libphonenumber-js validate + E.164 normalise), song request, note to couple
- [ ] 4.5 POST endpoint: validate everything server-side (phone, meal ids, guests belong to party, deadline), persist, bump respondedAt/updatedAt
- [ ] 4.6 Pre-fill on revisit; resubmission overwrites
- [ ] 4.7 Deadline lock: read-only summary UI post-deadline; server-side rejection
- [ ] 4.8 Confirmation state (attending and declining variants) with floral styling
- [ ] 4.9 Quality pass: rsvp-flow scenarios green; test, lint, typecheck; manual phone-viewport pass (QR URL → identify → RSVP → revisit → edit → deadline lock)
