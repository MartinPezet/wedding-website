## 1. Admin Auth

- [ ] 1.1 Install admin-auth.feature into tests/features/, write step defs (separate login, rate limit, server-side API enforcement) — confirm red
- [ ] 1.2 Admin login page + server route (env password, constant-time compare, rate limiter reuse)
- [ ] 1.3 Admin session flag; UI middleware for /admin pages, server middleware for /api/admin/**
- [ ] 1.4 Logout
- [ ] 1.5 Quality pass: admin-auth scenarios green; test, lint, typecheck

## 2. Dashboard & Guest Management

- [ ] 2.1 Install guest-admin.feature into tests/features/, write step defs (dashboard counts, chase filter, CRUD, RSVP editing, settings) — confirm red
- [ ] 2.2 Dashboard stats endpoint + page: invited/responded/attending/declined counts, meal totals
- [ ] 2.3 Party list with filters (all / responded / not responded / declined), phones + copyable RSVP links, mobile-usable
- [ ] 2.4 Party/guest CRUD endpoints + forms (create, edit, delete with confirmation, token regeneration)
- [ ] 2.5 RSVP editing view per party (reuse form components, deadline bypass, updatedAt bump)
- [ ] 2.6 Settings page: wedding date + RSVP deadline
- [ ] 2.7 Quality pass: dashboard/CRUD/settings scenarios green; test, lint, typecheck

## 3. CSV Import

- [ ] 3.1 Step defs for the CSV import scenarios (valid import, invalid rows surfaced) — confirm red
- [ ] 3.2 Import endpoint + papaparse parsing (party name, guest name, phone, isChild columns)
- [ ] 3.3 Preview UI with per-row validation errors; confirm-to-commit; tokens auto-generated
- [ ] 3.4 Document expected CSV format in the import UI
- [ ] 3.5 Quality pass: import scenarios green; test, lint, typecheck

## 4. Exports & Backup

- [ ] 4.1 Install data-export.feature into tests/features/, write step defs (venue workbook incl. no-phones assertion, full workbook, backup auth, restore) — confirm red
- [ ] 4.2 Venue workbook (exceljs): attendees sheet + meal totals sheet, attending only, no phone columns
- [ ] 4.3 Full workbook: all guests, phones, statuses, extras
- [ ] 4.4 Backup endpoint (bearer secret or admin session) returning full JSON dump
- [ ] 4.5 Restore script (reads dump, rebuilds tables)
- [ ] 4.6 Quality pass: export/backup scenarios green; test, lint, typecheck; manual end-to-end (import CSV → edit → test RSVP → correct meal → both exports open in Excel)
