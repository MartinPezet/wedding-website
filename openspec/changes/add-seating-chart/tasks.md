## 1. Data Model

- [ ] 1.1 Install seating-editor.feature into tests/features/, write step defs + unit tests (persistence, seat positions, assignment endpoints) — confirm red
- [ ] 1.2 Migration: tables table (name, shape, x, y, capacity, sortOrder); guests gain tableId + seatIndex
- [ ] 1.3 Seat-position utility: compute seat coordinates from shape + capacity
- [ ] 1.4 CRUD + assignment endpoints under /api/admin/seating (batched PATCH for autosave)
- [ ] 1.5 Quality pass: data-layer scenarios green; test, lint, typecheck

## 2. Editor Canvas

- [ ] 2.1 Component tests for canvas render + assignment state (drag simulated at state level) — confirm red
- [ ] 2.2 SVG canvas (fixed logical viewBox) rendering tables with names + seats
- [ ] 2.3 Table drag (pointer events), add/rename/delete/shape/capacity controls
- [ ] 2.4 Guest chip drag from sidebar onto seats; move between seats; unassign
- [ ] 2.5 Sidebar: attending guests grouped by party, meal badge, assigned-state dimming, unassigned count
- [ ] 2.6 Quality pass: seat/move scenarios green; test, lint, typecheck

## 3. Validation & Autosave

- [ ] 3.1 Step defs for warning + autosave scenarios (unseated flagged, declined orphan, reload fidelity) — confirm red
- [ ] 3.2 Warnings: unseated attendees, over-capacity tables, seated-but-declined orphans (one-click removal)
- [ ] 3.3 Debounced autosave on every mutation; reload restores state
- [ ] 3.4 Quality pass: all seating-editor scenarios green; test, lint, typecheck; manual pass with realistic dataset (~15 tables, ~150 guests: drag performance, tablet/touch)
