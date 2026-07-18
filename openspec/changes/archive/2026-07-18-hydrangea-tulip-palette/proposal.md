## Why

The couple chose a blue hydrangea and tulip theme for the wedding. The current
site ships the blush-and-sage palette with round daisy/mophead florals (mockup
1a). Both the colours and the flower species need to change to match the new
direction (mockup 2a: blue hydrangea florets + violet tulip cups).

## What Changes

- Replace the 13-token blush/sage palette with the mockup 2a blue palette
  (periwinkle/blue hydrangea, cream ground, deep-blue RSVP section, gold accents).
- Add a **tulip triad** of tokens (violet `#8C7FD0 / #6C5FB8 / #4D3F96`), a new
  hue distinct from the hydrangea blues — the existing 13 tokens can't express it.
- Replace the round daisy/mophead flower geometry with two new shape families:
  - **hydrangea florets** — 4-petal cross glyphs clustered into mopheads
    (`FloralCluster`, `FloralBloom`, `FloralDivider`, `FloralFrame`);
  - **tulip cups** — layered teardrop petals on their own leaf, appearing in
    clusters and buds.
- Add a **hero floral arch** — a treatment that clips the hero photo (arch on
  `/`, circle on `/gifts`) and crowns it with a garland of leaves + hydrangea
  blooms (tulip stems at the base, lifted above) — replacing the corner-garland
  `FloralFrame` on both heroes. `FloralFrame.vue` (used nowhere else) is deleted.
- Recolour falling petals and all floral fills through the swapped tokens.
- Update the design-system spec's prose that names the source palette/species
  (mockup 1a blush & sage → 2a blue hydrangea & tulip).

No layout, motion timing, page structure, or component API changes. Sway/petal
animations and reduced-motion behaviour are preserved.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `design-system`: the theme-token requirement grows to include the tulip triad;
  the floral-art requirement now specifies hydrangea florets and tulip cups as
  the flower species (was generic round blooms); source-palette prose updates
  from mockup 1a to 2a; adds a new hero-floral-arch requirement.
- `photo-frames`: removes the "Photos in floral frames" and "Frames animate on
  scroll" requirements (the corner-garland frame is retired); "Responsive image
  delivery" is unchanged.

## Impact

- Tokens: `app/assets/css/main.css` (`@theme` block).
- Floral components: `app/components/FloralCluster.vue`, `FloralBloom.vue`,
  `FloralDivider.vue`, `FloralFrame.vue`, `FallingPetals.vue` (plus any consumer
  that inlines bloom SVG — `FloralHeader.vue`, `FloralHeading.vue`).
- New hero-arch art (new `FloralArch.vue`) replaces `FloralFrame` in
  `app/pages/index.vue` and `app/pages/gifts.vue`; `FloralFrame.vue` is deleted.
- `photo-frames` spec + `tests/features/photo-frames.feature` +
  `tests/steps/photo-frames.steps.ts` updated (drop the frame scenarios/mount).
- Spec: `openspec/specs/design-system/spec.md` and its `.feature` projection.
- No server, RSVP, admin, seating, or print behaviour affected. Print CSS
  (`app/assets/css/print.css`) inherits tokens; verify contrast only.
