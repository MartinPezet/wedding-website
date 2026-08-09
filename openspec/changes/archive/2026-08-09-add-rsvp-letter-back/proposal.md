## Why

The printed RSVP invite letter is currently single-sided: the reverse of every A5 sheet
prints blank. Guests handle the card, and a blank back reads as unfinished next to the
floral front. A purely decorative verso — monogram, floral divider, inset border — closes
the card without adding any content to maintain.

## What Changes

- New print component `PrintLetterBack.vue`: a full-bleed decorative A5 verso built with the
  same SVG technique as `FloralArch.vue` (uid-scoped `<defs>` primitives + `<use>` instances,
  all fills routed through theme tokens, bloom-in reveal gated on `prefers-reduced-motion`).
- The back carries three fixed elements, matching the supplied mockup:
  - a perimeter foliage band (branch strokes, sprigs, berries, scattered hydrangea mopheads)
    that runs to the sheet edge and leaves the centre clear;
  - a double inset hairline border rectangle;
  - centred `C & M` monogram in the display face with a `FloralDivider` beneath it.
- Letter placement data (branch paths, sprig/bloom scatter) lives as arrays in the component's
  `<script setup>`, iterated with `v-for`, so the floral density and arrangement can be retuned
  by editing numbers rather than markup. The mockup's floral treatment is explicitly a starting
  point, not fixed.
- `admin/print/letters.vue` emits the back as a second `PrintPage` immediately after each
  party's front letter, so the batch prints duplex in front/back/front/back order. Single-party
  reprints (`?party=<id>`) get their back too.
- No content, no data, no server changes: the back is decoration only and identical for every
  party.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `print-materials`: new requirement for a decorative back page on RSVP invite letters, and the
  duplex (interleaved front/back) ordering of the letters batch print.

## Impact

- `app/components/PrintLetterBack.vue` (new)
- `app/pages/admin/print/letters.vue` (renders the back after each letter)
- `openspec/specs/print-materials/spec.md` + `tests/features/print-materials.feature`
- No new dependencies; no server routes, schema, or API changes.
- Print consumables: the letters batch now uses double-sided printing; page count per party
  goes from one sheet side to two.
