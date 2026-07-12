## Why

The couple needs a private backend: see who has RSVP'd, chase who hasn't, correct guests' answers (including meal choices), manage the guest list, import it from CSV, set the wedding date and deadline, and export venue-ready Excel files.

## What Changes

- Admin login (separate from the site gate), rate limited
- Dashboard: response stats, meal totals, filterable guest/party list including a "not yet responded" chase filter
- Full CRUD on parties and guests: create, rename, edit phones, mark child, regenerate tokens, delete; edit any guest's RSVP fields including meal choices already chosen
- CSV import of the guest list (parties + guests) with review before commit; manual editing afterwards
- Settings page: wedding date and RSVP deadline editable in the UI
- Excel export (venue pack): attendee list with meals + dietary requirements and a meal-count pivot — **no phone numbers**; a separate full guest list export (admin use) includes phones
- JSON backup endpoint (full data dump) for the nightly backup workflow

## Capabilities

### New Capabilities

- `admin-auth`: authentication and session handling for the admin area
- `guest-admin`: dashboard, filters, party/guest CRUD, RSVP editing, CSV import, settings UI
- `data-export`: Excel exports (venue pack without phones, full list with phones) and JSON backup endpoint

### Modified Capabilities

_None._

## Impact

- Depends on `add-rsvp-system` (data model)
- New dependencies: exceljs, papaparse (CSV)
- New env vars: admin password, backup endpoint secret
- `add-infra-deployment` wires the backup endpoint to a nightly GitHub Actions cron
