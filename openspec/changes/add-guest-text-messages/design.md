## Context

The dashboard (`app/pages/admin/index.vue`) already loads every party with its lead-guest phone (E.164, via `normalisePhone`) and token, renders the RSVP link as `${origin}/?t=${token}`, and filters by response state. Everything a reminder needs is already on the page.

## Goals / Non-Goals

**Goals:**
- One editable message, filled per party, sent from the admin's own phone with one tap per party.
- Cover both RSVP chasing and general info closer to the day via the existing filter.

**Non-Goals:**
- Server-side sending (Twilio etc.), delivery receipts, scheduling.
- Saving message drafts or a send log.
- Per-guest (rather than per-party) messages.

## Decisions

- **Device links over an SMS API.** `sms:` and `wa.me` links hand off to the admin's own apps. Alternative: Twilio/BulkSMS endpoint — rejected: account and sender-ID setup, per-message cost, replies landing on an unwatched number, and a bug could text everyone twice. Guests also recognise the couple's own number.
- **Placeholders `{name}` and `{link}` only.** Party name and RSVP link are the only per-party values a reminder needs. More can be added when a real message needs them.
- **Pure helper in `shared/utils/messages.ts`.** `fillMessage(template, values)`, `smsHref(phone, body)`, `whatsappHref(phone, body)`. Auto-imported like other shared utils; unit-testable without mounting. Replacement uses a function replacer so `$` sequences in names are inserted literally.
- **`sms:<phone>?&body=<encoded>`.** RFC 5724 uses `?body=`; older iOS reads `&body=`. `?&body=` is accepted by both.
- **`wa.me/<digits>`.** WhatsApp wants the E.164 number without `+`; stored phones are already E.164.
- **Message box in a native `<details>` on the dashboard** next to the party list, so it doesn't crowd the stats. No new page; the list and filter it acts on are already there.
- **No persistence.** The message lives in page state. Reloading resets to the default reminder.

## Risks / Trade-offs

- [`sms:` body handling varies by platform/version] → `?&body=` form; @manual scenario covers a real-device check.
- [One tap per party is manual] → Acceptable at wedding scale (tens of parties); revisit with an SMS API only if that becomes the bottleneck.
- [Edited message lost on reload] → Short messages, low cost to retype; add localStorage if it bites.
