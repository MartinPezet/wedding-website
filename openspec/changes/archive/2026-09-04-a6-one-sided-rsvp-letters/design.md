## Context

`app/pages/admin/print/letters.vue` renders one A5 `PrintPage` per party followed by `<PrintLetterBack />`, a decorative A5 verso. The print run will use a single-sided printer, so the verso is unprintable and each letter drops to A6. Type sizes stay as they are today (36px names, 18px greeting, 14px body, 12px eyebrow/URL, 35 mm QR); only the sheet, the arrangement, and the names' weight/ampersand colour change.

Three layout options were drafted on a design canvas at true scale with the site tokens and the real QR renderer. **Option C (Landscape) was chosen.** The canvas's first page shows the chosen letter, the A5 print sheet, and the A4 print sheet; the unchosen options sit on a second page:
**https://claude.ai/code/artifact/4985b16f-151e-4c61-b29f-a667b1e1a9ff**

| Option | Sheet | Layout | Status |
|---|---|---|---|
| A · Side by side | A6 portrait | Stacked header, greeting + copy beside the QR | not chosen |
| B · Stacked | A6 portrait | A5 flow tightened | not chosen |
| **C · Landscape** | **A6 landscape** | text column left (eyebrow, names, divider centred over the greeting), QR column right; one cluster top-left, one tulip bottom-right, bottom divider | **chosen** |

## Goals / Non-Goals

**Goals:**
- One A6 landscape letter per party, front only.
- Two letters per sheet, rendered 1:1 on screen and in print; the PDF is identical to the preview with the browser at 100% and no "pages per sheet" option.
- Sheet stock switchable on the print page: A5 (exact halves, one cut) or A4 (crop marks, offcut). The letter itself is identical in both.
- Batch sheet count is ⌈parties ÷ 2⌉; a single-party reprint is one sheet with one letter.
- Names styled as the site header; header divider centred under them.
- No type-size changes; QR stays 35 mm.

**Non-Goals:**
- Four-up on A4 (letters rotated to A6 portrait cells). Exact fit, but every letter prints sideways and the pair chunking changes; revisit only if paper cost matters more than a straight-through print.
- Persisting the sheet choice; it is a preview control for a one-off print run.
- Changing invite copy, deadline logic, or QR styling.
- Touching the handout, seating chart, or place cards.

## Decisions

