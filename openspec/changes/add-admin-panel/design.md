## Context

Data model exists (`add-rsvp-system`). Two admin users (the couple) sharing one credential is acceptable. Venue needs an Excel with meal counts and dietary requirements; phones must stay out of venue-bound files.

## Goals / Non-Goals

**Goals:**
- Everything guest-related manageable without touching the database directly
- Venue export correct and phone-free by construction
- Chase list usable on a phone (nagging happens from the sofa)

**Non-Goals:**
- Multi-user admin accounts, roles, audit log (two trusted users)
- Content editing (JSON files remain the content workflow)
- Seating (next change — but admin shell provides the nav slot)

## Decisions

- **Single admin credential in env var**, `nuxt-auth-utils` session with an `admin: true` flag distinct from the public-site session. Same in-memory rate limiter pattern as the site gate. Alternative considered: user table + hashed passwords — rejected as needless for two people sharing one login.
- **Admin routes under `/admin`**, server middleware guards `/api/admin/**` — UI middleware alone is not enforcement.
- **Dashboard queries are plain Drizzle aggregations** (counts by attending status, meal pivot from guest rows resolved against menu.json names). No caching — 200 rows.
- **Chase filter is a dashboard list filter** (`responded / not responded / declined / all`), each row showing party name, guests, phone (admins may call), token-link copy button.
- **RSVP editing reuses the guest-facing form components** where practical, admin-skinned; admin edits bypass the deadline lock (deliberate — post-deadline corrections are the point) and bump `updatedAt`.
- **CSV import: papaparse, two-step** — upload/paste → parsed preview with per-row validation errors (duplicate names, bad phones) → confirm commit. Expected columns: party name, guest name, phone (optional), isChild (optional). Import creates tokens automatically. Re-import does not merge; it only adds new parties (merge complexity not worth it — manual editing covers corrections).
- **Excel: exceljs, one venue workbook** with two sheets (Attendees: name, party, meal, dietary; Meal Totals: option × count including child menu) and **no phone columns anywhere in it**. Separate full-list workbook includes phones and response status. Buttons stream the file (no server temp storage).
- **Backup endpoint `GET /api/admin/backup`**: full JSON dump of all tables. Auth: bearer secret from env (callable by CI cron without a browser session). Restore = small script reading the dump back via Drizzle.
- **Settings page**: two date fields (wedding date, RSVP deadline) writing to the settings table; drives .ics, countdown, and deadline lock everywhere.

## Risks / Trade-offs

- [Shared admin password] → acceptable for two users; rotate by changing env var
- [CSV import add-only] → documented in UI; manual CRUD handles fixes; avoids merge-conflict UI complexity
- [Backup secret in CI] → stored as GitHub Actions secret; endpoint returns nothing without it

## Open Questions

- None blocking.
