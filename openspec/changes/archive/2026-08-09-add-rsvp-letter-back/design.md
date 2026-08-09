## Context

`app/pages/admin/print/letters.vue` renders one `<PrintPage size="a5">` per party: floral header
in the bleed layer, invite copy, QR, fallback URL, tulip corners, bottom divider. The reverse of
each sheet prints blank.

A mockup (`RSVP Card Back.dc.html`) defines the target verso on a 720×1008 canvas (A5 ratio):

- a dense perimeter foliage band — ~60 meandering branch strokes plus scattered sprigs, berry
  clusters, loose leaves and hydrangea mopheads — hugging the edges, centre left clear;
- two nested hairline rectangles at roughly 25% / 18.6% inset (`stroke rgba(62,65,82,.22)` and
  `.12`, 1px), 7px apart;
- centred `C&M` at 118px in the display face, the `&` italic/lighter in the petal accent, then a
  150px-wide floral divider 26px below.

The mockup's `<defs>` are the site's own vocabulary already — `c-fp1..3`, `c-lf1..3`, `c-bloom`,
`c-bloomX`, `c-sprig`, `c-berry`, `c-div` are byte-identical to the paths in `FloralArch.vue`,
`FloralCluster.vue` and `FloralDivider.vue`, with tokens flattened to hex. So the back is a new
arrangement of existing primitives, not new art.

The user is not settled on the floral treatment, so the arrangement must be cheap to retune.

## Goals / Non-Goals

**Goals:**

- A decorative A5 verso interleaved after each letter, so the batch prints duplex.
- Same construction as `FloralArch.vue`: uid-scoped `<defs>` + `<use>`, theme tokens, reduced-motion
  gate.
- Floral density and placement editable as data, not markup surgery.

**Non-Goals:**

- No content on the back (no names, dates, QR, URLs) — decoration only.
- No shared "floral primitives" refactor of the existing components. Tempting, but every floral
  component already carries its own copy of the defs; extracting them is a separate change.
- No print-driver duplex configuration. The output is an interleaved page sequence; the operator
  ticks "print both sides" in the print dialog.

## Decisions

**One new component, `app/components/PrintLetterBack.vue`.** It renders the whole verso: bleed
floral band, inset border, monogram, divider. Alternative — putting the markup inline in
`letters.vue` — was rejected: the page is already 110 lines and the back is pure decoration with
no dependence on party data. Alternative — extending `PrintPage` with a `back` slot — was rejected
as an abstraction with one consumer. The component renders its own `<PrintPage size="a5">` so
`letters.vue` gains exactly one line inside the `v-for`.

**Floral placements as data arrays, not literal markup.** The mockup hardcodes ~700 `<path>` and
`<use>` elements. Instead: a handful of `const` arrays in `<script setup>` (branch path strings;
`{ x, y, rotate, scale, kind }` tuples for sprigs/berries/blooms) iterated with `v-for`. Same
render output, ~150 lines instead of ~700, and retuning the florals means editing numbers. The
placements stay hand-authored constants — not generated at runtime — so the printed art is
deterministic and identical on every render and every party's copy.

**Perimeter band derived from the mockup, seeded once.** Copy a trimmed subset of the mockup's
branch paths (roughly a third of them — the mockup's density is a starting point the user wants to
revisit) into the branch array, keeping the top / left / right / bottom edge clusters and dropping
the interior noise. The centre must stay clear enough for the monogram to read at 100% print scale.

**Border as two `<rect>` elements inside the same SVG**, not CSS borders on a wrapper div. Keeps
the inset geometry in the same coordinate space as the florals, so the band and border stay in
register when the floral inset is retuned. Stroke colours come from `--color-ink` at low alpha via
`color-mix`, not the mockup's literal `rgba(62,65,82,…)`.

**Monogram + divider as HTML over the bleed layer**, mirroring the mockup and the existing letter
front: `PrintPage`'s default slot centres a `font-display` block with `<FloralDivider>` beneath,
so type rendering, kerning and the existing divider component are reused as-is. The `&` gets
italic weight and `text-petal-deep`.

**Initials hardcoded as `C` and `M`.** The couple's names are already hardcoded in `letters.vue`
and other pages, pending the content pass; matching that keeps the change to one concern. If the
content pass moves names into `shared/content/`, the monogram follows then.

**Reveal animation reuses the arch's `bloom-in` keyframes**, scoped and wrapped in
`@media (prefers-reduced-motion: no-preference)`, exactly as `FloralArch.vue` does. It only ever
plays in the on-screen preview — print output is a static frame — but the preview is the thing the
admin looks at.

**Tests follow the existing print-materials pattern**: `mountSuspended` the letters page and count
`[data-print-page]` / `[data-letter-back]` nodes for the interleaving and no-party-data scenarios;
read the component source for the token/uid/reduced-motion scenarios, the way the tulip-corner and
divider rules already do.

## Risks / Trade-offs

- **Duplex alignment**: on a printer whose duplex flip is set wrong, backs land on the wrong sheet
  face. → The back is symmetric and identical for every party, so a flip error is invisible; only a
  simplex printer produces wrong output, and that is an operator setting.
- **Doubling page count**: a 60-party batch goes from 60 to 120 sides. → Intended; the back is only
  useful printed. Single-party reprint already exists for one-offs.
- **Floral band vs. monogram legibility**: dense edge art can crowd the centre at A5. → The inset
  border defines the clear zone; the band is authored outside it, and the placement arrays make
  thinning it a numbers edit.
- **~150 lines of coordinate data**: unavoidable for hand-authored SVG art, and consistent with the
  existing floral components. → Data is grouped and commented by edge so a retune is localised.
- **User is undecided on the florals**: the band may be reworked after seeing it on paper. → The
  border, monogram and divider are specified as fixed; only the band's placement data is expected
  to move, and it is isolated in one array.
