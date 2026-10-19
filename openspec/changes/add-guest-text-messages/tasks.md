## 1. Message helpers

- [x] 1.1 Write `tests/unit/messages.test.ts` for `fillMessage`, `smsHref`, `whatsappHref` (repeated placeholders, `$` in names left literal, `&`/newlines encoded, `wa.me` digits without `+`) — confirm red
- [x] 1.2 Implement `shared/utils/messages.ts` until unit tests pass
- [x] 1.3 Quality pass: test, lint, typecheck green

## 2. Dashboard message box and links

- [x] 2.1 Install `guest-admin.feature` into `tests/features/`, write step definitions for the new rule in `tests/steps/guest-admin.steps.ts` — confirm red
- [x] 2.2 Add the message box (default RSVP reminder) and per-party Text/WhatsApp links to `app/pages/admin/index.vue` until scenarios pass
- [x] 2.3 Quality pass: test, lint, typecheck green
