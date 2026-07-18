## Context

The palette and floral art are token-driven and share one SVG "shape language"
(teardrop petal `pt`, wide petal `pw`, leaf `lf`, and daisy rings `ring8`/`ring5`)
duplicated across `FloralCluster`, `FloralBloom`, `FloralDivider`, `FloralFrame`.
Mockup 2a keeps the same layout, timings, and motion but changes two things:
the 13 colours, and the flower species — round daisies/mopheads become
**hydrangea florets** (4-petal cross) and **tulip cups** (layered teardrops).

Falling petals already read their fills from `--color-petal*` tokens, so the
petal recolour is free — only the token values change, not `FallingPetals.vue`.

## Goals / Non-Goals

**Goals:**
- Swap the `@theme` block to the mockup 2a values and add a tulip triad.
- Replace daisy/mophead glyphs with hydrangea florets + tulip cups, reusing the
  mockup's exact SVG path constants so the art matches the approved design.
- Keep all fills as `var(--color-*)` references (no literal hex in components).
- Preserve sway/petal-fall animations, reduced-motion behaviour, mobile-first
  scaling, and every component's public API.
- Add a crowning floral arch over the `/` and `/gifts` hero photos.

**Non-Goals:**
- No layout, motion-timing, or component-prop changes beyond adding the hero
  arch overlay (which touches only `index.vue` / `gifts.vue` markup).
- No new dependencies.
- Tulips need not appear in every component — dividers stay hydrangea-only,
  matching the mockup's `c-div`.

## Decisions

### Token values (`app/assets/css/main.css` `@theme`)
Map mockup 2a's token strip to the existing semantic names, and append the
tulip triad:

| Token | 2a value | Role |
|---|---|---|
| `--color-cream` | `#F8F7F3` | page background |
| `--color-ink` | `#3E4152` | primary text |
| `--color-petal` | `#7E97D0` | hydrangea floret (mid-blue) |
| `--color-petal-mid` | `#5570B4` | hydrangea floret (blue) |
| `--color-petal-soft` | `#A9BCE4` | hydrangea floret (periwinkle) |
| `--color-petal-deep` | `#4C66AC` | eyebrow / accent blue |
| `--color-leaf` | `#7B8F6F` | foliage |
| `--color-leaf-soft` | `#9FB194` | light foliage |
| `--color-leaf-deep` | `#5A6E50` | stems / dark foliage |
| `--color-sage` | `#3E4E75` | dark RSVP section bg |
| `--color-gold` | `#D9C48F` | stamen / RSVP eyebrow |
| `--color-gold-soft` | `#E7D9A8` | floret centres |
| `--color-blush` | `#E8EDF7` | soft section bg |
| `--color-tulip` (new) | `#8C7FD0` | tulip cup (violet) |
| `--color-tulip-mid` (new) | `#6C5FB8` | tulip cup (mid) |
| `--color-tulip-deep` (new) | `#4D3F96` | tulip cup (deep) |

The trailing `1b:` swap comments in the current file are dropped (that alternate
is retired); the block's leading comment updates to name mockup 2a.

### New SVG glyphs (replace daisy helpers)
Adopt the mockup's path constants verbatim. Per component, define via `useId()`
scoping (existing pattern) — not a shared file, matching how the daisy helpers
are duplicated today (keeps components self-contained; a shared defs module is
out of scope for a recolour-shaped change).

- **Hydrangea floret** — petal `M0,1.5 C-5.5,-1.5 -6.5,-11 0,-15.5 C6.5,-11 5.5,-1.5 0,1.5 Z`,
  placed at `rotate(0|90|180|270)` + centre `circle r=2.6` fill `--color-gold-soft`.
  Three tints (`--color-petal-soft` / `--color-petal` / `--color-petal-mid`).
- **Mophead** — florets scattered per mockup `c-bloom` (10 florets, small) and
  `c-bloomX` (~30 florets, large) `<use>` transforms.
- **Tulip cup** — petal `M0,4 C-11,-2 -12,-26 0,-34 C12,-26 11,-2 0,4 Z`, four
  petals per `c-bloom2` arrangement, tints `--color-tulip{,-mid,-deep}`.
