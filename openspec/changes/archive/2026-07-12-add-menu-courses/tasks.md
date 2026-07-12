## 1. Menu structure & data model

- [x] 1.1 Install rsvp-flow.feature + guest-data.feature into tests/features/, update their step defs for the per-course model (absent-course scenario, child options per course, legacy migration scenario) — confirm red
- [x] 1.2 Restructure menu.json into courses (starter/main/dessert placeholders, child options where sensible) + content types + shared course helpers (defined courses, course→field mapping, options for guest)
- [x] 1.3 Migration 0001: add starter/main/dessert choice columns, copy meal_choice_id → main_choice_id, drop meal_choice_id; update drizzle schema, seed script, restore script, backup dump shape
- [x] 1.4 saveRsvp per-course validation (menu injectable via options for tests) + rsvp GET/POST payload fields
- [x] 1.5 RSVP form: one select per defined course per attending guest, child options per course, prefill + locked summary show per-course choices
- [x] 1.6 Quality pass: rsvp-flow + guest-data scenarios green; test, lint, typecheck

## 2. Admin & exports

- [x] 2.1 Install guest-admin.feature + data-export.feature into tests/features/, update their step defs (per-course totals, per-course meal correction, per-course workbook columns) — confirm red
- [x] 2.2 Dashboard stats grouped by course + dashboard meal totals UI
- [x] 2.3 Admin RSVP editing: one select per defined course per guest
- [x] 2.4 Venue + full workbooks: one column per defined course, course-grouped totals sheet
- [x] 2.5 Quality pass: guest-admin + data-export scenarios green; test, lint, typecheck; manual end-to-end (RSVP with all courses → admin corrects one course → exports show per-course columns)
