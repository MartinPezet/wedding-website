## 1. Admin Auth

- [ ] 1.1 Admin login page + server route (env password, constant-time compare, rate limiter reuse)
- [ ] 1.2 Admin session flag; UI middleware for /admin pages, server middleware for /api/admin/**
- [ ] 1.3 Logout

## 2. Dashboard & Guest Management

- [ ] 2.1 Dashboard stats endpoint + page: invited/responded/attending/declined counts, meal totals
- [ ] 2.2 Party list with filters (all / responded / not responded / declined), phones + copyable RSVP links, mobile-usable
- [ ] 2.3 Party/guest CRUD endpoints + forms (create, edit, delete with confirmation, token regeneration)
- [ ] 2.4 RSVP editing view per party (reuse form components, deadline bypass, updatedAt bump)
- [ ] 2.5 Settings page: wedding date + RSVP deadline

## 3. CSV Import

- [ ] 3.1 Import endpoint + papaparse parsing (party name, guest name, phone, isChild columns)
- [ ] 3.2 Preview UI with per-row validation errors; confirm-to-commit; tokens auto-generated
- [ ] 3.3 Document expected CSV format in the import UI

## 4. Exports & Backup

- [ ] 4.1 Venue workbook (exceljs): attendees sheet + meal totals sheet, attending only, no phone columns
- [ ] 4.2 Full workbook: all guests, phones, statuses, extras
- [ ] 4.3 Backup endpoint (bearer secret or admin session) returning full JSON dump
- [ ] 4.4 Restore script (reads dump, rebuilds tables)

## 5. Verification

- [ ] 5.1 End-to-end: import CSV → edit guests → submit test RSVP → correct meal in admin → both exports open in Excel with correct data
- [ ] 5.2 Confirm venue workbook contains zero phone data; unauthorised admin API and backup calls rejected