- **Tulip leaf** — `M0,0 C-7,-16 -8,-52 0,-80 C8,-52 7,-16 0,0 Z`.
- Leaves keep the current `lf` teardrop (visually equivalent to the mockup's
  `c-lf1`); no change needed there.

Remove the now-unused `pt`/`pw`/`ring8`/`ring5` daisy defs from each component.

### Hero floral arch (new `FloralArch.vue`)
Port the mockup 2a hero garland (the `.dc` hero SVG, `viewBox="-40 -45 410 510"`,
offset `top:-62px`): a semicircle arc `M-6,164 A175,175 0 0 1 336,164` stroked in
`--color-leaf-deep`, leaves (`lf1/lf2/lf3`) stepped along the arc, hydrangea
mopheads (`bloom`/`bloomX`) seated on it, and tulip stems + buds (`tstem`/`bud`)
at the two base corners. Wrap in the existing `bloomIn` reveal, static under
reduced motion.

- New component so both heroes share one implementation; `aria-hidden` garland.
- `FloralArch` **replaces** `FloralFrame` on these heroes and absorbs its photo
  clip: a `variant` prop (`arch` | `circle`) clips the slotted photo
  (`inset(0 round …)` on `/`, `circle(50%)` on `/gifts`), and the garland is an
  absolutely-positioned overlay lifted above the top edge, scaled to the photo
  width so it crowns without shifting layout. Reuse the arch's `<use>` transforms
  verbatim; only the wrapper/clip sizing is authored here.
- `/` hero photo is arch-shaped `w-102`; `/gifts` is circle `max-w-72`.
- `FloralFrame.vue` is used nowhere else, so it is **deleted** (see the
  photo-frames retirement decision below), not reshaped.

### Retire the corner-garland floral frame (`photo-frames`)
`FloralFrame` (corner garlands + clip) is used only on `/` and `/gifts`, the only
pages with a couple photo. The arch supersedes it, so its two frame requirements
(`Photos in floral frames`, `Frames animate on scroll`) are REMOVED via a
`photo-frames` delta spec; `Responsive image delivery` stays (the arch photos are
still `NuxtImg`). Delete `FloralFrame.vue`, drop the FloralFrame mount + frame
scenarios from `tests/steps/photo-frames.steps.ts` and
`tests/features/photo-frames.feature`. Alternative — keep `FloralFrame` unused —
rejected: dead component + a spec claiming framed photos that no page renders.

### Per-component plan
- `FloralBloom.vue`: single daisy → hydrangea mophead (`c-bloom`). Used as the
  schedule timeline node.
- `FloralCluster.vue`: top-of-viewport bush → mockup `c-cluster` (sprigs +
  berries + hydrangea mopheads on the `sway-b` group, tulip stems/buds added);
  keep the two `sway-a`/`sway-b` groups and their existing keyframes.
- `FloralDivider.vue`: `c-div` — leafy curve + one small floret cluster.
- `FloralFrame.vue`: **deleted** (superseded by `FloralArch`), not recoloured.
- `FallingPetals.vue`: no code change (token-driven fills recolour automatically).
- `FloralHeader.vue`, `FloralHeading.vue`: inspect for inlined bloom SVG during
  apply; recolour/reshape only if they inline glyphs, else no change.

### Spec prose
`openspec/specs/design-system/spec.md` Purpose line and the two modified
requirements update from "mockup 1a blush & sage / round blooms" to "mockup 2a
blue hydrangea & tulip"; via the delta spec at archive time.

## Risks / Trade-offs

- **Contrast on the deep-blue RSVP section (`#3E4E75`) and print output** →
  verify text/token contrast in the browser preview and on `print.css` before
  shipping; gold eyebrow (`#D9C48F`) on `#3E4E75` matches the approved mockup.
- **Glyph geometry drift from hand-porting transforms** → copy the mockup's
  `<use>` transform lists rather than re-authoring them.
- **A missed literal hex** would break the palette-swap guarantee → the "no
  hardcoded colours" scenario becomes a grep-style unit test over the components.

## Open Questions

- None blocking. Whether tulip cups also appear in `FloralHeader` is a visual
  call to make against the live preview during apply.
