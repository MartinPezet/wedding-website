## 1. Cluster, arch, and divider glyph rework

- [x] 1.1 Extend `tests/unit/floral-glyphs.test.ts` — confirm red: FloralCluster
      contains the `hstem` stem signature (`Q-4,-46 -2,-92`) and NO tulip cup
      path (`-12,-26 0,-34`) or `--color-tulip` refs; FloralDivider contains the
      10-floret `bloom` mophead (not the bare floret trio); FloralArch has the
      swapped base-end translates (`flb`→20,104 / left `bloomX`→1,140,
      `fla`→310,104 / right `bloomX`→329,140).
- [x] 1.2 Implement: FloralCluster — drop tulip defs/uses, add `hstem`
      (design.md geometry), replace the floating `bloomX` uses in `sway-b` with
      corner-rooted `hstem` instances (keep bare floats only where density
      needs them); FloralDivider — centre becomes `bloom` at ~scale(0.5);
      FloralArch — apply the four translate swaps.
- [x] 1.3 Quality pass: `npm test`, `npm run lint`, `npm run typecheck` green.

## 2. Tulip corner art (footer + prints)

- [x] 2.1 Install this change's `design-system.feature` +
      `print-materials.feature` into `tests/features/`; extend
      `tests/steps/design-system.steps.ts` (tulips-in-footer scenario:
      FloralTulipCorner used in the default layout footer, no tulip paths in
      FloralCluster) and add print steps for the two tulip-corner scenarios
      (source-level: letters/handout templates place the corner art) — confirm
      the new scenarios red.
- [x] 2.2 Add `FloralTulipCorner.vue` (tstem tulips + bud over splayed `tlf`
      grass blades, static, aria-hidden, token fills); place mirrored pair in
      the footer (`app/layouts/default.vue`, absolute bottom corners,
      pointer-events-none) and in the bleed layer of
      `app/pages/admin/print/letters.vue` + `handout.vue`.
- [x] 2.3 Verify in the browser preview (footer at phone + desktop, letters +
      handout print routes). Quality pass: `npm test`, `npm run lint`,
      `npm run typecheck` green.

## 3. Themed form controls (RSVP)

- [x] 3.1 Write failing step tests (red) for the two themed-form-controls
      scenarios (source-level on `app/pages/rsvp.vue`: radios use the
      hidden-native-input + peer-checked floret pattern, not `accent-*`;
      selects are `appearance-none` with padded chevron, rounded border, and
      hover/focus theme classes) — confirm red.
- [x] 3.2 Implement in `app/pages/rsvp.vue`: floret radios (sr-only native
      input + peer-checked SVG floret, peer-focus-visible ring) and themed
      selects (relative wrapper, inline chevron, pr-10, hover:border-petal,
      transition) per design.md.
- [x] 3.3 Verify in the browser preview (radio toggle, select hover/focus,
      keyboard focus ring). Quality pass: `npm test`, `npm run lint`,
      `npm run typecheck` green.

## 4. Hydrangea favicon

- [x] 4.1 Update `tests/unit/favicons.test.ts` and add the favicon scenario to
      the design-system steps: favicon.svg carries the floret path signature
      (`-6.5,-11 0,-15.5`) and the mophead token set (petal-soft, petal,
      petal-mid, gold-soft) — confirm red.
- [x] 4.2 Rework `scripts/generate-favicons.mjs` to emit the hydrangea mophead
      (floret defs + `c-bloom` cluster transforms) and run `npm run favicons`.
- [x] 4.3 Quality pass: `npm test`, `npm run lint`, `npm run typecheck` green.
