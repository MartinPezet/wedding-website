## Why

The menu is currently a single flat list of meal options (plus a child list), so guests can only choose one "meal". The actual wedding meal may have up to three courses — starter, main, dessert — and the couple has not yet decided which courses will run. The data model must support per-course choices without forcing all three courses to exist.

## What Changes

- **BREAKING** `menu.json` restructured from `{ options, childMenu }` to a list of courses (`starter`, `main`, `dessert`), each with its own options and optional child options; any course may be absent
- **BREAKING** Guest meal storage moves from a single `mealChoiceId` to per-course choices
- RSVP form shows one choice per defined course for each attending guest (child options per course for child guests); every defined course is required when attending
- Server-side RSVP validation checks one valid option per defined course
- Admin dashboard meal totals grouped by course
- Admin RSVP editing edits per-course choices
- Venue Excel export: one column per course on the attendee sheet; meal totals grouped by course
- Existing data migrated: current `mealChoiceId` values become the main-course choice

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `rsvp-flow`: "Per-guest attendance and meal choice" becomes per-course — one choice per course defined in menu.json, child options per course
- `guest-data`: guest RSVP fields change from a single meal choice to per-course meal choices
- `guest-admin`: dashboard meal totals and admin RSVP editing become per-course
- `data-export`: venue workbook attendee sheet and meal totals sheet become per-course

## Impact

- `shared/content/menu.json` + content types, `app/pages/rsvp.vue`, `server/utils/rsvp.ts`, `server/db/schema.ts` (+ migration), `server/utils/admin.ts` (stats), `server/utils/export.ts`, `app/pages/admin/parties/[id].vue`, `app/pages/admin/index.vue`, seed script
- Existing feature files / step defs for rsvp-flow, guest-admin, data-export need updating alongside the delta specs
- No new dependencies
