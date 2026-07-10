## Why

The core purpose of the site: guests confirm attendance, choose meals from the menu, and submit dietary requirements — identified automatically via the personal QR token printed on their invite letter. The couple needs this data structured for the venue.

## What Changes

- Database layer: Drizzle ORM + libSQL (local SQLite file in dev, Turso in production)
- Data model: parties (invite unit with 32-byte QR token), guests (name, phone, child flag, meal/dietary/RSVP fields), settings (wedding date, RSVP deadline)
- QR token gate bypass: visiting a tokenised URL unlocks the site AND identifies the party (**modifies `site-gate`**)
- RSVP flow: party sees its named guests, confirms attendance per guest, picks meals from `menu.json`, enters dietary requirements, one required contact phone number (validated, global formats), optional song request and note to the couple
- RSVPs editable by the party until the deadline; locked read-only after
- Menu defined in `menu.json` including optional child menu section

## Capabilities

### New Capabilities

- `guest-data`: parties/guests/settings data model, secure tokens, database access layer
- `rsvp-flow`: guest-facing RSVP experience — identification, meal choice, dietary needs, contact phone, extras, deadline behaviour

### Modified Capabilities

- `site-gate`: add QR-token bypass — a valid party token authenticates the visitor and attaches party context to the session

## Impact

- Depends on `scaffold-site-foundation`
- New dependencies: drizzle-orm, @libsql/client, drizzle-kit, libphonenumber-js
- New env vars: database URL/token
- `add-admin-panel`, `add-seating-chart`, `add-print-suite` all build on this data model
