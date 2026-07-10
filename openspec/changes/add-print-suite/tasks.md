## 1. Print Foundation

- [ ] 1.1 Shared print stylesheet + `<PrintPage>` wrapper: @page presets (A5/A4/A2), exact colour, screen preview, page-break handling
- [ ] 1.2 Admin-guarded /admin/print/** route group with print landing page
- [ ] 1.3 Early fidelity check: test page through Chrome print-to-PDF (breaks, colours)

## 2. RSVP Letters

- [ ] 2.1 QR generation utility (qrcode → SVG, party RSVP URL, level M)
- [ ] 2.2 A5 letter component: floral border (static site SVGs), party names, invite copy, QR ≥30mm + fallback URL
- [ ] 2.3 Batch view (all parties, page-break-after) + single-party reprint via query param
- [ ] 2.4 Scan test: printed QR → phone → correct party identified

## 3. Seating Chart & Place Cards

- [ ] 3.1 Read-only chart render from persisted layout, scaled to A2/A1, arm's-length type sizes, floral corners
- [ ] 3.2 Place cards: A4 tent-fold grid, fold/crop marks, name + meal marker, table/seat order

## 4. Handouts

- [ ] 4.1 handout.json structure + TS interface (ordered sections)
- [ ] 4.2 A5 handout render in site style

## 5. Verification

- [ ] 5.1 Full print pass: letters batch, chart, place cards, handout — PDF output checked for breaks, colour, scannability
