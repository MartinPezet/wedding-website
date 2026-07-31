## 1. Letter back component

- [x] 1.1 Install `features/print-materials.feature` into `tests/features/`, extend
      `tests/steps/print-materials.steps.ts` with the two new Rules' scenarios (source-inspection
      steps for the arch-construction rule; page-render steps for the back-page rule) — run
      `npm test`, confirm the new scenarios FAIL
- [x] 1.2 Create `app/components/PrintLetterBack.vue`: `<PrintPage size="a5">` with a
      `data-letter-back` marker, uid-scoped `<defs>` (petals, leaves, blooms, sprigs, berries)
      copied from the arch vocabulary, all fills on theme tokens
- [x] 1.3 Add the perimeter floral band: branch path strings and `{ x, y, rotate, scale, kind }`
      placement arrays in `<script setup>`, rendered with `v-for`, grouped and commented by edge;
      centre left clear
- [x] 1.4 Add the double inset hairline `<rect>` pair, stroked from `--color-ink` via `color-mix`
- [x] 1.5 Add the centred `C & M` monogram (`font-display`, italic lighter `&` in `text-petal-deep`)
      with `<FloralDivider>` beneath it
- [x] 1.6 Add the `bloom-in` reveal in a scoped `@media (prefers-reduced-motion: no-preference)`
      block, mirroring `FloralArch.vue`
- [x] 1.7 Quality pass: test, lint, typecheck green

## 2. Duplex interleaving in the letters print route

- [x] 2.1 Confirm the back-page scenarios in `tests/features/print-materials.feature` still fail for
      the letters page (interleaving, no party data, single-party reprint) — run `npm test`, red
- [x] 2.2 Render `<PrintLetterBack>` after each party's `<PrintPage>` inside the `v-for` in
      `app/pages/admin/print/letters.vue`, so the batch emits front/back per party
- [x] 2.3 Verify in the browser preview at `/admin/print/letters`: back pages alternate with fronts,
      the monogram reads clear of the band at A5, and the print preview paginates one page per sheet
- [x] 2.4 Quality pass: test, lint, typecheck green

## 3. Spec sync

- [x] 3.1 Sync the delta spec into `openspec/specs/print-materials/spec.md` (`/opsx:sync`), keeping the installed `tests/features/print-materials.feature` as its executable projection
