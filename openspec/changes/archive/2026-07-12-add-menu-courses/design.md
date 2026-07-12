## Context

`menu.json` is a flat `{ options, childMenu }` list and each guest stores one `mealChoiceId`. The real meal may run up to three courses (starter, main, dessert) — final shape undecided, so any course may be absent. RSVP form, server validation, admin stats/editing, and both Excel exports all touch the meal model. Existing production-shaped data (dev db, tests, seeds) holds single choices.

## Goals / Non-Goals

**Goals:**
- Menu supports 0–3 of {starter, main, dessert}, each with adult options and optional child options
- One required choice per defined course for attending guests, everywhere (guest form, server, admin edit)
- Existing single choices survive as main-course choices

**Non-Goals:**
- Arbitrary/custom course sets (fixed closed set of three; adding a fourth course is a future schema change)
- Per-course dietary notes (stays one free-text field per guest)
- Menu editing UI (menu.json remains the content workflow)

## Decisions

- **menu.json becomes `{ courses: [...] }`** — each entry `{ id: 'starter'|'main'|'dessert', name, options: [{id,name,description}], childOptions?: [...] }`; a course not present in the array does not exist. Alternative (keep flat lists per course as top-level keys) rejected: iteration order and presence checks get uglier than one array.
- **Three nullable columns on `guests`**: `starter_choice_id`, `main_choice_id`, `dessert_choice_id`, replacing `meal_choice_id`. Courses are a fixed closed set, so flat columns beat a JSON blob (typed by drizzle, no parse step, plain SQL). Migration `0001`: add columns, `UPDATE guests SET main_choice_id = meal_choice_id`, drop `meal_choice_id`.
- **Flat per-course fields through the whole stack** (`starterChoiceId` / `mainChoiceId` / `dessertChoiceId` in API payloads, form state, exports) mirroring the columns — no mapping layer. A tiny shared helper maps course id → field name and lists defined courses.
- **Child fallback per course**: child guests get `childOptions` when the course defines them, otherwise the course's adult options (same rule as today, applied per course).
- **`saveRsvp` takes the menu via options** (`options.menu`, defaulting to the real content import) so step defs can exercise absent-course menus without touching `shared/content/menu.json`. UI and endpoints keep using the real menu.
- **Dashboard/export totals grouped by course**: stats return `mealTotals: [{ id, name, options: [{ id, name, count }] }]` (one entry per defined course); venue attendee sheet gets one column per defined course; totals sheet lists course-grouped rows. Placeholder menu.json ships all three courses so the UI shows the full shape.

## Risks / Trade-offs

- [Guests who RSVP'd before the change only have a main] → migrated as main-course choice; if starters/desserts are later defined, their replies show gaps the couple fills via admin RSVP editing (or guests revisit their link — the form then requires the new courses)
- [BREAKING data/API change while unreleased] → site not launched; no external consumers; tests updated in lockstep
- [Dropping `meal_choice_id` loses rollback path] → backup endpoint dump before deploying migration; restore script rebuilds

## Migration Plan

1. Migration `0001_menu_courses.sql` (add 3 columns, copy mains, drop old column) applied by existing drizzle migrator on boot/seed
2. Code + tests land in the same change; `npm test` runs migrations against `:memory:` per suite
3. Take a JSON backup before deploying to any environment with real data
