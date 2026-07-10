## 1. Database Layer

- [ ] 1.1 Add drizzle-orm, @libsql/client, drizzle-kit; configure local-file vs Turso via env
- [ ] 1.2 Define schema: parties, guests, settings (per design.md)
- [ ] 1.3 Generate initial migration; seed script for settings (wedding_date, rsvp_deadline) and sample parties
- [ ] 1.4 Server utility: token generation (32 random bytes, base64url)

## 2. Gate Integration

- [ ] 2.1 Extend gate middleware: accept `?t=<token>`, validate against parties, set session + partyId
- [ ] 2.2 Invalid-token fallback to password gate with friendly message

## 3. Menu Content

- [ ] 3.1 Define menu.json structure (options + optional childMenu) with TS interface; seed with placeholder menu

## 4. RSVP Flow

- [ ] 4.1 GET endpoint: current party's guests + existing answers (session partyId)
- [ ] 4.2 RSVP page: greeting, per-guest attendance toggle, meal picker (child menu for isChild guests), dietary notes — mobile-first
- [ ] 4.3 Party-level fields: required phone (libphonenumber-js validate + E.164 normalise), song request, note to couple
- [ ] 4.4 POST endpoint: validate everything server-side (phone, meal ids, guests belong to party, deadline), persist, bump respondedAt/updatedAt
- [ ] 4.5 Pre-fill on revisit; resubmission overwrites
- [ ] 4.6 Deadline lock: read-only summary UI post-deadline; server-side rejection
- [ ] 4.7 Confirmation state (attending and declining variants) with floral styling

## 5. Verification

- [ ] 5.1 End-to-end on phone viewport: QR URL → identify → RSVP → revisit → edit → deadline lock (flip deadline setting to test)
- [ ] 5.2 Server-side checks: post-deadline POST rejected, invalid phone rejected, foreign guest id rejected