- **Sheet is an existing page size; the letter is a slot inside it.** Two A6 landscape (148 × 105 mm) stack into a 148 × 210 mm block: exactly A5 portrait, or centred on A4 portrait (210 × 297 mm) with a 31 mm side and 43.5 mm top/bottom offcut. The letters page zeroes the sheet padding per instance with `style="--page-pad: 0"` on the `PrintPage` root (attribute fallthrough; `.print-page-body` already reads that variable) so the block can be positioned exactly. No `PrintPage`/`print.css` change. Alternative: an `a6-landscape` page size plus the browser's "2 pages per sheet" — rejected, that option scales and centres unpredictably and the preview would not match the print.
- **Sheet toggle is a query-backed ref.** `sheet = ref(route.query.sheet === 'a4' ? 'a4' : 'a5')`; a `no-print` segmented control (two buttons, `aria-pressed`) at the top of the letters page flips it. Query param so a link from the print menu or a test can preselect A4; the toggle just sets the ref (no navigation) so flipping is instant in the preview. `PrintPage :size="sheet"`; the block wrapper gets `mx-auto mt-[43.5mm]` only when `sheet === 'a4'`.
- **Crop marks live on the A4 sheet, outside the trim.** Six corner points (two x × three y: block left/right edges at top, middle cut, bottom) each get four 5 mm hairline ticks (`data-crop`, `bg-ink/50`, 1px) offset 1.5 mm away from the trim so nothing prints inside a letter. Absolutely positioned in mm on the sheet, computed from the same offsets as the block. The A5 sheet keeps its single dashed `data-cut` line at the midpoint; on A4 the middle-row crop marks replace it (the dashed line would print across the offcut, and marks are what a guillotine wants).
- **Each slot owns its art.** A slot is `relative overflow-hidden w-[148mm] h-[105mm]` with an absolute `aria-hidden` bleed layer (cluster, tulip, bottom divider) and a padded body (`p-[8mm]`). `PrintPage`'s own `#bleed` slot is not used because it spans the whole sheet. Cluster is `FloralCluster` placed directly at the top-left (`-translate-x-1/2 -translate-y-1/2 rotate-[135deg] w-40`, the treatment `FloralHeader` uses for its left corner); `FloralHeader` is not used because it places two clusters. Tulip corner `w-16` bottom-right mirrored (`-scale-x-100`). Bottom divider `w-28`, `bottom-4`, centred, `data-letter-divider`.
- **Two-column body via grid; header block centred inside the left column.** `grid grid-cols-2 gap-5 items-center h-full`. Left column: a centred stack (`flex flex-col items-center text-center`) of eyebrow, names, and header divider (`mx-auto mt-1 w-28`, `data-letter-header-divider`) — the `FloralHeading` pattern — followed by the left-aligned greeting and copy (`text-sm leading-relaxed`). Right column centred: QR `35mm`, "Scan to RSVP, or visit", fallback URL `break-all`.
- **Names copy the site header's classes, not its size.** `font-display text-4xl font-light italic text-ink` with `Ciera <span class="text-petal">&amp;</span> Martin`, i.e. the header's `font-light italic` and petal ampersand at the letter's existing 36px (header is 24px; type sizes are frozen for this change). Alternative: reuse `FloralHeading` — rejected, it hard-codes `text-5xl sm:text-6xl` and a `w-40` divider.
- **Chunk parties into pairs in a `computed`.** `sheets = chunk(letters, 2)`; a sheet with one letter renders an empty second slot (keeps guides and sheet size identical). This also covers the `?party=` single reprint with no special case.
- **Delete `PrintLetterBack.vue` rather than gate it.** A one-sided run has no verso; the component is 200+ lines of geometry nobody else uses. Git keeps it.
- **Tests assert structure, not pixels.** Sheet count ⌈n ÷ 2⌉ with `print-page-a5` (default) or `print-page-a4` (`?sheet=a4`), `[data-letter]` count = n each with its own QR, `[data-cut]` per A5 sheet, `[data-crop]` per A4 sheet, no `[data-letter-back]`, per-letter `[data-letter-divider]` and `[data-letter-header-divider]` with `mx-auto`, names `h1` carrying `font-light italic` and a `text-petal` ampersand, the toggle inside a `no-print` element, `FloralCluster` + `FloralTulipCorner` in the page source. Print fit and identical-to-preview stay `@manual`.

## Risks / Trade-offs

- [Body copy plus a long deadline string overflows the left column] → column is ~64 mm wide, copy runs ~5 lines at 14px with ~30 mm of slack in the canvas draft after the centred header. If a very long deadline string overflows, drop the eyebrow line before touching type size.
- [Long fallback URLs wrap in the right column] → `break-all` already applied; two lines fit under the QR.
- [User prints with "Fit to page" or "2 per sheet" anyway] → sheet is already 2-up; note "print at 100% / Actual size" in the print menu description.
- [Printer margins clip A4 crop marks] → marks sit 1.5 mm outside the trim, well inside typical 4–5 mm unprintable borders; the A5 sheet has no marks near an edge at all.
- [Toggle state lost on reload] → it is a preview control; the query param restores it when linked, and the default (A5) is the expected stock.
- [Existing back-page and bleed-regex scenarios fail once the layout changes] → the task group installs the updated feature file first (red), so those scenarios are gone or rewritten before the code moves.
- [Empty second slot on an odd sheet looks unfinished on screen] → blank cream, same as the paper; acceptable, only ever the last sheet.
