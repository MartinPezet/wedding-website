## Why

Design review of the shipped hydrangea/tulip palette surfaced refinements: the
floral cluster reads better as pure hydrangea (tulips relocate to the footer),
several glyphs need repositioning or upgrading, form controls (radios, meal
dropdowns) still look stock rather than themed, the favicon still carries the
old daisy shape, and the print letters/handout should pick up the new tulip
corner art.

## What Changes

Main frontend (not admin views):

- **FloralCluster**: remove the tulip stem + bud; give the hydrangea mopheads
  their own stems with a few leaves (mockup `c-hstem`), emanating from the
  screen corner like the leafy sprigs and swaying on the same timing as the
  mopheads.
- **FloralArch**: swap the lone floret at each arc base end with its
  neighbouring mophead (left `flb`@1,140 ↔ `bloomX`@20,104; right `fla`@329,140
  ↔ `bloomX`@310,104) — mopheads anchor the base, florets taper the ends.
- **Footer**: add tulips + leafy grass corner art at the footer corners (new
  shared corner component).
- **FloralDivider**: centre becomes a small whole hydrangea mophead instead of
  the current floret trio.
- **Radio buttons**: selected state renders as a hydrangea floret, not the
  stock solid `accent-color` dot.
- **Meal dropdowns (RSVP)**: padding between the chevron arrow and the edge;
  hover/focus/active states in theme colours; the dropdown border rounded.
- **Favicon**: regenerate as a hydrangea mophead (shape swap — colours already
  migrated).

Print materials:

- **RSVP letters + Day handout**: same tulip corner art as the footer.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `design-system`: floral-art requirement changes (cluster is hydrangea-only
  with stemmed mopheads; tulips move to footer corner art; divider centre is a
  mophead); adds a themed-form-controls requirement (floret radios, themed
  rounded dropdowns); favicon derives from the hydrangea mophead.
- `print-materials`: letters and handout gain the tulip corner art (no main
  spec exists yet — delta is ADDED requirements; sync will create it).

## Impact

- Components: `FloralCluster.vue`, `FloralArch.vue`, `FloralDivider.vue`, new
  tulip-corner component; footer in `app/layouts/default.vue`.
- Forms: `app/pages/rsvp.vue` (radios, selects) — presentational only, no
  validation or endpoint changes.
- Favicon: `scripts/generate-favicons.mjs` + regenerated `public/favicon.*`,
  `apple-touch-icon.png`; `tests/unit/favicons.test.ts` token expectations.
- Print: `app/pages/admin/print/letters.vue`, `handout.vue`.
- Tests: `tests/features/design-system.feature`, `tests/steps/design-system.steps.ts`,
  `tests/unit/floral-glyphs.test.ts`, `tests/features/print-materials.feature`.
