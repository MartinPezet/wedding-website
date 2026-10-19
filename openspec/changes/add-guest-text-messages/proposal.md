## Why

The couple need to chase guests who haven't RSVP'd and, closer to the day, send everyone practical info. The dashboard already lists each party's phone and personal RSVP link, but turning that into a text means copy-pasting per guest. Tap-to-send links from the admin's own phone remove the copy-paste without an SMS provider, costs, or sender-ID registration.

## What Changes

- Dashboard gains an editable message box, pre-filled with an RSVP reminder. `{name}`, `{link}` and `{food_link}` placeholders are filled per party with the party name, its personal RSVP link, and its personal food-choice (menu) link.
- Each party row with a contact phone gains "Text" (`sms:`) and "WhatsApp" (`https://wa.me/`) links that open the admin's own messaging app pre-filled with that party's message.
- Works with the existing response filter: "Not yet responded" for chasing, "All" for general info.
- No server changes, no persistence, nothing is sent by the site.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `guest-admin`: adds a requirement for pre-filled text/WhatsApp message links per party on the dashboard.

## Impact

- `app/pages/admin/index.vue` — message box and per-party links.
- New `shared/utils/messages.ts` — placeholder filling and link building (pure, unit-tested).
- No API, schema, dependency, or infra changes.
