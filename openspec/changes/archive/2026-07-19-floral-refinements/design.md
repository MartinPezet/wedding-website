## Context

The hydrangea/tulip palette shipped (archived `2026-07-18-hydrangea-tulip-palette`).
This is a polish pass over the same glyph system: reposition/rework existing
`<use>` placements, move tulips from the cluster to new footer corner art,
theme the RSVP form controls, and swap the favicon's shape (colours already
migrated, shape still the old daisy). Print letters/handout reuse the footer
corner art.

Relevant test conventions already in place: `tests/unit/floral-glyphs.test.ts`
asserts shape language via path-signature substrings; design-system steps
assert source-level facts (no hex outside theme block); `favicons.test.ts`
asserts favicon.svg carries specific palette tokens.

## Goals / Non-Goals

**Goals:**
- Cluster = hydrangea-only, mopheads on leafed stems from the corner, one sway
  timing with the blooms.
- Arch base ends anchored by mopheads (floret/mophead position swap, both sides).
- New shared tulip-corner art in the footer and on letters/handout prints.
- Divider centred on a small whole mophead.
- Floret radios, themed rounded meal dropdowns with padded chevron.
- Hydrangea favicon.

**Non-Goals:**
- No admin-view styling. No RSVP validation/endpoint changes. No new sway
  timings or motion patterns. No dependency additions.

## Decisions

### FloralCluster: stemmed mopheads, no tulips
- Delete the `tstem` + `bud` uses (and their defs plus the now-unused tulip
  petal/leaf defs) from the component.
- Add the mockup's `c-hstem` glyph: stem `M0,0 Q-4,-46 -2,-92` (leaf-deep,
  width 3), `lf1`@(-2,-30) rotate(52) scale(0.7), `lf2`@(-2,-38) rotate(-46)
  scale(0.65), `bloomX`@(-2,-118) scale(0.85).
- Replace the five floating `bloomX` uses in `sway-b` with `hstem` instances
  rotated about the origin (like the sprigs in `sway-a`) at varied
  rotate/scale so the blooms land near their current visual positions —
  stems emanate from the corner, blooms + stems sway together on the existing
  `sway-b` timing. Keep one or two bare `bloomX` floats if needed to preserve
  density at the cluster heart.

### FloralArch: base-end swap (both sides)
Swap only the `translate()` of each pair, keeping each glyph's own
rotate/scale:
- left: `flb` → translate(20,104); `bloomX` → translate(1,140)
- right: `fla` → translate(310,104); `bloomX` → translate(329,140)

### Tulip corner art: new `FloralTulipCorner.vue`
One corner design: 2–3 `tstem` tulips + a `bud` over a fan of grass-like
blades (the `tlf` tulip leaf at splayed rotations from a common base). Static
(site furniture — no sway requested; print is inherently static). `aria-hidden`,
token fills only. One orientation; the opposite corner mirrors with
`-scale-x-100`.

Consumers:
- Footer (`app/layouts/default.vue`): absolute bottom-left + mirrored
  bottom-right, `pointer-events-none`, sized ~w-28 mobile / w-40 desktop.
- Print letters + handout: same pair placed in each page's bleed layer
  (alongside the existing `FloralHeader`), bottom corners.

### FloralDivider: mophead centre
Replace the centre floret trio (`flb` + 2×`fla`) with the 10-floret `bloom`
mophead at ~scale(0.5); keep the leafy curve and side leaves. Requires adding
the `bloom` def (floret cluster) to the divider component.

### Themed radios (RSVP attendance)
Native radio + `accent-color` can't render a glyph. Pattern: visually-hidden
native input (`peer sr-only`) + an adjacent inline SVG floret, `opacity`
toggled by `peer-checked:` — unchecked shows a bordered circle, checked shows
the 4-petal floret in petal tokens. Focus ring via `peer-focus-visible:` on the
visual element; label stays the click target. Keyboard + screen-reader
behaviour unchanged (native input still in the tree).

### Themed meal dropdowns
`appearance-none` on the select (kills the stock edge-hugging arrow), inline
SVG chevron absolutely positioned inside a relative wrapper with `pr-10` on
the select (arrow padding), `pointer-events-none` on the chevron. States:
existing `rounded-2xl border-leaf/40` base + `hover:border-petal
focus:border-petal transition-colors`. Option-list (popup) styling is
UA-limited; the requirement covers the control, not the OS popup.

### Favicon: hydrangea mophead
`scripts/generate-favicons.mjs` swaps the daisy `pt`/`ring` defs for the
floret mophead (three floret tints `petal-soft`/`petal`/`petal-mid` +
`gold-soft` centres, `c-bloom` cluster transforms). `favicons.test.ts` token
list updates to the tokens the mophead actually uses (petal-soft, petal,
petal-mid, gold-soft — petal-deep drops out). Regenerate via `npm run favicons`.

## Risks / Trade-offs

- **[Radio a11y]** hiding the native input risks losing focus visibility →
  `peer-focus-visible` ring on the visual glyph; native input remains for AT.
- **[Cluster density]** converting floats to stemmed blooms may thin the
  cluster heart → allow keeping bare `bloomX` floats where stems don't reach;
  judge against the live preview.
- **[Select popup styling]** the open dropdown list is OS-rendered; only the
  closed control is fully themeable → scoped the requirement to the control.
- **[favicons.test.ts]** shape swap changes the token set in favicon.svg →
  test updated in the same task group (red first).

## Open Questions

- None blocking.
