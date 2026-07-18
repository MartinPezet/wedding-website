## 1. Palette tokens

- [x] 1.1 Install `design-system.feature` into `tests/features/`, write step
      defs + a unit test asserting: the tulip triad (`--color-tulip`,
      `--color-tulip-mid`, `--color-tulip-deep`) is defined in the `@theme`
      block, fonts load from `@fontsource` with no `fonts.googleapis.com`, and
      no literal hex colour appears in `app/components/Floral*.vue` outside the
      theme block — run `npm test`, confirm the tulip-triad scenario is red.
- [x] 1.2 Swap the `@theme` block in `app/assets/css/main.css` to the mockup 2a
      values (design.md token table), add the tulip triad, and replace the
      retired `1b:` swap comments with a comment naming mockup 2a.
- [x] 1.3 Quality pass: `npm test`, `npm run lint`, `npm run typecheck` green.

## 2. Hydrangea & tulip floral geometry

- [x] 2.1 Extend the design-system step defs / unit test to assert the new
      shape language: each floral component defines a hydrangea floret glyph and
      (where the mockup uses them) tulip-cup glyphs, the daisy `ring8`/`ring5`
      defs are gone, and every fill stays a `var(--color-*)` reference — confirm
      the new-glyph assertions are red.
- [x] 2.2 Port the mockup 2a glyphs (design.md path constants + `<use>`
      transforms): hydrangea florets/mopheads and tulip cups into
      `FloralBloom.vue` (mophead), `FloralCluster.vue` (`c-cluster`: sprigs,
      berries, mopheads, tulip stems/buds), and `FloralDivider.vue` (`c-div`);
      remove the unused daisy defs. (`FloralFrame.vue` is not reshaped — it is
      deleted in group 4.) `FallingPetals.vue` needs no change (token-driven
      fills recolour
      automatically); inspect `FloralHeader.vue` / `FloralHeading.vue` and
      recolour/reshape only if they inline glyphs.
- [x] 2.3 Verify in the browser preview: hydrangea + tulip clusters sway, petals
      recolour, and text contrast holds on the deep-blue RSVP section (`#3E4E75`)
      and in `print.css`. Quality pass: `npm test`, `npm run lint`,
      `npm run typecheck` green.

## 3. Hero floral arch

- [x] 3.1 Extend the design-system step defs / unit test to assert the hero
      arch: `/` and `/gifts` render a clipped hero photo with a decorative
      `aria-hidden` arch over its top edge — confirm red.
- [x] 3.2 Add `FloralArch.vue` (design.md hero-arch geometry: `variant`
      arch/circle clip of the slotted photo + leaf-lined semicircle + hydrangea
      mopheads + base tulip stems, `bloomIn` reveal, static under reduced
      motion), and use it in place of `FloralFrame` in `app/pages/index.vue`
      (`variant="arch"`) and `app/pages/gifts.vue` (`variant="circle"`).
- [x] 3.3 Verify in the browser preview at phone + desktop widths: the photo is
      clipped, the arch crowns both hero photos, scales with the photo, and
      doesn't overlap the heading or cause horizontal scroll. Quality pass:
      `npm test`, `npm run lint`, `npm run typecheck` green.

## 4. Retire the floral frame

- [x] 4.1 Install this change's `photo-frames.feature` into `tests/features/`
      and update `tests/steps/photo-frames.steps.ts`: drop the `FloralFrame`
      mount and the "Photos in floral frames" rule (only the `@manual`
      responsive-delivery rule remains) — run `npm test`, confirm green with the
      frame scenario gone.
- [x] 4.2 Delete `app/components/FloralFrame.vue` and confirm no remaining
      imports/usages reference it.
- [x] 4.3 Quality pass: `npm test`, `npm run lint`, `npm run typecheck` green.
