## 1. Print Foundation

- [ ] 1.1 Install print-materials.feature into tests/features/, write step defs (admin-only routes; print fidelity is @manual) — confirm red
- [ ] 1.2 Shared print stylesheet + `<PrintPage>` wrapper: @page presets (A5/A4/A2), exact colour, screen preview, page-break handling
- [ ] 1.3 Admin-guarded /admin/print/** route group with print landing page
- [ ] 1.4 Quality pass: admin-only scenario green; test, lint, typecheck; early fidelity check through Chrome print-to-PDF (manual)

## 2. RSVP Letters

- [ ] 2.1 Step defs for letter scenarios (batch view: one letter per party, per-party QR payload + fallback URL) — confirm red
- [ ] 2.2 QR generation utility (qrcode → SVG, party RSVP URL, level M)
- [ ] 2.3 A5 letter component: floral border (static site SVGs), party names, invite copy, QR ≥30mm + fallback URL
- [ ] 2.4 Batch view (all parties, page-break-after) + single-party reprint via query param
- [ ] 2.5 Quality pass: letter scenarios green; test, lint, typecheck; manual scan test (printed QR → phone → correct party)

## 3. Seating Chart & Place Cards

- [ ] 3.1 Step defs for chart-matches-editor and place-card ordering scenarios — confirm red
- [ ] 3.2 Read-only chart render from persisted layout, scaled to A2/A1, arm's-length type sizes, floral corners
- [ ] 3.3 Place cards: A4 tent-fold grid, fold/crop marks, name + meal marker, table/seat order
- [ ] 3.4 Quality pass: chart/place-card scenarios green; test, lint, typecheck

## 4. Handouts

- [ ] 4.1 Step defs for handout-from-JSON scenario — confirm red
- [ ] 4.2 handout.json structure + TS interface (ordered sections)
- [ ] 4.3 A5 handout render in site style
- [ ] 4.4 Quality pass: handout scenario green; test, lint, typecheck; full manual print pass (letters batch, chart, place cards, handout — PDF breaks, colour, scannability)
