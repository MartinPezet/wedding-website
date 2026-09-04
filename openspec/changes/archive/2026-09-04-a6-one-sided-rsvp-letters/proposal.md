## Why

The RSVP invite letters will be printed on a single-sided printer, so the current A5 front + decorative A5 back cannot be produced as designed. Moving to a single A6 side per party halves the paper, drops the verso, and keeps every letter printable in one pass; laying two letters on each sheet halves the print run again. The sheet stock is not yet fixed, so the print page must offer both A5 and A4 sheets without touching the letter itself.

## What Changes

- RSVP letters become **A6 landscape** (148 × 105 mm), front only, laid out per Option C ("Landscape") from the layout canvas: text column left, QR column right. **No type size changes.**
- Couple names on the letter take the **site header style**: light-weight italic Fraunces with the ampersand in `--color-petal`; the header floral divider is centred directly beneath the names.
- Letters print **two per sheet** at 1:1. A screen-only **sheet toggle** on the letters print page picks the stock:
  - **A5 portrait** (default): two A6 landscape halves, one dashed cut guide, no waste.
  - **A4 portrait**: the same pair centred on the sheet with crop marks outside every letter corner and cut line; the surrounding area is offcut.
  The on-screen preview shows the chosen sheets 1:1, so the PDF is identical to the render with no browser "pages per sheet" scaling.
- **BREAKING**: the decorative back page (`PrintLetterBack`) is removed; the batch PDF has ⌈parties ÷ 2⌉ sheets and nothing else.
- Floral furniture per letter: one hydrangea cluster (top left), one tulip corner (bottom right), header divider under the names, bottom divider under the columns.
- Print menu copy updated from "A5 invite letters" to "A6 invite letters, two per A5 or A4 sheet".

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `print-materials`:
  - "RSVP letters with personal QR codes" — A5 portrait → A6 landscape, header-style names with centred divider, two per sheet, A5/A4 sheet toggle, single-sided, batch sheet count ⌈n ÷ 2⌉, print identical to preview.
  - "Bottom divider on invite letters" — divider closes each letter rather than each page.
  - "Tulip corner art on letters and handout" — letters carry one tulip corner (bottom right) and one hydrangea cluster (top left).
  - "Decorative back page on RSVP invite letters" — **removed**.
  - "Letter back floral art follows the arch construction" — **removed** (only existed for the back page).

## Impact

- `app/pages/admin/print/letters.vue` — chunk parties into pairs; one `PrintPage` per pair (`a5` or `a4` from the toggle) holding two letter slots; A4 adds centring and crop marks; drop `<PrintLetterBack />`; per-slot floral art; header-style names; screen-only toggle.
- `app/components/PrintLetterBack.vue` — deleted.
- `app/pages/admin/print/index.vue` — description text.
- `tests/features/print-materials.feature`, `tests/steps/print-materials.steps.ts` — back-page rules removed; sheet/letter counts, cut guide, crop marks, toggle, per-letter divider, header-style names, cluster assertions.
- `PrintPage.vue` and `print.css` unchanged (both sheet sizes already exist; padding is zeroed per instance via the `--page-pad` custom property).
- No server, API, data, or dependency changes.
